import { expect, describe, it } from "vitest";
import {
  sha256Hex,
  monthlyPeriod,
  periodResetEpoch,
  rateLimitHeaders,
} from "./enterprise-key";

describe("sha256Hex", () => {
  it("matches a known vector", async () => {
    expect(await sha256Hex("abc")).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });
});

describe("monthlyPeriod", () => {
  it("returns the UTC YYYY-MM bucket", () => {
    expect(monthlyPeriod(new Date("2026-06-08T12:00:00Z"))).toBe("2026-06");
  });
});

describe("periodResetEpoch", () => {
  it("returns the first instant of the next month, UTC", () => {
    expect(periodResetEpoch("2026-06")).toBe(Date.UTC(2026, 6, 1) / 1000);
  });

  it("rolls December over to January of the next year", () => {
    expect(periodResetEpoch("2026-12")).toBe(Date.UTC(2027, 0, 1) / 1000);
  });
});

describe("rateLimitHeaders", () => {
  const reset = 1234567890;

  it("reports remaining below the limit", () => {
    expect(rateLimitHeaders(100, 40, reset)).toEqual({
      "X-RateLimit-Limit": "100",
      "X-RateLimit-Remaining": "60",
      "X-RateLimit-Reset": String(reset),
    });
  });

  it("reports 0 remaining at the limit", () => {
    expect(rateLimitHeaders(100, 100, reset)["X-RateLimit-Remaining"]).toBe(
      "0",
    );
  });

  it("clamps remaining to 0 over the limit", () => {
    expect(rateLimitHeaders(100, 150, reset)["X-RateLimit-Remaining"]).toBe(
      "0",
    );
  });
});
