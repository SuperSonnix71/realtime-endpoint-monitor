import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyJwt from '@fastify/jwt';
import ssePlugin from 'fastify-sse-v2';
import bcrypt from 'bcryptjs';
import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { env } from '../config/env.js';
import { logger } from '../logger.js';
import { prisma } from '../db/client.js';
import { setupDatabase } from '../db/setup.js';
import { RoundRobinScheduler } from '../scheduler/index.js';
import { healthRoute } from './routes/health.js';
import { endpointsRoutes } from './routes/endpoints.js';
import { checksRoutes } from './routes/checks.js';
import { metricsRoutes } from './routes/metrics.js';
import { eventsRoutes } from './routes/events.js';
import { alertsRoutes } from './routes/alerts.js';
import { authRoutes } from './routes/auth.js';
import { usersRoutes } from './routes/users.js';
import { webhooksRoutes } from './routes/webhooks.js';
import { setSchedulerRunning } from './state.js';

declare module '@fastify/jwt' {
    interface FastifyJWT {
        payload: { userId: string; username: string };
        user: { userId: string; username: string };
    }
}

declare module 'fastify' {
    interface FastifyInstance {
        authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    }
}

const server = Fastify({ loggerInstance: logger });

async function bootstrapAdmin(): Promise<void> {
    const count = await prisma.user.count();
    if (count > 0) return;

    const passwordHash = await bcrypt.hash(env.ADMIN_PASSWORD, 10);
    await prisma.user.create({
        data: {
            username: env.ADMIN_USER,
            passwordHash,
            mustChangePassword: false,
        },
    });
    logger.info({ username: env.ADMIN_USER }, 'Bootstrap admin user created');
}

async function bootstrapWebhook(): Promise<void> {
    if (env.TEAMS_WEBHOOK_URL === undefined) return;

    const count = await prisma.webhookUrl.count();
    if (count > 0) return;

    await prisma.webhookUrl.create({
        data: {
            url: env.TEAMS_WEBHOOK_URL,
            label: 'Migrated from Environment',
        },
    });
    logger.info('Bootstrap webhook URL seeded from TEAMS_WEBHOOK_URL env var');
}

async function bootstrap(): Promise<void> {
    await setupDatabase();
    await bootstrapAdmin();
    await bootstrapWebhook();

    await server.register(fastifyJwt, { secret: env.JWT_SECRET });

    server.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            await request.jwtVerify();
        } catch {
            reply.code(401).send({ error: 'Unauthorized' });
        }
    });

    await server.register(cors, {
        origin: true,
        methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    });
    await server.register(ssePlugin as unknown as FastifyPluginAsync);
    await server.register(healthRoute);
    await server.register(authRoutes);
    await server.register(usersRoutes);
    await server.register(endpointsRoutes);
    await server.register(checksRoutes);
    await server.register(metricsRoutes);
    await server.register(alertsRoutes);
    await server.register(eventsRoutes);
    await server.register(webhooksRoutes);

    const scheduler = new RoundRobinScheduler(setSchedulerRunning);
    setSchedulerRunning(true);
    void scheduler.start().catch((err: unknown) => {
        logger.error({ err }, 'Scheduler failed to start');
        setSchedulerRunning(false);
    });

    server.addHook('onClose', (): void => {
        scheduler.stop();
        setSchedulerRunning(false);
    });

    try {
        await server.listen({ port: env.PORT, host: '0.0.0.0' });
        logger.info(`API listening on ${env.PORT}`);
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
}

void bootstrap();
