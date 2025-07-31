# World Time API

A World Time API clone built with Fastify and TypeScript, implementing all endpoints from the original World Time API specification.

## Features

- 🚀 **Fast**: Built with Fastify for high performance
- 📘 **TypeScript**: Full type safety and better developer experience
- 📊 **API Documentation**: Auto-generated Swagger/OpenAPI documentation
- 🌍 **CORS Enabled**: Ready for cross-origin requests
- 🏥 **Health Checks**: Built-in health monitoring
- 📦 **Docker Ready**: Easy containerization support

## Quick Start

### Prerequisites

- Node.js 16+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

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

### Project Structure

```
src/
├── index.ts           # Main application entry point
├── types/
│   └── api.ts         # TypeScript type definitions
└── routes/
    ├── timezone.ts    # Timezone-related routes
    └── ip.ts          # IP-based routes
```

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build the project for production
- `npm start` - Start production server
- `npm test` - Run tests (when implemented)

### Environment Variables

- `PORT` - Server port (default: 3000)
- `HOST` - Server host (default: 0.0.0.0)

## TODO

The basic API structure is implemented with placeholder responses. The following business logic needs to be implemented:

- [ ] Actual timezone data and calculations
- [ ] IP geolocation for timezone detection
- [ ] Daylight saving time calculations
- [ ] Real timezone abbreviations
- [ ] Week number calculations
- [ ] Error handling for invalid timezones/IPs

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

ISC
