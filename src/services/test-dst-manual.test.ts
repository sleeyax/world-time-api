import { DateTime, utc } from "timezonecomplete";
import { getTime } from "./timezone";
import { describe, it, expect } from "vitest";

describe("DST Issue Investigation", () => {
  it("should correctly handle DST for Europe/Amsterdam on 2025-10-26", () => {
    // The issue example shows 2025-10-26T09:07:53.969+01 (local time)
    // Which is 2025-10-26T08:07:53.969 UTC
    const utcDateTime = new DateTime("2025-10-26T08:07:53.966+00:00");
    const result = getTime("Europe/Amsterdam", utcDateTime);

    console.log("\n=== Testing Europe/Amsterdam at 2025-10-26T08:07:53.966 UTC ===");
    console.log(JSON.stringify(result, null, 2));
    console.log("\nAnalysis:");
    console.log("- Current datetime:", result.datetime);
    console.log("- DST active:", result.dst);
    console.log("- DST from:", result.dst_from);
    console.log("- DST until:", result.dst_until);
    console.log("- UTC offset:", result.utc_offset);
    console.log("- Raw offset:", result.raw_offset);
    console.log("- DST offset:", result.dst_offset);

    // According to the issue:
    // - dst should be true (we're still in DST at this time)
    // - dst_from and dst_until should be swapped
  });

  it("should test DST transitions around Oct 26, 2025 for Europe/Amsterdam", () => {
    // DST ends on last Sunday of October 2025, which is Oct 26
    // At 3:00 AM CEST (02:00 UTC), clocks go back to 2:00 AM CET
    
    // Before DST ends (still in DST)
    const beforeDstEnd = new DateTime("2025-10-26T00:00:00+00:00");
    const resultBefore = getTime("Europe/Amsterdam", beforeDstEnd);
    console.log("\n=== Before DST ends (2025-10-26T00:00:00 UTC) ===");
    console.log("DST active:", resultBefore.dst);
    console.log("UTC offset:", resultBefore.utc_offset);
    console.log("DST from:", resultBefore.dst_from);
    console.log("DST until:", resultBefore.dst_until);

    // After DST ends (no longer in DST)
    const afterDstEnd = new DateTime("2025-10-26T03:00:00+00:00");
    const resultAfter = getTime("Europe/Amsterdam", afterDstEnd);
    console.log("\n=== After DST ends (2025-10-26T03:00:00 UTC) ===");
    console.log("DST active:", resultAfter.dst);
    console.log("UTC offset:", resultAfter.utc_offset);
    console.log("DST from:", resultAfter.dst_from);
    console.log("DST until:", resultAfter.dst_until);
  });
});
