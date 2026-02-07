import type { FastifyPluginCallback } from 'fastify';
import {
    createEndpoint,
    listEndpoints,
    softDeleteEndpoint,
    updateEndpoint,
    CreateEndpointInput,
} from '../../services/endpoint.service.js';
import { prisma } from '../../db/client.js';
import { endpointCreateSchema, endpointUpdateSchema } from '../schemas.js';

type ImportEndpoint = CreateEndpointInput & { name: string };

export const endpointsRoutes: FastifyPluginCallback = (fastify, _opts, done) => {
    fastify.get('/endpoints', async () => {
        return listEndpoints();
    });

    fastify.post('/endpoints', {
        preHandler: [fastify.authenticate],
    }, async (request, reply) => {
        const body = endpointCreateSchema.parse(request.body ?? {});
        const endpoint = await createEndpoint(body);

        await prisma.auditLog.create({
            data: {
                userId: request.user.userId,
                action: 'create_endpoint',
                entityId: endpoint.id,
                entityName: endpoint.name,
            },
        });

        reply.code(201);
        return endpoint;
    });

    fastify.put('/endpoints/:id', {
        preHandler: [fastify.authenticate],
    }, async (request) => {
        const { id } = request.params as { id: string };
        const body = endpointUpdateSchema.parse(request.body ?? {});
        const endpoint = await updateEndpoint(id, body);

        await prisma.auditLog.create({
            data: {
                userId: request.user.userId,
                action: 'update_endpoint',
                entityId: endpoint.id,
                entityName: endpoint.name,
            },
        });

        return endpoint;
    });

    fastify.delete('/endpoints/:id', {
        preHandler: [fastify.authenticate],
    }, async (request, reply) => {
        const { id } = request.params as { id: string };

        const endpoint = await prisma.endpoint.findUnique({ where: { id }, select: { name: true } });
        await softDeleteEndpoint(id);

        await prisma.auditLog.create({
            data: {
                userId: request.user.userId,
                action: 'delete_endpoint',
                entityId: id,
                entityName: endpoint?.name ?? 'unknown',
            },
        });

        reply.code(204);
    });

    fastify.get('/endpoints/export', async (request, reply) => {
        const endpoints = await listEndpoints();
        const exportData = endpoints.map((e) => ({
            name: e.name,
            url: e.url,
            method: e.method,
            headers: e.headers,
            payload: e.payload,
            contentType: e.contentType,
            testFile: e.testFile ? e.testFile.toString('base64') : null,
            testFileName: e.testFileName,
            formFieldName: e.formFieldName,
            timeoutMs: e.timeoutMs,
            intervalSeconds: e.intervalSeconds,
            alertOnFailure: e.alertOnFailure,
            alertThresholdMs: e.alertThresholdMs,
        }));

        reply.header('Content-Type', 'application/json');
        reply.header('Content-Disposition', `attachment; filename="endpoints-${new Date().toISOString().split('T')[0]}.json"`);
        return exportData;
    });

    fastify.post('/endpoints/import', {
        preHandler: [fastify.authenticate],
    }, async (request, reply) => {
        const endpoints = request.body;

        if (!Array.isArray(endpoints)) {
            reply.code(400);
            return { error: 'Expected an array of endpoints' };
        }

        const results: Array<{ success: boolean; name: string; id?: string; error?: string }> = [];
        for (const data of endpoints) {
            try {
                const typedData = data as ImportEndpoint;
                const endpoint = await createEndpoint(typedData);

                await prisma.auditLog.create({
                    data: {
                        userId: request.user.userId,
                        action: 'create_endpoint',
                        entityId: endpoint.id,
                        entityName: endpoint.name,
                    },
                });

                results.push({ success: true, name: typedData.name, id: endpoint.id });
            } catch (error) {
                const typedData = data as ImportEndpoint;
                results.push({ success: false, name: typedData.name, error: error instanceof Error ? error.message : 'Unknown error' });
            }
        }

        return { imported: results.filter((r) => r.success).length, failed: results.filter((r) => !r.success).length, results };
    });
    done();
};
