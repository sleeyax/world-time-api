<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# World Time API Project Instructions

This is a World Time API clone built with TypeScript and CloudFlare workers. The project implements endpoints following the World Time API specification.

## Project Structure

- `src/` - Main source code directory
- `src/types/api.ts` - TypeScript interfaces and types for API responses and requests
- `src/routes/timezone.ts` - Timezone-related endpoints
- `src/routes/ip.ts` - IP-based time endpoints
- `src/index.ts` - Main application file with hono web framework

## Key Features

- TypeScript for type safety
- Hono web framework for high performance
- Swagger/OpenAPI documentation
- CORS support
- Health check endpoint
- Graceful shutdown handling

## Development Guidelines

- Follow the existing TypeScript interfaces defined in `src/types/api.ts`
- All endpoints should handle both JSON and plain text responses
- Use proper error handling with appropriate HTTP status codes
- Business logic is marked with TODO comments for future implementation
- Maintain consistency with the original World Time API specification

## API Endpoints

- `/api/timezone` - List all timezones
- `/api/timezone/:area` - List timezones for specific area
- `/api/timezone/:area/:location` - Get time for specific location
- `/api/timezone/:area/:location/:region` - Get time for specific region
- `/api/ip` - Get time based on client IP
- `/api/ip/:ipv4` - Get time based on specific IP

Each endpoint supports both JSON and plain text formats (append `.txt` for plain text).
