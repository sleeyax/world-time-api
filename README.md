# World Time API

A [World Time API](http://worldtimeapi.org/) clone that doesn't suck. It's a drop-in replacement that is 100% compatible with the original API, but with a focus on reliability and performance.

## Why?
I got tired of the original World Time API not functioning correctly more than half of the time, so I challenged myself to a freestyle coding challenge to build a POC within 24 hours. Turns out it wasn't that hard.

## Features

- 🚀 **Fast**: Designed for optimal performance (< 200ms)
- 📘 **TypeScript**: Full type safety and better developer experience
- 🌍 **Geo IP Support**: Automatically detect timezone based on client IP
- 📅 **Frequently updated**: Timezone datasets are updated as soon as they are available and geo IP datasets are updated every 30 days
- 💼 **Commercial Use**: Built with commercial use in mind, so you can use it in your projects without worrying about licensing issues

## Data Sources
We use the following open data sources to provide accurate timezone information:

- Timezone data from [IANA timezone database](https://www.iana.org/time-zones)
- Geo IP data from [maxmind geolite2](https://dev.maxmind.com/geoip/geolite2-free-geolocation-data/)

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
- `GET /api/ip/{ipv4}` - Get time based on specific IP (JSON)
- `GET /api/ip/{ipv4}.txt` - Get time based on specific IP (plain text)

### Utility Endpoints

- `GET /health` - Health check endpoint
- `GET /docs` - Swagger UI documentation

## Response Formats

### JSON DateTime Response

```json
{
  "abbreviation": "EST",
  "client_ip": "192.168.1.1",
  "datetime": "2025-07-31T10:30:00.000Z",
  "day_of_week": 4,
  "day_of_year": 212,
  "dst": false,
  "dst_offset": 0,
  "timezone": "America/New_York",
  "unixtime": 1722423000,
  "utc_datetime": "2025-07-31T14:30:00.000Z",
  "utc_offset": "-04:00",
  "week_number": 31
}
```

### Plain Text Response

```
abbreviation: EST
client_ip: 192.168.1.1
datetime: 2025-07-31T10:30:00.000Z
day_of_week: 4
day_of_year: 212
dst: false
dst_offset: 0
timezone: America/New_York
unixtime: 1722423000
utc_datetime: 2025-07-31T14:30:00.000Z
utc_offset: -04:00
week_number: 31
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
``

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
