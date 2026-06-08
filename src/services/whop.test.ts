import { expect, describe, it } from "vitest";
import { resolveProductLimit, provisionKey, revokeKey } from "./whop";
import { sha256Hex } from "../utils/enterprise-key";

type Call = { sql: string; binds: unknown[] };

// Minimal D1 stub: queues `.first()` results and a single `.run()` result, records every bind.
function mockDb(opts: { firstResults?: unknown[]; runChanges?: number }): {
  db: D1Database;
  calls: Call[];
} {
  const calls: Call[] = [];
  const firstQueue = [...(opts.firstResults ?? [])];

  const db = {
    prepare(sql: string) {
      const stmt = {
        bind(...binds: unknown[]) {
          calls.push({ sql, binds });
          return stmt;
        },
        async first() {
          return firstQueue.shift() ?? null;
        },
        async run() {
          return { meta: { changes: opts.runChanges ?? 0 } };
        },
      };
      return stmt;
    },
  } as unknown as D1Database;

  return { db, calls };
}

describe("resolveProductLimit", () => {
  it("returns the finite limit for a mapped product", async () => {
    const { db } = mockDb({ firstResults: [{ request_limit: 1000 }] });
    expect(await resolveProductLimit(db, "prod_1")).toBe(1000);
  });

  it("returns null for a mapped but unlimited product", async () => {
    const { db } = mockDb({ firstResults: [{ request_limit: null }] });
    expect(await resolveProductLimit(db, "prod_1")).toBeNull();
  });

  it("returns undefined for an unmapped product", async () => {
    const { db } = mockDb({ firstResults: [] });
    expect(await resolveProductLimit(db, "prod_unknown")).toBeUndefined();
  });
});

describe("provisionKey", () => {
  it("inserts the hashed license key with an upsert and membership label", async () => {
    const { db, calls } = mockDb({
      firstResults: [{ request_limit: 1000 }],
      runChanges: 1,
    });

    const result = await provisionKey(db, {
      membershipId: "mem_1",
      productId: "prod_1",
      licenseKey: "LIC-ABC",
    });

    expect(result).toBe("provisioned");
    const insert = calls.find((c) =>
      c.sql.includes("insert into enterprise_keys"),
    );
    expect(insert).toBeDefined();
    expect(insert!.sql).toContain("on conflict(key_hash) do update");
    expect(insert!.binds).toEqual([
      await sha256Hex("LIC-ABC"),
      "whop:mem_1",
      1000,
      "mem_1",
    ]);
  });

  it("skips unmapped products without inserting", async () => {
    const { db, calls } = mockDb({ firstResults: [] });

    const result = await provisionKey(db, {
      membershipId: "mem_1",
      productId: "prod_unknown",
      licenseKey: "LIC-ABC",
    });

    expect(result).toBe("unmapped_product");
    expect(calls.some((c) => c.sql.includes("insert into"))).toBe(false);
  });

  it("skips memberships missing a license key", async () => {
    const { db, calls } = mockDb({ firstResults: [{ request_limit: 1000 }] });

    const result = await provisionKey(db, {
      membershipId: "mem_1",
      productId: "prod_1",
      licenseKey: null,
    });

    expect(result).toBe("missing_license_key");
    expect(calls.some((c) => c.sql.includes("insert into"))).toBe(false);
  });
});

describe("revokeKey", () => {
  it("returns true when a key was deleted", async () => {
    const { db, calls } = mockDb({ runChanges: 1 });
    expect(await revokeKey(db, "mem_1")).toBe(true);
    expect(calls[0].sql).toContain("delete from enterprise_keys");
    expect(calls[0].binds).toEqual(["mem_1"]);
  });

  it("returns false when no key matched", async () => {
    const { db } = mockDb({ runChanges: 0 });
    expect(await revokeKey(db, "mem_missing")).toBe(false);
  });
});
