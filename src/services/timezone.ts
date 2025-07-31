import * as tc from "timezonecomplete";
import { DateTimeJsonResponse } from "../types/api";
import { toHmString, toISOWithoutFractionalZeros } from "../utils/world-time-compatibility";

export function getTimeZones() {
  return tc.TzDatabase.instance().zoneNames();
}

export function getTimeZonesByArea(area: string) {
  return getTimeZones()
    .filter(tz => tz.startsWith(area + '/'));
}

export function getTime(zone: string[] | string, utcDateTime: tc.DateTime = tc.DateTime.nowUtc()): DateTimeJsonResponse {
  const timezone = tc.TimeZone.zone(Array.isArray(zone) ? zone.join('/') : zone);
  const dateTime = utcDateTime.toZone(timezone);
  const unixTimeMillis = dateTime.unixUtcMillis();
  const unizTimeSeconds = Math.floor(unixTimeMillis / 1000);
  const utcOffset = dateTime.offsetDuration();
  const utcOffsetRaw = dateTime.standardOffsetDuration();
  const dayOfWeek = dateTime.weekDay();
  const dayOfYear = dateTime.dayOfYear() + 1; // starts counting at 0
  const weekNumber = dateTime.weekNumber();
  const abbreviation = dateTime.zoneAbbreviation();
  const dst = timezone.dst();
  const dstOffset = dst ? utcOffset.seconds() - utcOffsetRaw.seconds() : 0;
  const dstTransitions = getDstTransitions(timezone.name(), dateTime.year());
  const dstFrom = dstTransitions.dstStart ? toISOWithoutFractionalZeros(dstTransitions.dstStart.toIsoString()) : null;
  const dstUntil = dstTransitions.dstEnd ? toISOWithoutFractionalZeros(dstTransitions.dstEnd.toIsoString()) : null;

  return {
    abbreviation,
    datetime: dateTime.toIsoString(),
    day_of_week: dayOfWeek,
    day_of_year: dayOfYear,
    dst: dst,
    dst_from: dstFrom,
    dst_offset: dstOffset,
    dst_until: dstUntil,
    raw_offset: utcOffsetRaw.seconds(),
    timezone: timezone.name(),
    unixtime: unizTimeSeconds,
    utc_datetime: utcDateTime.toIsoString(),
    utc_offset: toHmString(utcOffset),
    week_number: weekNumber,
  }
}

function getDstTransitions(zoneName: string, year: number): { dstStart: tc.DateTime | null, dstEnd: tc.DateTime | null } {
  const db = tc.TzDatabase.instance();
  
  if (!db.hasDst(zoneName)) {
    return { dstStart: null, dstEnd: null };
  }

  // Start from beginning of year
  const startOfYear = new tc.DateTime(year, 1, 1, 0, 0, 0, 0, tc.utc()).unixUtcMillis();
  
  // Find next two DST changes from start of year
  const firstChange = db.nextDstChange(zoneName, startOfYear);
  const secondChange = firstChange ? db.nextDstChange(zoneName, firstChange) : null;
  
  return { 
    dstStart: firstChange ? new tc.DateTime(firstChange, tc.utc()) : null,
    dstEnd: secondChange ? new tc.DateTime(secondChange, tc.utc()) : null
  };
}
