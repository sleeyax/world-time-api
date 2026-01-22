# World Time API

[![Tests](https://github.com/sleeyax/world-time-api/actions/workflows/test.yml/badge.svg)](https://github.com/sleeyax/world-time-api/actions/workflows/test.yml)

Fast, reliable and up to date alternative to [worldtimeapi.org](http://worldtimeapi.org/). It returns the current local time details for a given timezone or IP address in JSON (or plain text) format.

## Feature Comparison

Comparison of APIs that provide similar functionality.

| Feature                                           | This project     | worldtimeapi.org | ipgeolocation.io |
| ------------------------------------------------- | ---------------- | ---------------- | ---------------- |
| 📅 Frequently updated                             | ✅               | ❌               | ❓               |
| 🟢 Reliable                                       | ✅               | ❌ \*            | ✅               |
| 🚀 Performance                                    | Fast             | Slow             | Average          |
| 🕒 Timezone support                               | ✅               | ✅               | ✅               |
| 🌍 Geo IP support                                 | ✅               | ✅               | ✅               |
| 👐 Open source                                    | ✅               | ❌               | ❌               |
| 💼 Commercial use                                 | ✅               | ❌               | ✅               |
| 🔄 Backwards compatible with worldtimeapi.org API | ✅               | n/a              | ❌               |
| 📝 Response formats                               | JSON, plain text | JSON, plain text | JSON             |

\* has been down multiple times in the past, and still suffers from occasional 'connection reset' errors.

## Roadmap

A couple of features that are planned for the future:

- [ ] Provide additional geolocation data API endpoints (coordinates, country, city, etc.). We have the data, just not the API endpoints.
- [Suggest a feature!](https://github.com/sleeyax/world-time-api/issues?q=sort%3Aupdated-desc+is%3Aissue+is%3Aopen)

## Data Sources

We use the following open data sources to provide accurate timezone information:

- Timezone data from [IANA timezone database](https://www.iana.org/time-zones)
- Geo IP data from [maxmind geolite2](https://dev.maxmind.com/geoip/geolite2-free-geolocation-data/)

Both are standards in the industry and are updated regularly to reflect changes in timezones and IP geolocation data.

## API Endpoints

The API follows the World Time API specification with the following endpoints:

### Timezone Endpoints

- `GET /api/timezone` - List all available timezones (JSON)
- `GET /api/timezone.txt` - List all available timezones (plain text)
- `GET /api/timezone/{area}` - List timezones for specific area (JSON)
- `GET /api/timezone/{area}.txt` - List timezones for specific area (plain text)
- `GET /api/timezone/{area}/{location}` - Get current time for location (JSON)
- `GET /api/timezone/{area}/{location}.txt` - Get current time for location (plain text)
- `GET /api/timezone/{area}/{location}/{region}` - Get current time for region (JSON)
- `GET /api/timezone/{area}/{location}/{region}.txt` - Get current time for region (plain text)

### IP-based Endpoints

- `GET /api/ip` - Get time based on client IP (JSON)
- `GET /api/ip.txt` - Get time based on client IP (plain text)
- `GET /api/ip/{ip}` - Get time based on specific IPv4 or IPv6 address (JSON)
- `GET /api/ip/{ip}.txt` - Get time based on specific IPv4 or IPv6 address (plain text)

## Response Formats

### DateTime

JSON:

```json
{
  "utc_offset": "-04:00",
  "timezone": "America/New_York",
  "day_of_week": 6,
  "day_of_year": 214,
  "datetime": "2025-08-02T13:02:11.703-04:00",
  "utc_datetime": "2025-08-02T17:02:11.703+00:00",
  "unixtime": 1754154131,
  "raw_offset": -18000,
  "week_number": 31,
  "dst": true,
  "abbreviation": "EDT",
  "dst_offset": 3600,
  "dst_from": "2025-03-09T07:00:00+00:00",
  "dst_until": "2025-11-02T06:00:00+00:00",
  "client_ip": "127.0.0.1"
}
```

Plain Text:

```
utc_offset: -04:00
timezone: America/New_York
day_of_week: 6
day_of_year: 214
datetime: 2025-08-02T13:02:51.390-04:00
utc_datetime: 2025-08-02T17:02:51.390+00:00
unixtime: 1754154171
raw_offset: -18000
week_number: 31
dst: true
abbreviation: EDT
dst_offset: 3600
dst_from: 2025-03-09T07:00:00+00:00
dst_until: 2025-11-02T06:00:00+00:00
client_ip: 127.0.0.1
```

## Development

### Installation

```bash
# Modify your .env file accordingly
cp .env.example .env

# Install dependencies
npm install

# Start development server
npm run dev
```

To create a local database with the latest geo IP data, run:

```bash
# Initialize the database schema
npx wrangler d1 execute geolite2 --local --file=./schema.sql

# Note the output path:
npm run download:geo -- --chunk-size 500 --max-rows 10000 --dump-only --add-transaction --optimize-writes

# Import the dumped .SQL file to your local database
npx wrangler d1 import geolite2 --local --file=./.tmp/1754073802022.sql
# OR (CHANGE THE EXAMPLE PATH TO YOUR ACTUAL PATH):
sqlite3 .wrangler/state/v3/d1/miniflare-D1DatabaseObject/6548e7f3bc532c7cd454dcbd6dd89f52914826489289e023ef76de4fb5bd7843.sqlite < .tmp/1754073802022.sql
```

For testing purposes, you can also specify a flag to only dump a couple of statements:

```bash
# Only dump 100 rows 10 times
npm run download:geo -- --dump-only --chunk-size 100 --chunk-count 10
```

## Production

Everything is hosted on [Cloudflare](https://www.cloudflare.com/) using:

- [cloudflare workers](https://developers.cloudflare.com/workers/) (serverless platform)
- [cloudflare D1](https://developers.cloudflare.com/d1/) (database)

To manually import data into the database, you can use the following commands:

```bash
# Initialize the database schema if you haven't done so already
npx wrangler d1 execute geolite2 --remote --file=./schema.sql

# Download the latest geo IP data and import it into the database using the cloudflare API,
# in chunks of 250,000 rows (+- 39 MB per file)
npm run download:geo -- --chunk-size 250000 --split-files
```

## License

This project is licensed under the BSL 1.1 license, with a change date of `one year from release date` after which the license automatically changes to GPL v3. See [LICENSE](./LICENSE) for details.
