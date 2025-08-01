import { type Duration } from "timezonecomplete";

/**
 * Removes '.000' fractional milliseconds from the ISO 8601 string if present.
 */
export function toISOWithoutFractionalZeros(isoString: string): string {
  return isoString.replace(/\.000(?=\+|-)/, '');
}

/**
 * The World time API returns ISO 8601 date strings with 6 decimal places (microseconds).
 * Our API returns them with 3 decimal places (milliseconds).
 * The difference is acceptable.
 * 
 * This function converts an input of ISO 8601 date string with 6 decimal places to one with 3 decimal places.
 */
export function toISOWithMilliseconds(isoString: string): string {
  // Match ISO 8601 format with 6 decimal places.
  const regex = /(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})\.(\d{6})(.*)/;
  const match = isoString.match(regex);
  
  if (!match) {
    // If no match or already in correct format, return as is.
    return isoString;
  }
  
  const [, dateTimePart, microseconds, offsetPart] = match;
  // Convert microseconds to milliseconds with proper rounding
  const microsecondsNum = parseInt(microseconds, 10);
  const millisecondsNum = Math.round(microsecondsNum / 1000);
  const milliseconds = millisecondsNum.toString().padStart(3, '0');
  
  return `${dateTimePart}.${milliseconds}${offsetPart}`;
}

export function toHmString(duration: Duration): string {
  const offset = duration.toFullString().split(":").slice(0, 2).join(":");
  return offset.startsWith("-") ? offset : `+${offset}`;
}
