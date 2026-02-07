'use client';

import { useMemo, useState } from 'react';
import { z } from 'zod';
import type { Endpoint } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

const METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] as const;

const endpointInputSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    url: z.string().url('URL must be valid'),
    method: z.enum(METHODS),
    headers: z.record(z.string()).optional(),
    payload: z.unknown().optional(),
    contentType: z.string().optional(),
    testFile: z.string().optional(),
    testFileName: z.string().optional(),
    formFieldName: z.string().optional(),
    timeoutMs: z.number().int().positive('Timeout must be > 0'),
    intervalSeconds: z.number().int().positive('Interval must be > 0'),
    alertOnFailure: z.boolean(),
    alertThresholdMs: z.number().int().positive('Threshold must be > 0').nullable(),
    active: z.boolean(),
});

type EndpointInput = z.infer<typeof endpointInputSchema>;
export type { EndpointInput };

type FieldErrors = Partial<Record<keyof EndpointInput | 'headersJson' | 'payloadJson', string>>;

function toPrettyJson(value: unknown, fallback = ''): string {
    if (value == null) return fallback;
    try {
        return JSON.stringify(value, null, 2);
    } catch {
        return fallback;
    }
}

function parseOptionalJson(input: string): { ok: true; value: unknown } | { ok: false; error: string } {
    const trimmed = input.trim();
    if (!trimmed) return { ok: true, value: undefined };
    try {
        return { ok: true, value: JSON.parse(trimmed) };
    } catch {
        return { ok: false, error: 'Invalid JSON' };
    }
}

