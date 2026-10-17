import { describe, it, expect } from "vitest";
import { getStatus } from "./status";

function stubDb(row: Record<string, unknown> | null): D1Database {
  return {
    prepare: () => ({ first: async () => row }),
  } as unknown as D1Database;
}

describe("getStatus", () => {
  it("returns the stored geo update date and the bundled tzdata version", async () => {
    const status = await getStatus(
      stubDb({ geo_updated_at: "2026-10-14T15:04:05.000Z" }),
    );

    expect(status.geo_updated_at).toBe("2026-10-14T15:04:05.000Z");
    expect(status.tzdata_version).toMatch(/^\d{4}[a-z]$/);
  });

  it("returns null for the geo update date when no import has run", async () => {
    const status = await getStatus(stubDb(null));

    expect(status.geo_updated_at).toBeNull();
  });
});
