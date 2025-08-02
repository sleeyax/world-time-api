export function isTimeZoneNotFoundError(error: unknown): boolean {
  return (
    error instanceof Error &&
    error.name === "timezonecomplete.NotFound.Zone"
  );
}
