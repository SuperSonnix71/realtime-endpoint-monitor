import type { FastifyPluginCallback } from 'fastify';
import { listAlerts, dismissAlerts, dismissAlert } from '../../services/alert.service.js';
import { listAlertsQuery } from '../schemas.js';

export const alertsRoutes: FastifyPluginCallback = (fastify, _opts, done) => {
    fastify.get('/alerts', async (request) => {
        const parsed = listAlertsQuery.parse(request.query ?? {});
        return listAlerts(parsed.limit, parsed.all);
    });

    fastify.post('/alerts/dismiss', { preHandler: [fastify.authenticate] }, async () => {
        return dismissAlerts();
    });

    fastify.post('/alerts/:id/dismiss', { preHandler: [fastify.authenticate] }, async (request) => {
        const { id } = request.params as { id: string };
        return dismissAlert(id);
    });

    done();
};
