import { Context, MiddlewareHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import { HonoApp } from "../types/api";
import {
  monthlyPeriod,
  periodResetEpoch,
  rateLimitHeaders,
  sha256Hex,
} from "../utils/enterprise-key";

// Cache resolved key config per isolate to avoid a D1 read on every request.
// Keys rarely change; a stale window of up to TTL is acceptable. Redeploy to flush immediately.
const ENTERPRISE_KEY_TTL_MS = 24 * 60 * 60 * 1000;

type CachedKey = {
  hash: string;
  name: string;
  limit: number | null;
  expires: number;
};

const enterpriseKeyCache = new Map<string, CachedKey>();

type Usage = {
  allowed: boolean;
  count: number;
  limit: number | null;
  reset: number;
};

// Resolve a raw key to its config via cache, falling back to a D1 lookup by hash.
// Only cache hits; misses are not cached (random invalid keys would grow the cache unbounded).
async function lookupEnterpriseKey(
  db: D1Database,
  rawKey: string,
): Promise<CachedKey | null> {
  const cached = enterpriseKeyCache.get(rawKey);
  if (cached && cached.expires > Date.now()) {
    return cached;
  }

  const hash = await sha256Hex(rawKey);
  const row = await db
    .prepare(
      "select name, request_limit from enterprise_keys where key_hash = ?",
    )
    .bind(hash)
    .first<{ name: string; request_limit: number | null }>();

  if (!row) return null;

  const record: CachedKey = {
    hash,
    name: row.name,
    limit: row.request_limit,
    expires: Date.now() + ENTERPRISE_KEY_TTL_MS,
  };
  enterpriseKeyCache.set(rawKey, record);
  return record;
}

// Meter the request and decide whether it's allowed.
// Only allowed requests increment the counter (a 429'd request does not consume quota).
async function recordUsageAndCheck(
  db: D1Database,
  hash: string,
  limit: number | null,
): Promise<Usage> {
  const period = monthlyPeriod(new Date());
  const reset = periodResetEpoch(period);

  // A non-positive limit grants nothing; reject without a write (such a key should be revoked).
  if (limit !== null && limit <= 0) {
    return { allowed: false, count: 0, limit, reset };
  }

  if (limit === null) {
    // Unlimited: meter for visibility, always allow.
    const row = await db
      .prepare(
        "insert into enterprise_key_usage (key_hash, period, count) values (?, ?, 1) on conflict(key_hash, period) do update set count = count + 1 returning count",
      )
      .bind(hash, period)
      .first<{ count: number }>();
    return { allowed: true, count: row?.count ?? 1, limit, reset };
  }

  // Limited: conditional atomic increment. A row is returned only when it actually counted.
  const row = await db
    .prepare(
      "insert into enterprise_key_usage (key_hash, period, count) values (?, ?, 1) on conflict(key_hash, period) do update set count = count + 1 where count < ? returning count",
    )
    .bind(hash, period, limit)
    .first<{ count: number }>();

  if (row) {
    return { allowed: true, count: row.count, limit, reset };
  }

  // No row -> the `where count < limit` guard blocked the update (already at the cap).
  return { allowed: false, count: limit, limit, reset };
}

// Emit rate-limit headers for limited keys only (unlimited keys are metered but unbounded).
// Called after next() so downstream response rebuilds don't drop them.
function setRateLimitHeaders(c: Context<HonoApp>, usage: Usage): void {
  if (usage.limit === null) return;
  const headers = rateLimitHeaders(usage.limit, usage.count, usage.reset);
  for (const [name, value] of Object.entries(headers)) {
    c.res.headers.set(name, value);
  }
}

export const authMiddleware: MiddlewareHandler<HonoApp> = async (c, next) => {
  if (c.req.path === "/api/ping" || c.req.path === "/webhooks/whop") {
    return next();
  }

  if (process.env.NODE_ENV === "development") {
    return next();
  }

  const enterpriseKey = c.req.header("x-enterprise-key");
  if (enterpriseKey) {
    const record = await lookupEnterpriseKey(
      c.env.ENTERPRISE_DB,
      enterpriseKey,
    );
    if (record) {
      console.log(`auth: enterprise key '${record.name}'`);
      const usage = await recordUsageAndCheck(
        c.env.ENTERPRISE_DB,
        record.hash,
        record.limit,
      );
      if (!usage.allowed) {
        // Over quota: short-circuit with a 429 (no fall-through to RapidAPI).
        setRateLimitHeaders(c, usage);
        return c.json({ error: "Monthly request limit exceeded" }, 429);
      }
      await next();
      setRateLimitHeaders(c, usage);
      return;
    }
  }

  const headerKey = "X-RapidAPI-Proxy-Secret";
  const key = c.req.header(headerKey);
  if (key !== process.env.RAPID_API_SECRET) {
    throw new HTTPException(401, {
      message: "Unauthorized",
      cause: `Invalid or missing ${headerKey} header`,
    });
  }

  await next();
};
