import { z } from 'zod';

export const endpointCreateSchema = z.object({
    name: z.string().min(1),
    url: z.string().url(),
    method: z.string().default('GET'),
    headers: z.record(z.string()).optional(),
    payload: z.any().optional(),
    contentType: z.string().optional(),
    testFile: z.string().optional(), // base64 encoded file
    testFileName: z.string().optional(),
    formFieldName: z.string().optional(),
    timeoutMs: z.number().int().positive().default(30000),
    intervalSeconds: z.number().int().positive().default(60),
    alertOnFailure: z.boolean().default(true),
    alertThresholdMs: z.number().int().positive().nullable().optional(),
    active: z.boolean().default(true),
});

export const endpointUpdateSchema = endpointCreateSchema.partial();

export const listChecksQuery = z.object({
    endpoint_id: z.string().uuid().optional(),
    limit: z
        .string()
        .optional()
        .transform((v) => (v !== undefined && v !== null && v !== '' ? Number.parseInt(v, 10) : undefined))
        .pipe(z.number().int().positive().max(1000).optional()),
});

export const listAlertsQuery = z.object({
    limit: z
        .string()
        .optional()
        .transform((v) => (v !== undefined && v !== null && v !== '' ? Number.parseInt(v, 10) : undefined))
        .pipe(z.number().int().positive().max(500).optional()),
    all: z
        .string()
        .optional()
        .transform((v) => v === 'true'),
});
