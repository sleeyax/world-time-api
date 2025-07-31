import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import {
  IpParams,
  DateTimeJsonResponse,
  DateTimeTextResponse,
  ErrorJsonResponse,
  ErrorTextResponse
} from '../types/api';
import { lookupIP } from '../services/ip';
import { getTime } from '../services/timezone';
import { formatAsText } from '../utils/formatter';

export async function ipRoutes(fastify: FastifyInstance) {
  // GET /ip - Get time based on client IP (JSON)
  fastify.get('/ip', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const clientIp = request.ip;
      const geo = await lookupIP(clientIp);

      if (!geo) {
        reply.code(404);
        const errorResponse: ErrorJsonResponse = {
          error: `Couldn't find geo data for IP`
        };
        return errorResponse;
      }

      const timezone = geo.location?.time_zone;
      
      if (!timezone) {
        reply.code(404);
        const errorResponse: ErrorJsonResponse = {
          error: `Couldn't find timezone for IP`
        };
        return errorResponse;
      }
      
      const response: DateTimeJsonResponse = getTime(timezone)
      
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

  // GET /ip.txt - Get time based on client IP (plain text)
  fastify.get('/ip.txt', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const clientIp = request.ip;
      const geo = await lookupIP(clientIp);

      if (!geo) {
        reply.code(404);
        const errorResponse: ErrorJsonResponse = {
          error: `Couldn't find geo data for IP`
        };
        return errorResponse;
      }

      const timezone = geo.location?.time_zone;
      
      if (!timezone) {
        reply.code(404);
        const errorResponse: ErrorJsonResponse = {
          error: `Couldn't find timezone for IP`
        };
        return errorResponse;
      }
      
      const response: DateTimeTextResponse = formatAsText(getTime(timezone));
      
      reply.type('text/plain');
      return response;
    } catch (error) {
      reply.code(500);
      const errorResponse: ErrorTextResponse = 'Internal server error';
      return errorResponse;
    }
  });

  // GET /ip/:ipv4 - Get time based on specific IP (JSON)
  fastify.get<{ Params: IpParams }>('/ip/:ipv4', async (request: FastifyRequest<{ Params: IpParams }>, reply: FastifyReply) => {
    try {
      const { ipv4 } = request.params;
      
      const geo = await lookupIP(ipv4);

      if (!geo) {
        reply.code(404);
        const errorResponse: ErrorJsonResponse = {
          error: `Couldn't find geo data for IP`
        };
        return errorResponse;
      }

      const timezone = geo.location?.time_zone;
      
      if (!timezone) {
        reply.code(404);
        const errorResponse: ErrorJsonResponse = {
          error: `Couldn't find timezone for IP`
        };
        return errorResponse;
      }
      
      const response: DateTimeJsonResponse = getTime(timezone);
      
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

  // GET /ip/:ipv4.txt - Get time based on specific IP (plain text)
  fastify.get<{ Params: IpParams }>('/ip/:ipv4.txt', async (request: FastifyRequest<{ Params: IpParams }>, reply: FastifyReply) => {
    try {
      const { ipv4 } = request.params;
      
      const geo = await lookupIP(ipv4);

      if (!geo) {
        reply.code(404);
        const errorResponse: ErrorJsonResponse = {
          error: `Couldn't find geo data for IP`
        };
        return errorResponse;
      }

      const timezone = geo.location?.time_zone;
      
      if (!timezone) {
        reply.code(404);
        const errorResponse: ErrorJsonResponse = {
          error: `Couldn't find timezone for IP`
        };
        return errorResponse;
      }
      
      const response: DateTimeTextResponse = formatAsText(getTime(timezone));
      
      reply.type('text/plain');
      return response;
    } catch (error) {
      reply.code(500);
      const errorResponse: ErrorTextResponse = 'Internal server error';
      return errorResponse;
    }
  });
}
