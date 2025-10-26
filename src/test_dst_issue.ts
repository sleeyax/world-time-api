import { getTime } from "./services/timezone";
import { DateTime } from "timezonecomplete";

// Reproduce the issue from the bug report
// Date: 2025-10-26T09:07:53.969+01 (CET timezone)
// This is October 26, 2025, which should be AFTER DST ends (last Sunday of October)
// In 2025, DST ends on October 26 at 03:00 (clocks go back from 03:00 to 02:00)

const utcDateTime = new DateTime("2025-10-26T08:07:53.966");
const result = getTime("Europe/Amsterdam", utcDateTime);

console.log("Testing Europe/Amsterdam at 2025-10-26T08:07:53.966 UTC");
console.log(JSON.stringify(result, null, 2));
console.log("\nAnalysis:");
console.log("- Current datetime:", result.datetime);
console.log("- DST active:", result.dst);
console.log("- DST from:", result.dst_from);
console.log("- DST until:", result.dst_until);
console.log("- UTC offset:", result.utc_offset);
console.log("- Raw offset:", result.raw_offset);
console.log("- DST offset:", result.dst_offset);

// The issue says dst should be true (we're in DST) 
// and dst_from/dst_until should be swapped
