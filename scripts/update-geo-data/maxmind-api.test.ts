import { describe, it, expect } from "vitest";
import { httpDateToIso } from "./maxmind-api";

describe("httpDateToIso", () => {
  it("converts an HTTP date to ISO 8601 in UTC", () => {
    expect(httpDateToIso("Tue, 14 Oct 2026 15:04:05 GMT")).toBe(
      "2026-10-14T15:04:05.000Z",
    );
  });

  it("throws on an unparseable date", () => {
    expect(() => httpDateToIso("not a date")).toThrow(
      "Invalid HTTP date: not a date",
    );
  });
});
