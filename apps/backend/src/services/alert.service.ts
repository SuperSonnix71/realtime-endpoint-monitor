import { Alert, Endpoint, Check } from '@prisma/client';
import { prisma } from '../db/client.js';
import { env } from '../config/env.js';
import { logger } from '../logger.js';
import { sendTeamsAlert } from '../alerts/teams.js';
import { publish } from '../server/event-bus.js';

export async function createAlert(data: {
    endpointId: string;
    message: string;
    sent?: boolean;
}): Promise<Alert> {
    const alert = await prisma.alert.create({ data: { sent: true, ...data } });
    publish({ type: 'alert', payload: alert });
    return alert;
}

export function maybeSendAlert(
    endpoint: Endpoint,
    check: Check
): void {
    const shouldAlert =
        endpoint.alertOnFailure &&
        (!check.success ||
            (endpoint.alertThresholdMs !== null &&
                check.responseTimeMs > endpoint.alertThresholdMs));

    if (!shouldAlert) return;

    void (async (): Promise<void> => {
        const webhooks = await prisma.webhookUrl.findMany({ where: { active: true } });
        if (webhooks.length === 0) return;

        const urls = webhooks.map((w) => w.url);
        const results = await Promise.allSettled(
            urls.map((url) => sendTeamsAlert(url, endpoint, check, env.ALERT_RETRY_COUNT))
        );

        for (const result of results) {
            const sent = result.status === 'fulfilled' && result.value;
            await createAlert({
                endpointId: endpoint.id,
                message: sent
                    ? `Alert sent for ${endpoint.name}`
                    : `Alert failed for ${endpoint.name}`,
                sent,
            });
        }
    })().catch((error: unknown) => {
        logger.error({ err: error, endpointId: endpoint.id }, 'Alert pipeline failed');
    });
}

export async function listAlerts(limit = 100, all = false): Promise<Alert[]> {
    return prisma.alert.findMany({
        where: all ? {} : { dismissed: false },
        orderBy: { createdAt: 'desc' },
        take: Math.min(Math.max(limit, 1), 500),
    });
}

export async function dismissAlerts(): Promise<{ count: number }> {
    const result = await prisma.alert.updateMany({
        where: { dismissed: false },
        data: { dismissed: true },
    });
    return { count: result.count };
}

export async function dismissAlert(id: string): Promise<Alert> {
    return prisma.alert.update({
        where: { id },
        data: { dismissed: true },
    });
}
