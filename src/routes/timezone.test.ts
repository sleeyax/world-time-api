import { buildApp } from '../index';
import { FastifyInstance } from 'fastify';

describe('Timezone Routes', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/timezone', () => {
    it('should return all timezones in JSON format', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/timezone',
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toContain('application/json');
      
      const body = JSON.parse(response.body);
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBeGreaterThan(0);
      expect(body).toContain('America/New_York');
      expect(body).toContain('Europe/London');
    });

    it('should return sorted timezones', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/timezone',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      const sortedBody = [...body].sort();
      expect(body).toEqual(sortedBody);
    });
  });

  describe('GET /api/timezone.txt', () => {
    it('should return all timezones in text format', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/timezone.txt',
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toContain('text/plain');
      
      const lines = response.body.split('\n');
      expect(lines.length).toBeGreaterThan(0);
      expect(lines).toContain('America/New_York');
      expect(lines).toContain('Europe/London');
    });
  });

  describe('GET /api/timezone/:area', () => {
    it('should return timezones for America area', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/timezone/America',
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toContain('application/json');
      
      const body = JSON.parse(response.body);
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBeGreaterThan(0);
      expect(body.every((tz: string) => tz.startsWith('America/'))).toBe(true);
      expect(body).toContain('America/New_York');
    });

    it('should return timezones for Europe area', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/timezone/Europe',
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toContain('application/json');
      
      const body = JSON.parse(response.body);
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBeGreaterThan(0);
      expect(body.every((tz: string) => tz.startsWith('Europe/'))).toBe(true);
      expect(body).toContain('Europe/London');
    });

    it('should return empty array for non-existent area', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/timezone/NonExistent',
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toContain('application/json');
      
      const body = JSON.parse(response.body);
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBe(0);
    });
  });

  describe('GET /api/timezone/:area.txt', () => {
    it('should return America timezones in text format', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/timezone/America.txt',
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toContain('text/plain');
      
      const lines = response.body.split('\n');
      expect(lines.length).toBeGreaterThan(0);
      expect(lines.every((tz: string) => tz.trim() === '' || tz.startsWith('America/'))).toBe(true);
      expect(lines).toContain('America/New_York');
    });
  });

  describe('GET /api/timezone/:area/:location', () => {
    it('should return datetime info for valid timezone', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/timezone/America/New_York',
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toContain('application/json');
      
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('abbreviation');
      expect(body).toHaveProperty('client_ip');
      expect(body).toHaveProperty('datetime');
      expect(body).toHaveProperty('day_of_week');
      expect(body).toHaveProperty('day_of_year');
      expect(body).toHaveProperty('dst');
      expect(body).toHaveProperty('dst_offset');
      expect(body).toHaveProperty('timezone');
      expect(body).toHaveProperty('unixtime');
      expect(body).toHaveProperty('utc_datetime');
      expect(body.timezone).toBe('America/New_York');
    });

    it('should return error for invalid timezone', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/timezone/Invalid/Location',
      });

      expect(response.statusCode).toBe(500);
      expect(response.headers['content-type']).toContain('application/json');
      
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('error');
      expect(body.error).toBe('Internal server error');
    });
  });

  describe('GET /api/timezone/:area/:location.txt', () => {
    it('should return datetime info in text format for valid timezone', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/timezone/America/New_York.txt',
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toContain('text/plain');
      
      // The response should be a formatted datetime string
      expect(response.body).toBeTruthy();
      expect(typeof response.body).toBe('string');
    });

    it('should return error text for invalid timezone', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/timezone/Invalid/Location.txt',
      });

      expect(response.statusCode).toBe(500);
      expect(response.headers['content-type']).toContain('text/plain');
      expect(response.body).toBe('Internal server error');
    });
  });
});
