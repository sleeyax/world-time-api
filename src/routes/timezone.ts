import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import {
  TimezoneParams,
  LocationParams,
  RegionParams,
  ListJsonResponse,
  ListTextResponse,
  DateTimeJsonResponse,
  DateTimeTextResponse,
  ErrorJsonResponse,
  ErrorTextResponse
} from '../types/api';
import { getTime, getTimeZones, getTimeZonesByArea } from '../services/timezone';
import { formatAsText } from '../utils/formatter';

export async function timezoneRoutes(fastify: FastifyInstance) {
  // GET /timezone - List all timezones (JSON)
  fastify.get('/timezone', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const timezones: ListJsonResponse = getTimeZones();

      reply.type('application/json');
      return timezones;
    } catch (error) {
      reply.code(500);
      const errorResponse: ErrorJsonResponse = {
        error: 'Internal server error'
      };
      return errorResponse;
    }
  });

  // GET /timezone.txt - List all timezones (plain text)
  fastify.get('/timezone.txt', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const timezones: ListTextResponse = formatAsText(getTimeZones());
      
      reply.type('text/plain');
      return timezones;
    } catch (error) {
      reply.code(500);
      const errorResponse: ErrorTextResponse = 'Internal server error';
      return errorResponse;
    }
  });

  // GET /timezone/:area - List timezones for area (JSON)
  fastify.get<{ Params: TimezoneParams }>('/timezone/:area', async (request: FastifyRequest<{ Params: TimezoneParams }>, reply: FastifyReply) => {
    try {
      const { area } = request.params;
      
      const timezones: ListJsonResponse = getTimeZonesByArea(area);
      
      reply.type('application/json');
      return timezones;
    } catch (error) {
      reply.code(500);
      const errorResponse: ErrorJsonResponse = {
        error: 'Internal server error'
      };
      return errorResponse;
    }
  });

  // GET /timezone/:area.txt - List timezones for area (plain text)
  fastify.get<{ Params: TimezoneParams }>('/timezone/:area.txt', async (request: FastifyRequest<{ Params: TimezoneParams }>, reply: FastifyReply) => {
    try {
      const { area } = request.params;
      
      const timezones: ListTextResponse = formatAsText(getTimeZonesByArea(area));
      
      reply.type('text/plain');
      return timezones;
    } catch (error) {
      reply.code(500);
      const errorResponse: ErrorTextResponse = 'Internal server error';
      return errorResponse;
    }
  });

  // GET /timezone/:area/:location - Get time for specific location (JSON)
  fastify.get<{ Params: LocationParams }>('/timezone/:area/:location', async (request: FastifyRequest<{ Params: LocationParams }>, reply: FastifyReply) => {
    try {
      const { area, location } = request.params;
      
      const response: DateTimeJsonResponse = getTime(area, location);
      
      reply.type('application/json');
      return response;
    } catch (error) {
      reply.code(500);
      const errorResponse: ErrorJsonResponse = {
        error: 'Internal server error'
      };
      return errorResponse;
    }
  });

  // GET /timezone/:area/:location.txt - Get time for specific location (plain text)
  fastify.get<{ Params: LocationParams }>('/timezone/:area/:location.txt', async (request: FastifyRequest<{ Params: LocationParams }>, reply: FastifyReply) => {
    try {
      const { area, location } = request.params;
      const clientIp = request.ip;
      
      // TODO: Implement actual time calculation logic
      const response: DateTimeTextResponse = `abbreviation: EST
client_ip: ${clientIp}
datetime: ${new Date().toISOString()}
day_of_week: ${new Date().getDay()}
day_of_year: ${Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24))}
dst: false
dst_offset: 0
timezone: ${area}/${location}
unixtime: ${Math.floor(Date.now() / 1000)}
utc_datetime: ${new Date().toISOString()}
utc_offset: +00:00
week_number: ${Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 1).getTime()) / (1000 * 60 * 60 * 24 * 7)) + 1}`;
      
      reply.type('text/plain');
      return response;
    } catch (error) {
      reply.code(500);
      const errorResponse: ErrorTextResponse = 'Internal server error';
      return errorResponse;
    }
  });

  // GET /timezone/:area/:location/:region - Get time for specific region (JSON)
  fastify.get<{ Params: RegionParams }>('/timezone/:area/:location/:region', async (request: FastifyRequest<{ Params: RegionParams }>, reply: FastifyReply) => {
    try {
      const { area, location, region } = request.params;
      const clientIp = request.ip;
      
      // TODO: Implement actual time calculation logic
      const response: DateTimeJsonResponse = {
        abbreviation: 'EST',
        datetime: new Date().toISOString(),
        day_of_week: new Date().getDay(),
        day_of_year: Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)),
        dst: false,
        dst_offset: 0,
        timezone: `${area}/${location}/${region}`,
        unixtime: Math.floor(Date.now() / 1000),
        utc_datetime: new Date().toISOString(),
        utc_offset: '+00:00',
        week_number: Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 1).getTime()) / (1000 * 60 * 60 * 24 * 7)) + 1
      };
      
      reply.type('application/json');
      return response;
    } catch (error) {
      reply.code(500);
      const errorResponse: ErrorJsonResponse = {
        error: 'Internal server error'
      };
      return errorResponse;
    }
  });

  // GET /timezone/:area/:location/:region.txt - Get time for specific region (plain text)
  fastify.get<{ Params: RegionParams }>('/timezone/:area/:location/:region.txt', async (request: FastifyRequest<{ Params: RegionParams }>, reply: FastifyReply) => {
    try {
      const { area, location, region } = request.params;
      const clientIp = request.ip;
      
      // TODO: Implement actual time calculation logic
      const response: DateTimeTextResponse = `abbreviation: EST
client_ip: ${clientIp}
datetime: ${new Date().toISOString()}
day_of_week: ${new Date().getDay()}
day_of_year: ${Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24))}
dst: false
dst_offset: 0
timezone: ${area}/${location}/${region}
unixtime: ${Math.floor(Date.now() / 1000)}
utc_datetime: ${new Date().toISOString()}
utc_offset: +00:00
week_number: ${Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 1).getTime()) / (1000 * 60 * 60 * 24 * 7)) + 1}`;
      
      reply.type('text/plain');
      return response;
    } catch (error) {
      reply.code(500);
      const errorResponse: ErrorTextResponse = 'Internal server error';
      return errorResponse;
    }
  });
}
