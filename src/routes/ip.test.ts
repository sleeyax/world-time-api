import { buildApp } from '../index';
import { FastifyInstance } from 'fastify';

describe('IP Routes', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/ip', () => {
    it('should return datetime info based on client IP in JSON format', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/ip',
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
      expect(body).toHaveProperty('utc_offset');
      expect(body).toHaveProperty('week_number');
      
      // Default values for TODO implementation
      expect(body.abbreviation).toBe('UTC');
      expect(body.timezone).toBe('UTC');
      expect(body.utc_offset).toBe('+00:00');
      expect(typeof body.unixtime).toBe('number');
      expect(typeof body.day_of_week).toBe('number');
      expect(typeof body.day_of_year).toBe('number');
      expect(typeof body.week_number).toBe('number');
    });

    it('should include client IP in the response', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/ip',
        headers: {
          'x-forwarded-for': '192.168.1.1' // Simulate client IP
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.client_ip).toBeDefined();
    });
  });

  describe('GET /api/ip.txt', () => {
    it('should return datetime info in text format', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/ip.txt',
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toContain('text/plain');
      
      // The response should be a formatted text with key-value pairs
      expect(response.body).toBeTruthy();
      expect(typeof response.body).toBe('string');
      expect(response.body).toContain('abbreviation:');
      expect(response.body).toContain('client_ip:');
      expect(response.body).toContain('datetime:');
      expect(response.body).toContain('timezone:');
      expect(response.body).toContain('unixtime:');
    });
  });

  describe('GET /api/ip/:ipv4', () => {
    it('should return datetime info for specific IPv4 address', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/ip/8.8.8.8',
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
      expect(body).toHaveProperty('utc_offset');
      expect(body).toHaveProperty('week_number');
      
      // Should use the provided IP
      expect(body.client_ip).toBe('8.8.8.8');
    });

    it('should handle localhost IP address', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/ip/127.0.0.1',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.client_ip).toBe('127.0.0.1');
    });

    it('should handle private IP addresses', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/ip/192.168.1.1',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.client_ip).toBe('192.168.1.1');
    });
  });

  describe('GET /api/ip/:ipv4.txt', () => {
    it('should return datetime info for specific IP in text format', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/ip/8.8.8.8.txt',
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toContain('text/plain');
      
      expect(response.body).toBeTruthy();
      expect(typeof response.body).toBe('string');
      expect(response.body).toContain('client_ip: 8.8.8.8');
      expect(response.body).toContain('abbreviation:');
      expect(response.body).toContain('datetime:');
      expect(response.body).toContain('timezone:');
      expect(response.body).toContain('unixtime:');
    });
  });
});
