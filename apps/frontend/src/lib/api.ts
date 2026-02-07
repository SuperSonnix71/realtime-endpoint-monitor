import { Endpoint, Check, Metrics, Alert, WebhookUrl } from '@/types';
import { getToken, logout } from '@/lib/auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

function authHeaders(): Record<string, string> {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handle<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
    const res = await fetch(input, init);
    if (res.status === 401) {
        logout();
    }
    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || res.statusText);
    }
    if (res.status === 204) return undefined as T;
    return res.json();
}

export const api = {
    endpoints: {
        list: () => handle<Endpoint[]>(`${API_BASE}/endpoints`),
        create: (data: Partial<Endpoint>) =>
            handle<Endpoint>(`${API_BASE}/endpoints`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeaders() },
                body: JSON.stringify(data),
            }),
        update: (id: string, data: Partial<Endpoint>) =>
            handle<Endpoint>(`${API_BASE}/endpoints/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', ...authHeaders() },
                body: JSON.stringify(data),
            }),
        delete: (id: string) =>
            handle<void>(`${API_BASE}/endpoints/${id}`, {
                method: 'DELETE',
                headers: { ...authHeaders() },
            }),
    },
    checks: {
        list: (endpointId?: string, limit = 100) =>
            handle<Check[]>(`${API_BASE}/checks?${new URLSearchParams({
                ...(endpointId ? { endpoint_id: endpointId } : {}),
                limit: String(limit),
            })}`),
    },
    metrics: {
        get: () => handle<Metrics>(`${API_BASE}/metrics`),
    },
    alerts: {
        list: (all = false) => handle<Alert[]>(`${API_BASE}/alerts${all ? '?all=true' : ''}`),
        dismiss: () =>
            handle<{ count: number }>(`${API_BASE}/alerts/dismiss`, {
                method: 'POST',
                headers: { ...authHeaders() },
            }),
        dismissOne: (id: string) =>
            handle<Alert>(`${API_BASE}/alerts/${id}/dismiss`, {
                method: 'POST',
                headers: { ...authHeaders() },
            }),
    },
    webhooks: {
        list: () =>
            handle<WebhookUrl[]>(`${API_BASE}/webhooks`, {
                headers: { ...authHeaders() },
            }),
        create: (data: { url: string; label?: string }) =>
            handle<WebhookUrl>(`${API_BASE}/webhooks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeaders() },
                body: JSON.stringify(data),
            }),
        delete: (id: string) =>
            handle<void>(`${API_BASE}/webhooks/${id}`, {
                method: 'DELETE',
                headers: { ...authHeaders() },
            }),
        test: (id: string) =>
            handle<{ sent: boolean }>(`${API_BASE}/webhooks/${id}/test`, {
                method: 'POST',
                headers: { ...authHeaders() },
            }),
        toggle: (id: string) =>
            handle<WebhookUrl>(`${API_BASE}/webhooks/${id}/toggle`, {
                method: 'PATCH',
                headers: { ...authHeaders() },
            }),
    },
};
