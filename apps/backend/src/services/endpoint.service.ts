import { Endpoint, Prisma } from '@prisma/client';
import { prisma } from '../db/client.js';
import { Buffer } from 'node:buffer';

export type CreateEndpointInput = {
    name: string;
    url: string;
    method?: string;
    headers?: Record<string, string>;
    payload?: unknown;
    contentType?: string;
    testFile?: string; // base64
    testFileName?: string;
    formFieldName?: string;
    timeoutMs?: number;
    intervalSeconds?: number;
    alertOnFailure?: boolean;
    alertThresholdMs?: number | null;
    active?: boolean;
};

export async function getActiveEndpoints(): Promise<Endpoint[]> {
    return prisma.endpoint.findMany({
        where: { active: true },
        orderBy: { createdAt: 'asc' },
    });
}

export async function listEndpoints(): Promise<Endpoint[]> {
    return prisma.endpoint.findMany({
        orderBy: { createdAt: 'desc' },
    });
}

export async function createEndpoint(
    data: CreateEndpointInput
): Promise<Endpoint> {
    const testFileBuffer = (data.testFile !== undefined && data.testFile !== null)
        ? Buffer.from(data.testFile, 'base64')
        : null;

    return prisma.endpoint.create({
        data: {
            name: data.name,
            url: data.url,
            method: data.method ?? 'GET',
            headers: (data.headers ?? {}) as Prisma.InputJsonValue,
            payload: data.payload !== undefined && data.payload !== null ? (data.payload as Prisma.InputJsonValue) : Prisma.JsonNull,
            contentType: data.contentType ?? null,
            testFile: testFileBuffer,
            testFileName: data.testFileName ?? null,
            formFieldName: data.formFieldName ?? null,
            timeoutMs: data.timeoutMs ?? 30000,
            intervalSeconds: data.intervalSeconds ?? 60,
            alertOnFailure: data.alertOnFailure ?? true,
            alertThresholdMs: data.alertThresholdMs ?? null,
            active: data.active ?? true,
        },
    });
}

export async function updateEndpoint(
    id: string,
    data: Partial<CreateEndpointInput>
): Promise<Endpoint> {
    const testFileBuffer = data.testFile !== undefined ? Buffer.from(data.testFile, 'base64') : undefined;

    const updateData: Partial<{
        name: string;
        url: string;
        method: string;
        headers: Prisma.InputJsonValue;
        payload: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput;
        contentType: string | null;
        testFileName: string | null;
        formFieldName: string | null;
        timeoutMs: number;
        intervalSeconds: number;
        alertOnFailure: boolean;
        alertThresholdMs: number | null;
        active: boolean;
    }> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.url !== undefined) updateData.url = data.url;
    if (data.method !== undefined) updateData.method = data.method;
    if (data.headers !== undefined) updateData.headers = data.headers as Prisma.InputJsonValue;
    if (data.payload !== undefined) {
        updateData.payload = data.payload !== null ? (data.payload as Prisma.InputJsonValue) : Prisma.JsonNull;
    }
    if (data.contentType !== undefined) updateData.contentType = data.contentType;
    if (data.testFileName !== undefined) updateData.testFileName = data.testFileName;
    if (data.formFieldName !== undefined) updateData.formFieldName = data.formFieldName;
    if (data.timeoutMs !== undefined) updateData.timeoutMs = data.timeoutMs;
    if (data.intervalSeconds !== undefined) updateData.intervalSeconds = data.intervalSeconds;
    if (data.alertOnFailure !== undefined) updateData.alertOnFailure = data.alertOnFailure;
    if (data.alertThresholdMs !== undefined) updateData.alertThresholdMs = data.alertThresholdMs;
    if (data.active !== undefined) updateData.active = data.active;

    return prisma.endpoint.update({
        where: { id },
        data: {
            ...updateData,
            ...(testFileBuffer !== undefined ? { testFile: testFileBuffer } : {}),
        }
    });
}

export async function softDeleteEndpoint(id: string): Promise<void> {
    await prisma.endpoint.delete({ where: { id } });
}
