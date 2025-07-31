import Fastify from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { timezoneRoutes } from './routes/timezone';
import { ipRoutes } from './routes/ip';

const fastify = Fastify({
  logger: true,
  trustProxy: true // Enable to get real client IP addresses
});

async function buildApp() {
  // Register CORS plugin
  await fastify.register(cors, {
    origin: true
  });

  // Register Swagger plugin for API documentation
  await fastify.register(swagger, {
    openapi: {
      openapi: '3.0.1',
      info: {
        title: 'World Time API',
        version: '20210108',
        description: 'A simple API to get the current time based on a request with a timezone.'
      },
      servers: [
        {
          url: 'http://localhost:3000/api',
          description: 'Development server'
        }
      ],
      tags: [
        { name: 'timezone', description: 'Timezone related endpoints' },
        { name: 'ip', description: 'IP-based time endpoints' }
      ]
    }
  });

  // Register Swagger UI plugin
  await fastify.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'full',
      deepLinking: false
    }
  });

  // Health check endpoint
  fastify.get('/health', async (request, reply) => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // API route prefix
  await fastify.register(async function (fastify) {
    await fastify.register(timezoneRoutes);
    await fastify.register(ipRoutes);
  }, { prefix: '/api' });

  return fastify;
}

async function start() {
  try {
    const app = await buildApp();
    
    const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
    const host = process.env.HOST || '0.0.0.0';
    
    await app.listen({ port, host });
    
    console.log(`🚀 World Time API server is running!`);
    console.log(`📄 API Documentation: http://localhost:${port}/docs`);
    console.log(`🏥 Health Check: http://localhost:${port}/health`);
    console.log(`🌍 API Base URL: http://localhost:${port}/api`);
  } catch (err) {
    console.error('Error starting server:', err);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  await fastify.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down gracefully...');
  await fastify.close();
  process.exit(0);
});

if (require.main === module) {
  start();
}

export { buildApp };
