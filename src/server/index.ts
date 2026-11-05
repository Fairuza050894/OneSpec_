import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import sensible from '@fastify/sensible';
import websocket from '@fastify/websocket';
import { reaRoutes } from './routes/reaRoutes';
import { workspaceRoutes } from './routes/workspaceRoutes';
import { discoveryRoutes } from './routes/discoveryRoutes';

export async function createApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: process.env.NODE_ENV === 'production' ? 'warn' : 'info',
    },
  });

  await app.register(cors, {
    origin: true,
    credentials: true,
  });

  await app.register(sensible);
  await app.register(websocket);

  // Health and System Info
  app.get('/health', async () => ({
    status: 'HEALTHY',
    service: 'OneSpec SDLC Workbench API',
    isoStandards: [
      'ISO/IEC/IEEE 29148:2018 (StRS / SyRS)',
      'ISO/IEC 19510:2013 (BPMN 2.0)',
      'ISO/IEC/IEEE 29119-3:2022 (RTM)',
    ],
    timestamp: new Date().toISOString(),
  }));

  // API Routes
  await app.register(reaRoutes, { prefix: '/api/rea' });
  await app.register(workspaceRoutes, { prefix: '/api/workspaces' });
  await app.register(discoveryRoutes, { prefix: '/api/discovery' });

  // WebSocket Live Telemetry Runner Stream (Step 7 Parity)
  app.register(async (streamApp) => {
    streamApp.get('/ws/runner-stream', { websocket: true }, (socket, _req) => {
      socket.send(
        JSON.stringify({
          type: 'STREAM_CONNECTED',
          channel: 'live-bottleneck-telemetry',
          timestamp: new Date().toISOString(),
        })
      );

      socket.on('message', (message: string) => {
        try {
          const payload = JSON.parse(message.toString());
          if (payload.action === 'PING') {
            socket.send(JSON.stringify({ type: 'PONG', timestamp: new Date().toISOString() }));
          }
        } catch {
          // Ignore malformed client message
        }
      });
    });
  });

  return app;
}

export async function bootstrap() {
  const app = await createApp();
  const port = Number(process.env.FASTIFY_PORT || 8080);
  const host = process.env.FASTIFY_HOST || '127.0.0.1';

  try {
    const address = await app.listen({ port, host });
    app.log.info(`OneSpec SDLC Backend listening at ${address}`);
    return app;
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

// Auto-run if executed directly
if (require.main === module || process.argv[1]?.includes('index.ts')) {
  bootstrap();
}
