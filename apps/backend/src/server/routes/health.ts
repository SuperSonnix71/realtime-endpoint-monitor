import type { FastifyPluginCallback } from 'fastify';
import { prisma } from '../../db/client.js';
import { schedulerStatus } from '../state.js';
import { getRetentionStatus } from '../../scheduler/retention.js';

export const healthRoute: FastifyPluginCallback = (fastify, _opts, done) => {
    fastify.get('/health', async () => {
        const dbStatus = await prisma.$queryRaw`SELECT 1 as ok`;
        return {
            db: Array.isArray(dbStatus) ? 'ok' : 'unknown',
            scheduler: schedulerStatus(),
            retention: getRetentionStatus(),
        };
    });
    done();
};
