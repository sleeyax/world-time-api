import TzData from "tzdata";

export function getTimeZones() {
  return Object.keys(TzData.zones).sort();
}
