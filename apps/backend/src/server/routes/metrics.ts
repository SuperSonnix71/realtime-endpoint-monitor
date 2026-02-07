import type { FastifyPluginCallback } from 'fastify';
import { getMetrics } from '../../services/metrics.service.js';

export const metricsRoutes: FastifyPluginCallback = (fastify, _opts, done) => {
    fastify.get('/metrics', async () => {
        return getMetrics();
    });
    done();
};
