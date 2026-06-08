import { sha256Hex } from "../utils/enterprise-key";

// Outcome of attempting to provision a key for a membership.
// All outcomes are non-error acks; only the first actually grants access.
export type ProvisionResult =
  | "provisioned" // key created or refreshed
  | "unmapped_product" // product not in whop_plans -> no key (allowlist miss)
  | "missing_license_key"; // membership has no Whop license key (product not License-Key delivery)

/**
 * Resolves a Whop product's monthly request limit from `whop_plans`.
 *
 * @returns the limit (`number`), `null` for an explicitly unlimited product,
 *          or `undefined` when the product is not listed (not API-granting).
 */
export async function resolveProductLimit(
  db: D1Database,
  productId: string,
): Promise<number | null | undefined> {
  const row = await db
    .prepare("select request_limit from whop_plans where product_id = ?")
    .bind(productId)
    .first<{ request_limit: number | null }>();

  // `null` row -> unmapped product; `null` request_limit -> mapped but unlimited.
  return row ? row.request_limit : undefined;
}

/**
 * Provisions (or refreshes) an enterprise key for a Whop membership.
 * We store only the SHA-256 hash of the Whop-issued license key, never the key itself.
 * Idempotent: re-firing for the same membership/license key upserts the limit by `key_hash`.
 */
export async function provisionKey(
  db: D1Database,
  params: {
    membershipId: string;
    productId: string;
    licenseKey: string | null;
  },
): Promise<ProvisionResult> {
  const limit = await resolveProductLimit(db, params.productId);
  if (limit === undefined) {
    return "unmapped_product";
  }
  if (!params.licenseKey) {
    return "missing_license_key";
  }

  const hash = await sha256Hex(params.licenseKey);
  await db
    .prepare(
      `insert into enterprise_keys (key_hash, name, request_limit, whop_membership_id)
       values (?, ?, ?, ?)
       on conflict(key_hash) do update set
         request_limit = excluded.request_limit,
         whop_membership_id = excluded.whop_membership_id`,
    )
    .bind(hash, `whop:${params.membershipId}`, limit, params.membershipId)
    .run();

  return "provisioned";
}

/**
 * Revokes the enterprise key tied to a Whop membership.
 *
 * @returns `true` if a key was deleted, `false` if none matched (already revoked / never created).
 */
export async function revokeKey(
  db: D1Database,
  membershipId: string,
): Promise<boolean> {
  const result = await db
    .prepare("delete from enterprise_keys where whop_membership_id = ?")
    .bind(membershipId)
    .run();

  return (result.meta.changes ?? 0) > 0;
}
