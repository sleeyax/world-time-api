import { expect, describe, it } from "vitest";
import { Webhook } from "standardwebhooks";
import { whopWebhookRouter, handleWhopEvent } from "./whop-webhook";

// No SDK mock: we sign requests for real with the same lib the SDK verifies with,
// so the tests exercise actual signature verification end-to-end.
const SECRET = "test-webhook-secret";
// The route passes `btoa(secret)` as the webhookKey, so sign with the matching key.
const signer = new Webhook(btoa(SECRET));

type Call = { sql: string; binds: unknown[] };

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

function env(db: D1Database) {
  return { ENTERPRISE_DB: db, WHOP_WEBHOOK_SECRET: SECRET } as never;
}

// Build a request whose body is correctly signed (optionally tampered to force a failure).
function signedRequest(
  payload: unknown,
  { tamper = false }: { tamper?: boolean } = {},
): RequestInit {
  const body = JSON.stringify(payload);
  const id = "msg_test";
  const timestamp = new Date();
  const signature = tamper ? "v1,AAAA" : signer.sign(id, timestamp, body);
  return {
    method: "POST",
    body,
    headers: {
      "content-type": "application/json",
      "webhook-id": id,
      "webhook-timestamp": String(Math.floor(timestamp.getTime() / 1000)),
      "webhook-signature": signature,
    },
  };
}

const activated = (overrides: Record<string, unknown> = {}) =>
  ({
    type: "membership.activated",
    data: {
      id: "mem_1",
      product: { id: "prod_1" },
      license_key: "LIC-ABC",
      ...overrides,
    },
  }) as never;

const deactivated = () =>
  ({ type: "membership.deactivated", data: { id: "mem_1" } }) as never;

describe("handleWhopEvent", () => {
  it("provisions a key on membership.activated", async () => {
    const { db, calls } = mockDb({
      firstResults: [{ request_limit: 1000 }],
      runChanges: 1,
    });
    await handleWhopEvent(env(db), activated());
    expect(
      calls.some((c) => c.sql.includes("insert into enterprise_keys")),
    ).toBe(true);
  });

  it("revokes a key on membership.deactivated", async () => {
    const { db, calls } = mockDb({ runChanges: 1 });
    await handleWhopEvent(env(db), deactivated());
    expect(
      calls.some((c) => c.sql.includes("delete from enterprise_keys")),
    ).toBe(true);
  });

  it("ignores unrelated events without touching the db", async () => {
    const { db, calls } = mockDb({});
    await handleWhopEvent(env(db), {
      type: "payment.created",
      data: {},
    } as never);
    expect(calls).toHaveLength(0);
  });
});

describe("POST /whop", () => {
  it("rejects a tampered signature with 401 and no writes", async () => {
    const { db, calls } = mockDb({});
    const res = await whopWebhookRouter.request(
      "/whop",
      signedRequest(activated(), { tamper: true }),
      env(db),
    );
    expect(res.status).toBe(401);
    expect(calls).toHaveLength(0);
  });

  it("acks 200 and provisions on a valid activated webhook", async () => {
    const { db, calls } = mockDb({
      firstResults: [{ request_limit: 1000 }],
      runChanges: 1,
    });
    const res = await whopWebhookRouter.request(
      "/whop",
      signedRequest(activated()),
      env(db),
    );
    expect(res.status).toBe(200);
    expect(
      calls.some((c) => c.sql.includes("insert into enterprise_keys")),
    ).toBe(true);
  });

  it("acks 200 on an unmapped product without provisioning", async () => {
    const { db, calls } = mockDb({ firstResults: [] });
    const res = await whopWebhookRouter.request(
      "/whop",
      signedRequest(activated({ product: { id: "prod_unknown" } })),
      env(db),
    );
    expect(res.status).toBe(200);
    expect(calls.some((c) => c.sql.includes("insert into"))).toBe(false);
  });
});
