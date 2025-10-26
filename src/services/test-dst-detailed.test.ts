import { DateTime } from "timezonecomplete";
import { getTime } from "./timezone";
import { describe, it } from "vitest";

describe("DST Detailed Investigation", () => {
  it("should test various times around the Oct 26, 2025 DST transition", () => {
    // DST ends on Oct 26, 2025 at 01:00 UTC (03:00 CEST -> 02:00 CET)
    
    const times = [
      { utc: "2025-10-26T00:30:00+00:00", desc: "30 min before DST ends" },
      { utc: "2025-10-26T00:59:00+00:00", desc: "1 min before DST ends" },
      { utc: "2025-10-26T01:00:00+00:00", desc: "Exact DST end time" },
      { utc: "2025-10-26T01:01:00+00:00", desc: "1 min after DST ends" },
      { utc: "2025-10-26T08:07:53.966+00:00", desc: "Issue example time (08:07 UTC)" },
    ];
    
    for (const { utc, desc } of times) {
      const dt = new DateTime(utc);
      const result = getTime("Europe/Amsterdam", dt);
      console.log(`\n=== ${desc} ===`);
      console.log(`UTC: ${utc}`);
      console.log(`Local: ${result.datetime}`);
      console.log(`DST: ${result.dst}`);
      console.log(`UTC offset: ${result.utc_offset}`);
      console.log(`dst_from: ${result.dst_from}`);
      console.log(`dst_until: ${result.dst_until}`);
    }
  });
  
  it("should check what Europe/Paris returns (for comparison)", () => {
    // Paris uses the same timezone rules as Amsterdam
    const utcDateTime = new DateTime("2025-10-26T08:07:53.966+00:00");
    const result = getTime("Europe/Paris", utcDateTime);
    
    console.log("\n=== Europe/Paris at issue example time ===");
    console.log(JSON.stringify(result, null, 2));
  });
});
