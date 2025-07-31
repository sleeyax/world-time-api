import { buildApp } from '../src/index';
import { FastifyInstance } from 'fastify';

describe('App Creation', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create app successfully', () => {
    expect(app).toBeDefined();
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
});
