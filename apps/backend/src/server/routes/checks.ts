import type { FastifyPluginCallback } from 'fastify';
import { listChecks } from '../../services/check.service.js';
import { listChecksQuery } from '../schemas.js';

export const checksRoutes: FastifyPluginCallback = (fastify, _opts, done) => {
    fastify.get('/checks', async (request) => {
        const parsed = listChecksQuery.parse(request.query ?? {});
        return listChecks({
            endpointId: parsed.endpoint_id,
            limit: parsed.limit,
        });
    });
    done();
};
