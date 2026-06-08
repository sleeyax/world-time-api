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

### Geolocation Endpoints

- `GET /api/geo` - Get geolocation data for client IP (JSON)
- `GET /api/geo.txt` - Get geolocation data for client IP (plain text)
- `GET /api/geo/{ip}` - Get geolocation data for specific IPv4 or IPv6 address (JSON)
- `GET /api/geo/{ip}.txt` - Get geolocation data for specific IPv4 or IPv6 address (plain text)

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

### Geolocation

JSON:

```json
{
  "ip": "1.1.1.1",
  "latitude": -33.8591,
  "longitude": 151.2002,
  "accuracy_radius": 1000,
  "timezone": "Australia/Sydney",
  "city": "Sydney",
  "postal_code": "2000",
  "metro_code": null,
  "subdivisions": [{ "code": "NSW", "name": "New South Wales" }],
  "country": { "code": "AU", "name": "Australia" },
  "continent": { "code": "OC", "name": "Oceania" },
  "is_in_european_union": false,
  "is_anonymous_proxy": false,
  "is_satellite_provider": false,
  "is_anycast": false
}
```

Plain Text:

```
ip: 1.1.1.1
latitude: -33.8591
longitude: 151.2002
accuracy_radius: 1000
timezone: Australia/Sydney
city: Sydney
postal_code: 2000
subdivisions: NSW (New South Wales)
country_code: AU
country_name: Australia
continent_code: OC
continent_name: Oceania
is_in_european_union: false
is_anonymous_proxy: false
is_satellite_provider: false
is_anycast: false
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

## Enterprise keys

Enterprise keys grant direct (non-RapidAPI) access and live in a dedicated `enterprise` D1 database, separate from the geo `geolite2` database.
Callers authenticate with the `x-enterprise-key` header.
Each key has an optional monthly request limit (`request_limit`; `null` = unlimited); over-limit requests get a `429` and don't consume quota.
Limited responses carry `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `X-RateLimit-Reset`.

One-time setup (creates the database and its schema):

```bash
# Create the database, then paste the returned database_id into wrangler.jsonc (ENTERPRISE_DB).
npx wrangler d1 create enterprise

# Apply the schema (local, then remote when deploying).
npx wrangler d1 execute enterprise --local --file=./schema-enterprise.sql
npx wrangler d1 execute enterprise --remote --file=./schema-enterprise.sql
```

Add a key (the raw key is shown to the customer once and never stored, only its hash is):

```bash
# 1. Generate a strong random raw key into a variable, and print it (give THIS to the customer).
KEY=$(openssl rand -hex 32); echo "$KEY"

# 2. Hash it (this is what goes in the DB).
HASH=$(printf '%s' "$KEY" | sha256sum | cut -d' ' -f1); echo "$HASH"

# 3. Insert the hash. request_limit is the monthly cap; use NULL for unlimited.
#    2000000 below = 1 million requests/month. Add --remote to target production.
npx wrangler d1 execute enterprise --local \
  --command "insert into enterprise_keys (key_hash, name, request_limit) values ('$HASH', 'unknown key', 1000000);"
```

Admin operations (run against the `enterprise` DB; changes can take up to 24h to take effect on warm isolates due to the in-isolate config cache so redeploy to flush immediately):

```bash
# Change a limit (or set NULL for unlimited)
update enterprise_keys set request_limit = 5000000 where name = '<name>';
# Revoke a key
delete from enterprise_keys where name = '<name>';
# Inspect usage
select * from enterprise_key_usage where period = '2026-06';
```

### Test a key

Use `$KEY` from step 1, or paste the raw key. Auth is bypassed when `NODE_ENV=development`, so unset it to exercise this path locally. `-i` prints the `X-RateLimit-*` headers:

```bash
curl -i -H "x-enterprise-key: $KEY" http://localhost:8787/api/timezone/Europe/Amsterdam
```

### Whop subscriptions

Individual subscriptions sold through [Whop](https://whop.com) provision and revoke enterprise keys automatically, so you don't run the SQL above by hand for them.
We reuse the **license key Whop already issues per membership**: on subscribe we store its hash as an enterprise key; the customer reads the key from their Whop dashboard and sends it as the usual `x-enterprise-key` header.
The raw key is never stored, only its hash (same model as manual keys).

`POST /webhooks/whop` receives Whop's `membership.activated` / `membership.deactivated` events, verified via the [`@whop/sdk`](https://www.npmjs.com/package/@whop/sdk) Standard-Webhooks signature check.
On activate we look the product up in `whop_plans`; **only products listed there grant access** (a row is the allowlist), with `request_limit` as the monthly cap (`null` = unlimited).
On deactivate we delete the key. Revocation is subject to the same up-to-24h warm-isolate cache as manual keys.

Prerequisite: each API-granting Whop product must use the **License Key** delivery type so the webhook payload carries a `license_key`.

Setup:

```bash
# 1. Apply the schema
npx wrangler d1 execute enterprise --remote --file=./schema-enterprise.sql

# 2. Map each API-granting Whop product (prod_...) to its monthly limit (NULL = unlimited).
npx wrangler d1 execute enterprise --remote \
  --command "insert into whop_plans (product_id, request_limit) values ('prod_xxx', 1000000);"

# 3. Store the webhook signing secret from the Whop dashboard.
npx wrangler secret put WHOP_WEBHOOK_SECRET
```

In the Whop dashboard, point a webhook at `https://<your-worker>/webhooks/whop`, subscribed to `membership.activated` and `membership.deactivated`.

To test locally, expose `wrangler dev` with a tunnel (e.g. `cloudflared tunnel --url http://localhost:8787`), set the dashboard webhook to the tunnel URL, put its signing secret in `.dev.vars` as `WHOP_WEBHOOK_SECRET`, then use the dashboard's **Send test webhook** button.

## License

This project is licensed under the BSL 1.1 license, with a change date of `three years from release date` after which the license automatically changes to GPL v3. See [LICENSE](./LICENSE) for details.
