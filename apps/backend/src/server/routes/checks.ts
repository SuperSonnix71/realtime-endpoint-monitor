import type { FastifyPluginCallback } from 'fastify';
import { z } from 'zod';
import { listChecks, listDailyCheckCounts } from '../../services/check.service.js';
import { listChecksQuery } from '../schemas.js';

const dailyCountsQuery = z.object({
    days: z
        .string()
        .optional()
        .transform((v) => (v !== undefined && v !== '' ? Number.parseInt(v, 10) : 14))
        .pipe(z.number().int().min(1).max(90)),
});

export const checksRoutes: FastifyPluginCallback = (fastify, _opts, done) => {
    fastify.get('/checks/daily-counts', async (request) => {
        const parsed = dailyCountsQuery.parse(request.query ?? {});
        return listDailyCheckCounts(parsed.days);
    });

    fastify.get('/checks', async (request) => {
        const parsed = listChecksQuery.parse(request.query ?? {});
        return listChecks({
            endpointId: parsed.endpoint_id,
            limit: parsed.limit,
        });
    });
    done();
};
