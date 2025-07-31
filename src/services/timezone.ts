import * as tc from "timezonecomplete";

export function getTimeZones() {
  return tc.TzDatabase.instance().zoneNames();
}

export function getTimeZonesByArea(area: string) {
  return getTimeZones()
    .filter(tz => tz.startsWith(area + '/'));
}
