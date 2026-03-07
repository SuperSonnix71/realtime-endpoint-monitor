import { Check, Prisma } from '@prisma/client';
import { prisma } from '../db/client.js';

export type CreateCheckInput = Omit<Check, 'id' | 'createdAt'>;

export async function createCheck(data: CreateCheckInput): Promise<Check> {
    return prisma.check.create({
        data: {
            endpointId: data.endpointId,
            statusCode: data.statusCode,
            success: data.success,
            responseTimeMs: data.responseTimeMs,
            responseBody: data.responseBody !== null ? (data.responseBody as Prisma.InputJsonValue) : Prisma.JsonNull,
            error: data.error,
        }
    });
}

export async function listChecks(params: {
    endpointId?: string;
    limit?: number;
}): Promise<Check[]> {
    const { endpointId, limit = 100 } = params;
    return prisma.check.findMany({
        where: endpointId !== undefined ? { endpointId } : undefined,
        orderBy: { createdAt: 'desc' },
        take: Math.min(Math.max(limit, 1), 1000),
    });
}

export type DailyCheckCount = {
    day: string;
    endpointId: string;
    count: number;
};

export async function listDailyCheckCounts(days = 14): Promise<DailyCheckCount[]> {
    const rows = await prisma.$queryRaw<{ day: Date; endpoint_id: string; count: bigint }[]>`
        SELECT
            DATE(created_at) AS day,
            endpoint_id,
            COUNT(*) AS count
        FROM checks
        WHERE created_at >= NOW() - (${days}::int * INTERVAL '1 day')
        GROUP BY DATE(created_at), endpoint_id
        ORDER BY day ASC
    `;
    return rows.map((r) => ({
        day: r.day.toISOString().slice(0, 10),
        endpointId: r.endpoint_id,
        count: Number(r.count),
    }));
}
