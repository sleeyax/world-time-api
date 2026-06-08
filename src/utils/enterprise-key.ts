/**
 * Computes the SHA-256 digest of `input` as a lowercase hex string.
 * Used to hash raw keys before comparing them against the DB.
 *
 * @param input - The string to hash.
 * @returns The 64-character lowercase hex digest.
 */
export async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Returns the UTC calendar-month bucket for `now`, formatted as `YYYY-MM`.
 *
 * @param now - The instant to bucket.
 * @returns The `YYYY-MM` period string.
 */
export function monthlyPeriod(now: Date): string {
  return now.toISOString().slice(0, 7);
}

/**
 * Returns the UTC epoch seconds of the first instant of the month *after* `period`.
 * e.g. `'2026-06'` -> 2026-07-01T00:00:00Z, `'2026-12'` -> 2027-01-01T00:00:00Z.
 *
 * @param period - A `YYYY-MM` period string.
 * @returns The reset time as epoch seconds.
 */
export function periodResetEpoch(period: string): number {
  const [year, month] = period.split("-").map(Number);
  // `month` is 1-based; Date.UTC month is 0-based, so passing `month` yields the next month.
  return Date.UTC(year, month, 1) / 1000;
}

/**
 * Builds the `X-RateLimit-*` headers for a metered (limited) key.
 * Remaining is clamped to 0.
 *
 * @param limit - The monthly request limit.
 * @param count - Requests consumed so far this period.
 * @param reset - Reset time as epoch seconds (see {@link periodResetEpoch}).
 * @returns A map of rate-limit header names to values.
 */
export function rateLimitHeaders(
  limit: number,
  count: number,
  reset: number,
): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(limit),
    "X-RateLimit-Remaining": String(Math.max(0, limit - count)),
    "X-RateLimit-Reset": String(reset),
  };
}
