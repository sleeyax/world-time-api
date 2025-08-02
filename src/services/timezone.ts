import { DateTimeJsonResponse } from "../types/api";
import { tc } from "../utils/timezone-data";
import {
  toHmString,
  toISOWithoutFractionalZeros,
} from "../utils/world-time-compatibility";

export function getTimeZones() {
  return tc.TzDatabase.instance().zoneNames();
}

export function getTimeZonesByArea(area: string) {
  return getTimeZones().filter((tz) => tz.startsWith(area + "/"));
}

export function getTime(
  zone: string[] | string,
  utcDateTime: tc.DateTime = tc.DateTime.nowUtc(),
): DateTimeJsonResponse {
  const timezone = tc.TimeZone.zone(
    Array.isArray(zone) ? zone.join("/") : zone,
  );
  const dateTime = utcDateTime.toZone(timezone);
  const unixTimeMillis = dateTime.unixUtcMillis();
  const unizTimeSeconds = Math.floor(unixTimeMillis / 1000);
  const utcOffset = dateTime.offsetDuration();
  const utcOffsetRaw = dateTime.standardOffsetDuration();
  const dayOfWeek = dateTime.weekDay();
  const dayOfYear = dateTime.dayOfYear() + 1; // starts counting at 0
  const weekNumber = dateTime.weekNumber();
  const abbreviation = getZoneAbbreviation(dateTime, utcOffset);
  const dst = utcOffset.seconds() !== utcOffsetRaw.seconds();
  const dstOffset = normalizeZero(
    dst ? utcOffset.seconds() - utcOffsetRaw.seconds() : 0,
  );
  const dstTransitions = dst
    ? getDstTransitions(timezone.name(), dateTime.year())
    : { dstStart: null, dstEnd: null };
  const dstFrom = dstTransitions.dstStart
    ? toISOWithoutFractionalZeros(dstTransitions.dstStart.toIsoString())
    : null;
  const dstUntil = dstTransitions.dstEnd
    ? toISOWithoutFractionalZeros(dstTransitions.dstEnd.toIsoString())
    : null;
  const rawOffset = normalizeZero(utcOffsetRaw.seconds());

  return {
    utc_offset: toHmString(utcOffset),
    timezone: timezone.name(),
    day_of_week: dayOfWeek,
    day_of_year: dayOfYear,
    datetime: dateTime.toIsoString(),
    utc_datetime: utcDateTime.toIsoString(),
    unixtime: unizTimeSeconds,
    raw_offset: rawOffset,
    week_number: weekNumber,
    dst: dst,
    abbreviation,
    dst_offset: dstOffset,
    dst_from: dstFrom,
    dst_until: dstUntil,
  };
}

function getDstTransitions(
  zoneName: string,
  year: number,
): { dstStart: tc.DateTime | null; dstEnd: tc.DateTime | null } {
  const db = tc.TzDatabase.instance();

  if (!db.hasDst(zoneName)) {
    return { dstStart: null, dstEnd: null };
  }

  // Start from beginning of year
  const startOfYear = new tc.DateTime(
    year,
    1,
    1,
    0,
    0,
    0,
    0,
    tc.utc(),
  ).unixUtcMillis();

  // Find next two DST changes from start of year
  const firstChange = db.nextDstChange(zoneName, startOfYear);
  const secondChange = firstChange
    ? db.nextDstChange(zoneName, firstChange)
    : null;

  return {
    dstStart: firstChange ? new tc.DateTime(firstChange, tc.utc()) : null,
    dstEnd: secondChange ? new tc.DateTime(secondChange, tc.utc()) : null,
  };
}

function getZoneAbbreviation(dateTime: tc.DateTime, utcOffset: tc.Duration) {
  let abbreviation = dateTime.zoneAbbreviation();

  // Fallback in case it's an unknown zones.
  if (abbreviation === "%z" || abbreviation === "") {
    // Extract abbreviation from UTC offset
    // "+01:00" -> "+01", "-09:30" -> "-0930", "+03:00" -> "+03"
    const offsetString = toHmString(utcOffset);
    if (offsetString.endsWith(":00")) {
      // Remove ":00" for hour-only offsets (e.g., "+01:00" -> "+01")
      abbreviation = offsetString.slice(0, -3);
    } else {
      // Remove colon for offsets with minutes (e.g., "-09:30" -> "-0930")
      abbreviation = offsetString.replace(":", "");
    }
  }

  return abbreviation;
}

/**
 * Converts a number to 0 if it is -0 or +0, otherwise returns the number as is.
 */
function normalizeZero(value: number) {
  return value === 0 ? 0 : value;
}
