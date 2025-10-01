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
  zone: string,
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
  const dstTransitions = getDstTransitions(timezone.name(), dateTime, dst);

  const dstFrom = dstTransitions.dstStart
    ? toISOWithoutFractionalZeros(dstTransitions.dstStart.toIsoString())
    : null;
  const dstUntil = dstTransitions.dstEnd
    ? toISOWithoutFractionalZeros(dstTransitions.dstEnd.toIsoString())
    : null;
  const rawOffset = normalizeZero(utcOffsetRaw.seconds());

  return {
    abbreviation,
    datetime: dateTime.toIsoString(),
    day_of_week: dayOfWeek,
    day_of_year: dayOfYear,
    dst: dst,
    dst_from: dstFrom,
    dst_offset: dstOffset,
    dst_until: dstUntil,
    raw_offset: rawOffset,
    timezone: timezone.name(),
    unixtime: unizTimeSeconds,
    utc_datetime: utcDateTime.toIsoString(),
    utc_offset: toHmString(utcOffset),
    week_number: weekNumber,
  };
}

/**
 * Get DST transition dates based on current time and DST status
 *
 * When DST is active:
 * - dstStart: when current DST period started
 * - dstEnd: when current DST period will end
 *
 * When DST is NOT active:
 * - dstStart: when next DST period will begin (future)
 * - dstEnd: when last DST period ended (past)
 */
function getDstTransitions(
  zoneName: string,
  currentTime: tc.DateTime,
  isDstActive: boolean,
): { dstStart: tc.DateTime | null; dstEnd: tc.DateTime | null } {
  const db = tc.TzDatabase.instance();

  if (!db.hasDst(zoneName)) {
    return { dstStart: null, dstEnd: null };
  }

  const currentMillis = currentTime.unixUtcMillis();

  // Find the next DST transition from current time.
  const nextChange = db.nextDstChange(zoneName, currentMillis);

  // Find the previous DST transition by searching from one year ago.
  const oneYearAgo = currentTime.add(-1, tc.TimeUnit.Year).unixUtcMillis();
  let prevChange = db.nextDstChange(zoneName, oneYearAgo);

  // Keep looking forward until we find the transition just before current time.
  while (prevChange && prevChange < currentMillis) {
    const nextTransition = db.nextDstChange(zoneName, prevChange);
    if (nextTransition && nextTransition < currentMillis) {
      prevChange = nextTransition;
    } else {
      break;
    }
  }

  // Convert to DateTime objects.
  const prevDateTime = prevChange
    ? new tc.DateTime(prevChange, tc.utc())
    : null;
  const nextDateTime = nextChange
    ? new tc.DateTime(nextChange, tc.utc())
    : null;

  // Return based on DST status.
  if (isDstActive) {
    // DST is active: prev = when it started, next = when it will end.
    return { dstStart: prevDateTime, dstEnd: nextDateTime };
  } else {
    // DST is NOT active: prev = when it last ended, next = when it will begin.
    return { dstStart: nextDateTime, dstEnd: prevDateTime };
  }
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
