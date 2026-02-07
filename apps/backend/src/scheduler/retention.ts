import { prisma } from '../db/client.js';
import { env } from '../config/env.js';
import { logger } from '../logger.js';

const DAY_MS = 24 * 60 * 60 * 1000;

let lastPruneAt: Date | null = null;
let lastPruneError: string | null = null;

export function getRetentionStatus(): {
    lastPruneAt: Date | null;
    lastPruneError: string | null;
    retentionDays: number;
} {
    return {
        lastPruneAt,
        lastPruneError,
        retentionDays: env.RETENTION_DAYS,
    };
}

export async function pruneOldChecks(): Promise<void> {
    const cutoff = new Date(Date.now() - env.RETENTION_DAYS * DAY_MS);
    const result = await prisma.check.deleteMany({
        where: { createdAt: { lt: cutoff } },
    });
    lastPruneAt = new Date();
    lastPruneError = null;
    logger.info(
        { deleted: result.count, cutoff: cutoff.toISOString() },
        'Retention job completed'
    );
}

export function scheduleRetentionJob(): () => void {
    const timer = setInterval(() => {
        void pruneOldChecks().catch((error: unknown) => {
            lastPruneError = error instanceof Error ? error.message : 'unknown error';
            logger.error({ err: error }, 'Retention job failed');
        });
    }, DAY_MS);

    return () => clearInterval(timer);
}
