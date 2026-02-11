import { Alert, Endpoint, Check } from '@prisma/client';
import { prisma } from '../db/client.js';
import { env } from '../config/env.js';
import { logger } from '../logger.js';
import { sendTeamsAlert } from '../alerts/teams.js';
import { publish } from '../server/event-bus.js';

export type AlertType = 'down' | 'reminder' | 'recovery';

interface IncidentState {
    status: 'healthy' | 'down';
    incidentStartedAt: number | null;
    lastAlertAt: number | null;
}

const incidentState = new Map<string, IncidentState>();

function getState(endpointId: string): IncidentState {
    let state = incidentState.get(endpointId);
    if (!state) {
        state = { status: 'healthy', incidentStartedAt: null, lastAlertAt: null };
        incidentState.set(endpointId, state);
    }
    return state;
}

export function formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

export function buildAlertMessage(alertType: AlertType, name: string, durationMs: number): string {
    const duration = formatDuration(durationMs);
    switch (alertType) {
        case 'down':
            return `🚨 ${name} is DOWN`;
        case 'reminder':
            return `⏳ ${name} still down (${duration})`;
        case 'recovery':
            return `✅ ${name} recovered after ${duration}`;
    }
}

export async function createAlert(data: {
    endpointId: string;
    message: string;
    alertType?: AlertType;
    sent?: boolean;
}): Promise<Alert> {
    const alert = await prisma.alert.create({ data: { sent: true, ...data } });
    publish({ type: 'alert', payload: alert });
    return alert;
}

function isFailure(endpoint: Endpoint, check: Check): boolean {
    if (!check.success) return true;
    if (endpoint.alertThresholdMs !== null && check.responseTimeMs > endpoint.alertThresholdMs) return true;
    return false;
}

export function maybeSendAlert(
    endpoint: Endpoint,
    check: Check
): void {
    if (!endpoint.alertOnFailure) return;

    const failed = isFailure(endpoint, check);
    const state = getState(endpoint.id);
    const now = Date.now();

    let alertType: AlertType | null = null;
    let durationMs = 0;

    if (state.status === 'healthy' && failed) {
        // Transition: healthy → down (send immediate DOWN alert)
        alertType = 'down';
        state.status = 'down';
        state.incidentStartedAt = now;
        state.lastAlertAt = now;
    } else if (state.status === 'down' && failed) {
        // Still down — send reminder if cooldown expired
        durationMs = now - (state.incidentStartedAt ?? now);
        if (state.lastAlertAt === null || now - state.lastAlertAt >= env.ALERT_COOLDOWN_MS) {
            alertType = 'reminder';
            state.lastAlertAt = now;
        } else {
            logger.debug(
                { endpointId: endpoint.id, cooldownRemaining: env.ALERT_COOLDOWN_MS - (now - state.lastAlertAt) },
                'Alert suppressed (cooldown active)'
            );
        }
    } else if (state.status === 'down' && !failed) {
        // Transition: down → healthy (send RECOVERY alert)
        durationMs = now - (state.incidentStartedAt ?? now);
        alertType = 'recovery';
        state.status = 'healthy';
        state.incidentStartedAt = null;
        state.lastAlertAt = null;
    }
    // healthy + success = no-op

    if (!alertType) return;

    const message = buildAlertMessage(alertType, endpoint.name, durationMs);
    const currentAlertType = alertType;

    void (async (): Promise<void> => {
        const webhooks = await prisma.webhookUrl.findMany({ where: { active: true } });

        if (webhooks.length === 0) {
            await createAlert({
                endpointId: endpoint.id,
                message,
                alertType: currentAlertType,
                sent: false,
            });
            return;
        }

        const urls = webhooks.map((w) => w.url);
        const results = await Promise.allSettled(
            urls.map((url) => sendTeamsAlert(url, endpoint, check, env.ALERT_RETRY_COUNT, currentAlertType, durationMs))
        );

        for (const result of results) {
            const sent = result.status === 'fulfilled' && result.value;
            await createAlert({
                endpointId: endpoint.id,
                message: sent ? message : `Alert failed for ${endpoint.name}`,
                alertType: currentAlertType,
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
