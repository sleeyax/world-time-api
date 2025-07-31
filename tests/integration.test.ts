import { buildApp } from '../src/index';
import { FastifyInstance } from 'fastify';

describe('Integration Tests', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should have health endpoint', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/health',
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.status).toBe('ok');
    expect(body.timestamp).toBeDefined();
  });

  describe('API Workflow', () => {
    it('should handle complete timezone workflow', async () => {
      // 1. Get all timezones
      const allTimezonesResponse = await app.inject({
        method: 'GET',
        url: '/api/timezone',
      });
      expect(allTimezonesResponse.statusCode).toBe(200);
      const allTimezones = JSON.parse(allTimezonesResponse.body);
      expect(Array.isArray(allTimezones)).toBe(true);
      expect(allTimezones.length).toBeGreaterThan(0);

      // 2. Get America timezones
      const americaTimezonesResponse = await app.inject({
        method: 'GET',
        url: '/api/timezone/America',
      });
      expect(americaTimezonesResponse.statusCode).toBe(200);
      const americaTimezones = JSON.parse(americaTimezonesResponse.body);
      expect(Array.isArray(americaTimezones)).toBe(true);
      expect(americaTimezones.every((tz: string) => tz.startsWith('America/'))).toBe(true);

      // 3. Get specific timezone info
      const timezoneInfoResponse = await app.inject({
        method: 'GET',
        url: '/api/timezone/America/New_York',
      });
      expect(timezoneInfoResponse.statusCode).toBe(200);
      const timezoneInfo = JSON.parse(timezoneInfoResponse.body);
      expect(timezoneInfo.timezone).toBe('America/New_York');
    });

    it('should handle IP-based timezone workflow', async () => {
      // 1. Get time based on client IP
      const clientIpResponse = await app.inject({
        method: 'GET',
        url: '/api/ip',
      });
      expect(clientIpResponse.statusCode).toBe(200);
      const clientIpData = JSON.parse(clientIpResponse.body);
      expect(clientIpData).toHaveProperty('client_ip');
      expect(clientIpData).toHaveProperty('timezone');

      // 2. Get time for specific IP
      const specificIpResponse = await app.inject({
        method: 'GET',
        url: '/api/ip/8.8.8.8',
      });
      expect(specificIpResponse.statusCode).toBe(200);
      const specificIpData = JSON.parse(specificIpResponse.body);
      expect(specificIpData.client_ip).toBe('8.8.8.8');
    });

    it('should handle both JSON and text formats consistently', async () => {
      // Test timezone list formats
      const jsonResponse = await app.inject({
        method: 'GET',
        url: '/api/timezone',
      });
      const textResponse = await app.inject({
        method: 'GET',
        url: '/api/timezone.txt',
      });

      expect(jsonResponse.statusCode).toBe(200);
      expect(textResponse.statusCode).toBe(200);

      const jsonData = JSON.parse(jsonResponse.body);
      const textData = textResponse.body.split('\n').filter(line => line.trim() !== '');

      expect(jsonData.length).toBe(textData.length);
      expect(jsonData.sort()).toEqual(textData.sort());
    });

    it('should handle errors gracefully', async () => {
      // Test invalid timezone
      const invalidTimezoneResponse = await app.inject({
        method: 'GET',
        url: '/api/timezone/Invalid/Location',
      });
      expect(invalidTimezoneResponse.statusCode).toBe(500);
      
      const errorData = JSON.parse(invalidTimezoneResponse.body);
      expect(errorData).toHaveProperty('error');
      expect(errorData.error).toBe('Internal server error');

      // Test invalid timezone text format
      const invalidTimezoneTextResponse = await app.inject({
        method: 'GET',
        url: '/api/timezone/Invalid/Location.txt',
      });
      expect(invalidTimezoneTextResponse.statusCode).toBe(500);
      expect(invalidTimezoneTextResponse.body).toBe('Internal server error');
    });
  });

  describe('CORS and Headers', () => {
    it('should include CORS headers', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/timezone',
        headers: {
          'Origin': 'http://localhost:3000'
        }
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });

    it('should handle OPTIONS preflight requests', async () => {
      const response = await app.inject({
        method: 'OPTIONS',
        url: '/api/timezone',
        headers: {
          'Origin': 'http://localhost:3000',
          'Access-Control-Request-Method': 'GET'
        }
      });

      expect(response.statusCode).toBe(204);
      expect(response.headers).toHaveProperty('access-control-allow-origin');
      expect(response.headers).toHaveProperty('access-control-allow-methods');
    });
  });

  describe('Content Types', () => {
    it('should return correct content-type for JSON endpoints', async () => {
      const endpoints = [
        '/api/timezone',
        '/api/timezone/America',
        '/api/timezone/America/New_York',
        '/api/ip',
        '/api/ip/8.8.8.8'
      ];

      for (const endpoint of endpoints) {
        const response = await app.inject({
          method: 'GET',
          url: endpoint,
        });

        expect(response.statusCode).toBe(200);
        expect(response.headers['content-type']).toContain('application/json');
      }
    });

    it('should return correct content-type for text endpoints', async () => {
      const endpoints = [
        '/api/timezone.txt',
        '/api/timezone/America.txt',
        '/api/timezone/America/New_York.txt',
        '/api/ip.txt',
        '/api/ip/8.8.8.8.txt'
      ];

      for (const endpoint of endpoints) {
        const response = await app.inject({
          method: 'GET',
          url: endpoint,
        });

        if (response.statusCode === 200) {
          expect(response.headers['content-type']).toContain('text/plain');
        }
      }
    });
  });

  describe('Data Validation', () => {
    it('should return consistent datetime structure', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/timezone/America/New_York',
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);

      // Validate datetime fields
      expect(typeof data.datetime).toBe('string');
      expect(new Date(data.datetime).toISOString()).toBe(data.datetime);
      
      expect(typeof data.utc_datetime).toBe('string');
      expect(new Date(data.utc_datetime).toISOString()).toBe(data.utc_datetime);

      // Validate numeric fields
      expect(typeof data.unixtime).toBe('number');
      expect(data.unixtime).toBeGreaterThan(0);
      
      expect(typeof data.day_of_week).toBe('number');
      expect(data.day_of_week).toBeGreaterThanOrEqual(0);
      expect(data.day_of_week).toBeLessThanOrEqual(6);
      
      expect(typeof data.day_of_year).toBe('number');
      expect(data.day_of_year).toBeGreaterThan(0);
      expect(data.day_of_year).toBeLessThanOrEqual(366);
      
      expect(typeof data.week_number).toBe('number');
      expect(data.week_number).toBeGreaterThan(0);
      expect(data.week_number).toBeLessThanOrEqual(53);

      // Validate boolean fields
      expect(typeof data.dst).toBe('boolean');
    });
  });
});
