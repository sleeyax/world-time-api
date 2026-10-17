# Changelog

## 2026-10-17

### [Use the City-Level Timezone for IP Lookups](https://github.com/sleeyax/world-time-api/pull/59)

`/api/ip` now resolves to the timezone of the IP's city, falling back to its country only when the city's timezone is unknown.
It previously always used the registered country's timezone, which is wrong for IPs in countries spanning several timezones (US, CA, BR, RU, AU, ...).
Single-timezone countries are unaffected.

#### Example

`/api/ip/93.184.216.34` (New York):

- Before: `America/Chicago`
- After: `America/New_York`

### [Report Data Freshness](https://github.com/sleeyax/world-time-api/pull/53)

New `GET /api/status` (and `/api/status.txt`) endpoint reporting when the underlying data was last updated:

- `geo_updated_at`: when MaxMind published the geolocation data in use, or `null` if none has been imported yet
- `tzdata_version`: the IANA time zone database release in use

#### Example

```json
{
  "geo_updated_at": "2026-10-14T15:04:05.000Z",
  "tzdata_version": "2026b"
}
```

## 2025-10-01

### [Show DST Transitions When DST is Inactive](https://github.com/sleeyax/world-time-api/pull/13)

**When DST is NOT active** (`dst = false`):

- `dst_from` now shows when DST will begin next (was `null`)
- `dst_until` now shows when DST last ended (was `null`)

**When DST is active** (`dst = true`):

- No change - same behavior as before:
  - `dst_from` shows when DST began (in the current period)
  - `dst_until` shows when DST will end (next)

#### Example

Australia/Sydney on October 1, 2025 (DST not active):

```json
{
  "dst": false,
  "dst_from": "2025-10-04T16:00:00+00:00", // DST starts Oct 5 at 2am local
  "dst_until": "2025-04-05T16:00:00+00:00" // DST ended Apr 6 at 3am local
}
```

Australia/Sydney on October 1, 2025 (DST active):

```json
{
  "dst": true,
  "dst_from": "2025-10-04T16:00:00+00:00", // DST started Oct 5 at 2am local
  "dst_until": "2026-04-04T16:00:00+00:00" // DST ends Apr 5 at 3am local
}
```

#### Important: Times are in UTC

DST transition times are returned in UTC, not local time. For example:

- `2025-10-04T16:00:00+00:00` = October 5th at 2:00 AM Sydney time

This follows the API convention of using UTC for all absolute timestamps.

#### Breaking Change

Clients expecting `null` when DST is inactive will now receive date strings instead.

## 2025-09-12

Bug fixes and improvements.

## 2025-08-01

Initial release.
