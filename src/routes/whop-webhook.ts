import { Hono } from "hono";
import { Whop } from "@whop/sdk";
import { HonoApp, Bindings } from "../types/api";
import { provisionKey, revokeKey } from "../services/whop";

// The discriminated union returned by the SDK's signature-verifying `unwrap`.
type WhopEvent = ReturnType<Whop["webhooks"]["unwrap"]>;

export const whopWebhookRouter = new Hono<HonoApp>();

/**
 * Routes a verified Whop webhook to key provisioning/revocation.
 * Whop collapses payment, cancellation, expiry, refund and chargeback into membership
 * validity transitions, so only the two activation events drive the key lifecycle.
 * Every branch is an idempotent ack; D1 errors bubble up to the global handler (-> 5xx, Whop retries).
 */
export async function handleWhopEvent(
  env: Bindings,
  event: WhopEvent,
): Promise<void> {
  switch (event.type) {
    case "membership.activated": {
      const m = event.data;
      const result = await provisionKey(env.ENTERPRISE_DB, {
        membershipId: m.id,
        productId: m.product.id,
        licenseKey: m.license_key,
      });
      if (result === "provisioned") {
        console.log(
          `whop: provisioned key for membership '${m.id}' (product ${m.product.id})`,
        );
      } else if (result === "unmapped_product") {
        console.log(
          `whop: ignoring activation for unmapped product '${m.product.id}' (membership ${m.id})`,
        );
      } else {
        console.error(
          `whop: membership '${m.id}' has no license_key; configure the product for License Key delivery`,
        );
      }
      return;
    }
    case "membership.deactivated": {
      const m = event.data;
      const revoked = await revokeKey(env.ENTERPRISE_DB, m.id);
      console.log(
        `whop: ${revoked ? "revoked" : "no matching"} key for deactivated membership '${m.id}'`,
      );
      return;
    }
    default:
      // Subscribed-but-unhandled event; ack so Whop stops retrying.
      console.log(`whop: ignoring event '${event.type}'`);
  }
}

whopWebhookRouter.post("/whop", async (c) => {
  const body = await c.req.text();
  const headers = Object.fromEntries(c.req.raw.headers);

  const whop = new Whop({
    apiKey: c.env.WHOP_API_KEY ?? "unused",
    webhookKey: btoa(c.env.WHOP_WEBHOOK_SECRET),
  });

  let event: WhopEvent;
  try {
    event = whop.webhooks.unwrap(body, { headers });
  } catch (err) {
    console.warn("whop: webhook signature verification failed", err);
    return c.json({ error: "Invalid webhook signature" }, 401);
  }

  await handleWhopEvent(c.env, event);

  return c.json({ ok: true });
});