export function EndpointForm({
    endpoint,
    onSubmit,
    onCancel,
    submitting,
}: {
    endpoint?: Endpoint;
    onSubmit: (input: EndpointInput) => Promise<void> | void;
    onCancel?: () => void;
    submitting?: boolean;
}) {
    const defaults = useMemo(() => {
        return {
            name: endpoint?.name ?? '',
            url: endpoint?.url ?? '',
            method: (endpoint?.method as (typeof METHODS)[number]) ?? 'GET',
            headersJson: endpoint ? toPrettyJson(endpoint.headers, '{}') : '{\n  \n}',
            payloadJson: endpoint ? toPrettyJson(endpoint.payload, '') : '',
            formFieldName: (endpoint as any)?.formFieldName ?? 'file',
            timeoutMs: String(endpoint?.timeoutMs ?? 30000),
            intervalSeconds: String(endpoint?.intervalSeconds ?? 60),
            alertOnFailure: endpoint?.alertOnFailure ?? true,
            alertThresholdMs: endpoint?.alertThresholdMs == null ? '' : String(endpoint.alertThresholdMs),
            active: endpoint?.active ?? true,
        };
    }, [endpoint]);

    const [name, setName] = useState(defaults.name);
    const [url, setUrl] = useState(defaults.url);
    const [method, setMethod] = useState<(typeof METHODS)[number]>(defaults.method);
    const [headersJson, setHeadersJson] = useState(defaults.headersJson);
    const [payloadJson, setPayloadJson] = useState(defaults.payloadJson);
    const [testFile, setTestFile] = useState<string | null>(null);
    const [testFileName, setTestFileName] = useState<string>('');
    const [formFieldName, setFormFieldName] = useState(defaults.formFieldName);
    const [timeoutMs, setTimeoutMs] = useState(defaults.timeoutMs);
    const [intervalSeconds, setIntervalSeconds] = useState(defaults.intervalSeconds);
    const [alertOnFailure, setAlertOnFailure] = useState(defaults.alertOnFailure);
    const [alertThresholdMs, setAlertThresholdMs] = useState(defaults.alertThresholdMs);
    const [active, setActive] = useState(defaults.active);
    const [errors, setErrors] = useState<FieldErrors>({});

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setTestFileName(file.name);
            const reader = new FileReader();
            reader.onload = () => {
                const base64 = (reader.result as string).split(',')[1];
                setTestFile(base64);
            };
            reader.readAsDataURL(file);
        }
    };

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});

        const parsedHeaders = parseOptionalJson(headersJson);
        if (!parsedHeaders.ok) return setErrors({ headersJson: parsedHeaders.error });
        if (parsedHeaders.value != null && (typeof parsedHeaders.value !== 'object' || Array.isArray(parsedHeaders.value))) {
            return setErrors({ headersJson: 'Headers must be a JSON object' });
        }

        const parsedPayload = parseOptionalJson(payloadJson);
        if (!parsedPayload.ok) return setErrors({ payloadJson: parsedPayload.error });

        const threshold = alertThresholdMs.trim() ? Number(alertThresholdMs) : null;
        const input = {
            name,
            url,
            method,
            headers: (parsedHeaders.value ?? undefined) as Record<string, string> | undefined,
            payload: parsedPayload.value,
            contentType: testFile && testFileName ? 'application/pdf' : undefined,
            testFile: testFile || undefined,
            testFileName: testFileName || undefined,
            formFieldName: testFile ? formFieldName : undefined,
            timeoutMs: Number(timeoutMs),
            intervalSeconds: Number(intervalSeconds),
            alertOnFailure,
            alertThresholdMs: threshold,
            active,
        };

        const result = endpointInputSchema.safeParse(input);
        if (!result.success) {
            const next: FieldErrors = {};
            for (const issue of result.error.issues) {
                const key = issue.path[0] as keyof EndpointInput | undefined;
                if (!key) continue;
                if (key === 'headers') next.headersJson = issue.message;
                else next[key] = issue.message;
            }
            setErrors(next);
            return;
        }

        await onSubmit(result.data);
    };

    return (
        <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="API Health Check" />
                    {errors.name && <p className="text-xs text-red-600">{errors.name}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="url">URL</Label>
                    <Input id="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com/health" />
                    {errors.url && <p className="text-xs text-red-600">{errors.url}</p>}
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="method">Method</Label>
                    <select
                        id="method"
                        value={method}
                        onChange={(e) => setMethod(e.target.value as (typeof METHODS)[number])}
                        className="h-10 w-full rounded-md border border-slate-200 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 text-sm text-slate-900 dark:text-neutral-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-800"
                    >
                        {METHODS.map((m) => (
                            <option key={m} value={m}>
                                {m}
                            </option>
                        ))}
                    </select>
                    {errors.method && <p className="text-xs text-red-600">{errors.method}</p>}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="timeoutMs">Timeout (ms)</Label>
                        <Input id="timeoutMs" inputMode="numeric" value={timeoutMs} onChange={(e) => setTimeoutMs(e.target.value)} />
                        {errors.timeoutMs && <p className="text-xs text-red-600">{errors.timeoutMs}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="intervalSeconds">Interval (s)</Label>
                        <Input
                            id="intervalSeconds"
                            inputMode="numeric"
                            value={intervalSeconds}
                            onChange={(e) => setIntervalSeconds(e.target.value)}
                        />
                        {errors.intervalSeconds && <p className="text-xs text-red-600">{errors.intervalSeconds}</p>}
                    </div>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="headers">Headers (JSON)</Label>
                    <Textarea id="headers" value={headersJson} onChange={(e) => setHeadersJson(e.target.value)} rows={6} />
                    {errors.headersJson && <p className="text-xs text-red-600">{errors.headersJson}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="payload">Payload (JSON)</Label>
                    <Textarea id="payload" value={payloadJson} onChange={(e) => setPayloadJson(e.target.value)} rows={6} />
                    {errors.payloadJson && <p className="text-xs text-red-600">{errors.payloadJson}</p>}
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="testFile">Test File (for multipart/form-data)</Label>
                    <Input id="testFile" type="file" onChange={handleFileChange} accept=".pdf,.txt,.json" />
                    {testFileName && <p className="text-xs text-slate-600 dark:text-neutral-400">Selected: {testFileName}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="formFieldName">Form Field Name</Label>
                    <Input
                        id="formFieldName"
                        value={formFieldName}
                        onChange={(e) => setFormFieldName(e.target.value)}
                        placeholder="file"
                        disabled={!testFile}
                    />
                    <p className="text-xs text-slate-500">Field name for the file upload (e.g., 'file')</p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <div className="flex items-center justify-between rounded-lg border border-slate-100 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800/50 px-3 py-2">
                    <div>
                        <div className="text-sm font-semibold text-slate-800 dark:text-neutral-200">Alert on failure</div>
                        <div className="text-xs text-slate-500 dark:text-neutral-400">Send Teams alert when checks fail</div>
                    </div>
                    <Switch checked={alertOnFailure} onCheckedChange={setAlertOnFailure} />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="alertThresholdMs">Alert Threshold (ms)</Label>
                    <Input
                        id="alertThresholdMs"
                        inputMode="numeric"
                        value={alertThresholdMs}
                        onChange={(e) => setAlertThresholdMs(e.target.value)}
                        placeholder="(optional)"
                    />
                    {errors.alertThresholdMs && <p className="text-xs text-red-600">{errors.alertThresholdMs}</p>}
                </div>

                <div className="flex items-center justify-between rounded-lg border border-slate-100 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800/50 px-3 py-2">
                    <div>
                        <div className="text-sm font-semibold text-slate-800 dark:text-neutral-200">Active</div>
                        <div className="text-xs text-slate-500 dark:text-neutral-400">Include in scheduler</div>
                    </div>
                    <Switch checked={active} onCheckedChange={setActive} />
                </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
                {onCancel && (
                    <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
                        Cancel
                    </Button>
                )}
                <Button type="submit" disabled={submitting}>
                    {submitting ? 'Saving…' : 'Save'}
                </Button>
            </div>
        </form>
    );
}
