import { FastifyPluginAsync } from 'fastify';
import { reaBridge } from '../../services/reaBridge';
import { triModalDiscoveryService } from '../../services/triModalDiscoveryService';
import { z } from 'zod';

const analyzeAppSchema = z.object({
  projectPath: z.string().min(1, 'Target project path is required'),
});

const analyzeWebsiteSchema = z.object({
  url: z.string().url('A valid URL is required'),
});

const introspectDbSchema = z.object({
  dbPathOrUri: z.string().min(1, 'Database path or URI is required'),
});

const triModalDiscoverSchema = z.object({
  mode: z.enum(['MODE_A_GIT', 'MODE_B_LOCAL', 'MODE_C_STAGING']),
  gitConfig: z
    .object({
      repositoryUrl: z.string().min(1),
      branch: z.string().default('main'),
      authToken: z.string().optional(),
    })
    .optional(),
  localConfig: z
    .object({
      targetPath: z.string().min(1),
      zipFile: z.string().optional(),
    })
    .optional(),
  stagingConfig: z
    .object({
      stagingUrl: z.string().min(1),
      dbUri: z.string().min(1),
    })
    .optional(),
});

export const reaRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/status', async (_request, reply) => {
    const availability = await reaBridge.checkAvailability();
    return reply.send({
      service: 'rea-bridge',
      status: 'ONLINE',
      adapter: availability.method,
      version: availability.version ?? 'latest',
    });
  });

  fastify.post('/analyze-app', async (request, reply) => {
    const parseResult = analyzeAppSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'INVALID_INPUT',
        details: parseResult.error.format(),
      });
    }

    const result = await reaBridge.analyzeJavaScriptApplication(parseResult.data.projectPath);
    return reply.send(result);
  });

  fastify.post('/analyze-website', async (request, reply) => {
    const parseResult = analyzeWebsiteSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'INVALID_INPUT',
        details: parseResult.error.format(),
      });
    }

    const result = await reaBridge.analyzeWebsite(parseResult.data.url);
    return reply.send(result);
  });

  fastify.post('/introspect-db', async (request, reply) => {
    const parseResult = introspectDbSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'INVALID_INPUT',
        details: parseResult.error.format(),
      });
    }

    const result = await reaBridge.introspectDatabase(parseResult.data.dbPathOrUri);
    return reply.send(result);
  });

  fastify.post('/tri-modal-discover', async (request, reply) => {
    const parseResult = triModalDiscoverSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'INVALID_INPUT',
        details: parseResult.error.format(),
      });
    }

    try {
      const discoveryResult = await triModalDiscoveryService.executeDiscovery(parseResult.data);
      return reply.send({
        success: true,
        data: discoveryResult,
      });
    } catch (err: any) {
      return reply.status(500).send({
        success: false,
        error: err.message || 'Auto-discovery execution failed',
      });
    }
  });
};
