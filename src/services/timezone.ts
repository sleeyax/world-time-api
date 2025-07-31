import * as tc from "timezonecomplete";
import { DateTimeJsonResponse } from "../types/api";

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
  const unixTime = dateTime.unixUtcMillis();
  const utcOffset = dateTime.offsetDuration();
  const utcOffsetRaw = dateTime.standardOffsetDuration();
  const dayOfWeek = dateTime.weekDay();
  const dayOfYear = dateTime.dayOfYear() + 1; // starts counting at 0
  const weekNumber = dateTime.weekNumber();
  const abbreviation = dateTime.zoneAbbreviation();
  const dst = timezone.dst();
  const dstOffset = dst ? utcOffset.seconds() - utcOffsetRaw.seconds() : 0;
  const dstTransitions = getDstTransitions(timezone.name(), dateTime.year());

  return {
    utc_datetime: utcDateTime.toIsoString(),
    datetime: dateTime.toIsoString(),
    utc_offset: toHmString(utcOffset),
    timezone: timezone.name(),
    day_of_week: dayOfWeek,
    day_of_year: dayOfYear,
    unixtime: unixTime,
    raw_offset: utcOffsetRaw.seconds(),
    week_number: weekNumber,
    dst: dst,
    abbreviation,
    dst_offset: dstOffset,
    dst_from: dstTransitions.dstStart?.toIsoString() ?? null,
    dst_until: dstTransitions.dstEnd?.toIsoString() ?? null,
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

function toHmString(duration: tc.Duration): string {
  return duration.toFullString().split(":").slice(0, 2).join(":");
}
