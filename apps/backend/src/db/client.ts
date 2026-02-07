import { PrismaClient } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import pino from 'pino';
import { env } from '../config/env.js';

const logger = pino({ level: env.LOG_LEVEL });

declare global {
    var prisma: PrismaClient | undefined;
}

export const prisma =
    global.prisma ??
    new PrismaClient({
        log: [{ level: 'error', emit: 'event' } as Prisma.LogDefinition],
    });

prisma.$on('error' as never, (e: Prisma.LogEvent) => {
    logger.error({ err: e }, 'Prisma error');
});

if (process.env.NODE_ENV !== 'production') {
    global.prisma = prisma;
}
