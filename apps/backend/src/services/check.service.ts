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
