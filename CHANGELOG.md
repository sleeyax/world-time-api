# Changelog

## 2025-10-01

### [Show DST Transitions When DST is Inactive](https://github.com/sleeyax/world-time-api/pull/13)

**When DST is NOT active** (`dst = false`):

- `dst_from` now shows when DST will begin next (was `null`)
- `dst_until` now shows when DST last ended (was `null`)

**When DST is active** (`dst = true`):

- No change - same behavior as before

#### Example

Australia/Sydney on October 1, 2025 (DST not active):

```json
{
  "dst": false,
  "dst_from": "2025-10-04T16:00:00+00:00", // DST starts Oct 5 at 2am local
  "dst_until": "2025-04-05T16:00:00+00:00" // DST ended Apr 6 at 3am local
}
```

#### Important: Times are in UTC

DST transition times are returned in UTC, not local time. For example:

- `2025-10-04T16:00:00+00:00` = October 5th at 2:00 AM Sydney time

This follows the API convention of using UTC for all absolute timestamps.

#### Breaking Change

Clients expecting `null` when DST is inactive will now receive date strings instead.

## 2025-09-12

Initial release.
