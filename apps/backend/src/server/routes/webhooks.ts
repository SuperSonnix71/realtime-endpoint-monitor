import type { FastifyPluginCallback } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../db/client.js';
import { logger } from '../../logger.js';
import { sendTeamsAlert } from '../../alerts/teams.js';
import type { Endpoint, Check } from '@prisma/client';

const createWebhookSchema = z.object({
    url: z.string().url(),
    label: z.string().optional(),
});

export const webhooksRoutes: FastifyPluginCallback = (fastify, _opts, done) => {
    fastify.addHook('preHandler', fastify.authenticate);

    fastify.get('/webhooks', async () => {
        return prisma.webhookUrl.findMany({
            orderBy: { createdAt: 'asc' },
        });
    });

    fastify.post('/webhooks', async (request, reply) => {
        const { url, label } = createWebhookSchema.parse(request.body);

        const webhook = await prisma.webhookUrl.create({
            data: { url, label },
        });

        await prisma.auditLog.create({
            data: {
                userId: request.user.userId,
                action: 'webhook.create',
                entityId: webhook.id,
                entityName: label ?? url,
            },
        });

        reply.code(201);
        return webhook;
    });

    fastify.patch('/webhooks/:id/toggle', async (request, reply) => {
        const { id } = request.params as { id: string };

        const webhook = await prisma.webhookUrl.findUnique({ where: { id } });
        if (!webhook) {
            reply.code(404);
            return { error: 'Webhook not found' };
        }

        const updated = await prisma.webhookUrl.update({
            where: { id },
            data: { active: !webhook.active },
        });

        await prisma.auditLog.create({
            data: {
                userId: request.user.userId,
                action: updated.active ? 'webhook.enable' : 'webhook.disable',
                entityId: id,
                entityName: webhook.label ?? webhook.url,
            },
        });

        return updated;
    });

    fastify.delete('/webhooks/:id', async (request, reply) => {
        const { id } = request.params as { id: string };

        const webhook = await prisma.webhookUrl.findUnique({ where: { id } });
        if (!webhook) {
            reply.code(404);
            return { error: 'Webhook not found' };
        }

        await prisma.webhookUrl.delete({ where: { id } });

        await prisma.auditLog.create({
            data: {
                userId: request.user.userId,
                action: 'webhook.delete',
                entityId: id,
                entityName: webhook.label ?? webhook.url,
            },
        });

        reply.code(204);
    });

    fastify.post('/webhooks/:id/test', async (request, reply) => {
        const { id } = request.params as { id: string };

        const webhook = await prisma.webhookUrl.findUnique({ where: { id } });
        if (!webhook) {
            reply.code(404);
            return { error: 'Webhook not found' };
        }

        const mockEndpoint = {
            id: 'test',
            name: 'Test Endpoint',
            url: 'https://example.com/health',
            method: 'GET',
            headers: {},
            payload: null,
            contentType: null,
            testFile: null,
            testFileName: null,
            formFieldName: null,
            timeoutMs: 30000,
            intervalSeconds: 60,
            alertOnFailure: true,
            alertThresholdMs: null,
            active: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        } satisfies Endpoint;

        const mockCheck = {
            id: 'test',
            endpointId: 'test',
            statusCode: 500,
            success: false,
            responseTimeMs: 1234,
            responseBody: null,
            error: 'This is a test alert from the monitor system',
            createdAt: new Date(),
        } satisfies Check;

        try {
            const sent = await sendTeamsAlert(webhook.url, mockEndpoint, mockCheck, 1);

            await prisma.auditLog.create({
                data: {
                    userId: request.user.userId,
                    action: 'webhook.test',
                    entityId: id,
                    entityName: webhook.label ?? webhook.url,
                },
            });

            return { sent };
        } catch (error) {
            logger.error({ err: error, webhookId: id }, 'Webhook test failed');
            reply.code(502);
            return { sent: false, error: 'Failed to send test notification' };
        }
    });

    done();
};
