import { Endpoint } from '@prisma/client';
import { request } from 'undici';
import { FormData, File } from 'undici';
import { env } from '../config/env.js';
import { logger } from '../logger.js';
import { CheckResult } from './types.js';

const TIMEOUT_FALLBACK_BUFFER_MS = 1000;

function buildHeaders(endpoint: Endpoint): Record<string, string> {
    const headers = (endpoint.headers as Record<string, string> | null) ?? {};
    return headers;
}

function redactHeaders(
    headers: Record<string, string>
): Record<string, string> {
    if (!headers.Authorization) return headers;
    return { ...headers, Authorization: '[REDACTED]' };
}

export async function executeRequest(
    endpoint: Endpoint
): Promise<CheckResult> {
    const startTime = performance.now();
    const timeoutMs = endpoint.timeoutMs ?? env.DEFAULT_TIMEOUT_MS;
    const timeoutHandle = setTimeout(
        () => logger.warn({ endpointId: endpoint.id }, 'Timeout fallback fired'),
        timeoutMs + TIMEOUT_FALLBACK_BUFFER_MS
    );

    try {
        const headers = buildHeaders(endpoint);
        let body: string | FormData | undefined;

        if (endpoint.testFile !== null && endpoint.testFileName !== null && endpoint.formFieldName !== null) {
            const formData = new FormData();
            const file = new File([new Uint8Array(endpoint.testFile)], endpoint.testFileName, {
                type: endpoint.contentType ?? 'application/octet-stream'
            });
            formData.append(endpoint.formFieldName, file);
            body = formData;
            delete headers['Content-Type'];
            delete headers['content-type'];
        } else if (endpoint.payload !== null) {
            body = JSON.stringify(endpoint.payload);
            if (headers['Content-Type'] === undefined && headers['content-type'] === undefined) {
                headers['Content-Type'] = 'application/json';
            }
        }

        const response = await Promise.race([
            request(endpoint.url, {
                method: endpoint.method as 'GET' | 'POST' | 'PUT' | 'DELETE',
                headers,
                body,
                signal: AbortSignal.timeout(timeoutMs),
            }),
            new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('Request timeout safety')), timeoutMs)
            ),
        ]);

        const responseTimeMs = Math.round(performance.now() - startTime);
        const responseBody = await response.body.json().catch(() => null);

        return {
            statusCode: response.statusCode,
            success: response.statusCode >= 200 && response.statusCode < 300,
            responseTimeMs,
            responseBody,
            error: null,
        };
    } catch (error) {
        const responseTimeMs = Math.round(performance.now() - startTime);
        logger.warn(
            {
                endpointId: endpoint.id,
                url: endpoint.url,
                headers: redactHeaders(buildHeaders(endpoint)),
                err: error,
            },
            'Request failed'
        );

        return {
            statusCode: null,
            success: false,
            responseTimeMs,
            responseBody: null,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    } finally {
        clearTimeout(timeoutHandle);
    }
}
