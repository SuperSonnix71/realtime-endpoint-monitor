import { Endpoint, Prisma } from '@prisma/client';
import { env } from '../config/env.js';
import { logger } from '../logger.js';
import { getActiveEndpoints } from '../services/endpoint.service.js';
import { createCheck } from '../services/check.service.js';
import { executeRequest } from './executor.js';
import { scheduleRetentionJob } from './retention.js';
import { publish } from '../server/event-bus.js';
import { maybeSendAlert } from '../services/alert.service.js';

const MS_IN_SECOND = 1000;

function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export function shouldRunEndpoint(
    lastRunAt: number | undefined,
    intervalSeconds: number,
    now: number
): boolean {
    const intervalMs = intervalSeconds * MS_IN_SECOND;
    return lastRunAt === undefined || now - lastRunAt >= intervalMs;
}

export function needsRefresh(
    lastRefresh: number,
    now: number,
    refreshMs: number
): boolean {
    return now - lastRefresh >= refreshMs;
}

type SchedulerDeps = {
    fetchEndpoints?: () => Promise<Endpoint[]>;
    persistCheck?: typeof createCheck;
    execute?: typeof executeRequest;
    onStatusChange?: () => void;
    wait?: () => Promise<void>;
    now?: () => number;
};

export class RoundRobinScheduler {
    private currentIndex = 0;
    private isRunning = false;
    private cache: Endpoint[] = [];
    private lastRefresh = 0;
    private lastRunAt = new Map<string, number>();
    private stopRetention?: () => void;
    private readonly statusCallback?: (running: boolean) => void;
    private readonly fetchEndpoints: () => Promise<Endpoint[]>;
    private readonly persistCheck: typeof createCheck;
    private readonly execute: typeof executeRequest;
    private readonly wait: (ms: number) => Promise<void>;
    private readonly now: () => number;
    private active = 0;

    constructor(statusCallback?: (running: boolean) => void, deps: SchedulerDeps = {}) {
        this.statusCallback = statusCallback;
        this.fetchEndpoints = deps.fetchEndpoints ?? getActiveEndpoints;
        this.persistCheck = deps.persistCheck ?? createCheck;
        this.execute = deps.execute ?? executeRequest;
        this.wait = deps.wait ?? delay;
        this.now = deps.now ?? Date.now;
    }

    async start(): Promise<void> {
        if (this.isRunning) return;
        this.isRunning = true;
        this.statusCallback?.(true);

        const shutdown = (): void => this.stop();
        process.on('SIGTERM', shutdown);
        process.on('SIGINT', shutdown);
        this.stopRetention = scheduleRetentionJob();

        logger.info('Scheduler started');
        while (this.isRunning) {
            const now = this.now();
            await this.refreshCacheIfNeeded(now);

            if (this.cache.length === 0) {
                await this.wait(env.DISPATCH_DELAY_MS);
                continue;
            }

            if (this.active >= env.MAX_CONCURRENCY) {
                await this.wait(10);
                continue;
            }

            const endpoint = this.cache[this.currentIndex % this.cache.length];
            this.currentIndex = (this.currentIndex + 1) % this.cache.length;

            const lastRun = this.lastRunAt.get(endpoint.id) ?? 0;

            if (shouldRunEndpoint(lastRun, endpoint.intervalSeconds ?? 0, now)) {
                this.active += 1;
                this.lastRunAt.set(endpoint.id, this.now());
                void this.runEndpoint(endpoint)
                    .catch((error: unknown) => logger.error({ err: error, endpointId: endpoint.id }, 'Run failed'))
                    .finally((): void => {
                        this.active = Math.max(0, this.active - 1);
                    });
            }

            await this.wait(env.DISPATCH_DELAY_MS);
        }
    }

    stop(): void {
        if (!this.isRunning) return;
        this.isRunning = false;
        this.stopRetention?.();
        this.statusCallback?.(false);
        logger.info('Scheduler stopped');
    }

    private async refreshCacheIfNeeded(now: number): Promise<void> {
        if (!needsRefresh(this.lastRefresh, now, env.ENDPOINT_REFRESH_MS)) return;

        try {
            this.cache = await this.fetchEndpoints();
            this.lastRefresh = now;
            logger.debug({ count: this.cache.length }, 'Endpoints refreshed');
        } catch (error) {
            logger.error({ err: error }, 'Failed to refresh endpoints');
        }
    }

    private async runEndpoint(endpoint: Endpoint): Promise<void> {
        try {
            const result = await this.execute(endpoint);
            const check = await this.persistCheck({
                endpointId: endpoint.id,
                statusCode: result.statusCode,
                success: result.success,
                responseTimeMs: result.responseTimeMs,
                responseBody: result.responseBody as Prisma.JsonValue,
                error: result.error,
            });
            publish({ type: 'check', payload: { ...check, endpointId: endpoint.id } as unknown });
            maybeSendAlert(endpoint, check);
        } catch (error) {
            logger.error(
                { err: error, endpointId: endpoint.id },
                'Failed to execute endpoint'
            );
        }
    }
}
