import { formatAsText } from "./formatter";
import { expect, describe, it } from "vitest";

describe("formatAsText", () => {
  describe("array formatting", () => {
    it("should format array of strings as newline-separated text", () => {
      const input = ["America/New_York", "Europe/London", "Asia/Tokyo"];
      const expected = "America/New_York\nEurope/London\nAsia/Tokyo";

      expect(formatAsText(input)).toBe(expected);
    });

    it("should handle empty array", () => {
      const input: string[] = [];
      const expected = "";

      expect(formatAsText(input)).toBe(expected);
    });

    it("should handle single item array", () => {
      const input = ["America/New_York"];
      const expected = "America/New_York";

      expect(formatAsText(input)).toBe(expected);
    });
  });

  describe("object formatting", () => {
    it("should format object as key-value pairs", () => {
      const input = {
        timezone: "America/New_York",
        datetime: "2023-12-07T10:30:00-05:00",
        utc_offset: "-05:00",
      };
      const expected =
        "timezone: America/New_York\ndatetime: 2023-12-07T10:30:00-05:00\nutc_offset: -05:00";

      expect(formatAsText(input)).toBe(expected);
    });

    it("should handle empty object", () => {
      const input = {};
      const expected = "";

      expect(formatAsText(input)).toBe(expected);
    });

    it("should handle object with single property", () => {
      const input = { timezone: "UTC" };
      const expected = "timezone: UTC";

      expect(formatAsText(input)).toBe(expected);
    });
  });

  describe("error handling", () => {
    it("should throw error for unsupported data types", () => {
      expect(() => formatAsText("string" as any)).toThrow(
        "Unsupported data type for text formatting",
      );
      expect(() => formatAsText(123 as any)).toThrow(
        "Unsupported data type for text formatting",
      );
      expect(() => formatAsText(null as any)).toThrow(
        "Unsupported data type for text formatting",
      );
    });
  });
});
