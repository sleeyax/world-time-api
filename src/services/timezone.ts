import TzData from "tzdata";

export function getTimeZones() {
  return Object.keys(TzData.zones).sort();
}

export function getTimeZonesByArea(area: string) {
  return Object.keys(TzData.zones)
    .filter(tz => tz.startsWith(area + '/'))
    .sort();
}
