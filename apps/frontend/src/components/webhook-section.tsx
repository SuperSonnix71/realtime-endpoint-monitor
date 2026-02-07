'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TrashIcon, SendIcon, PowerIcon } from '@/components/ui/icons';
import { authFetch } from '@/lib/auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

type Webhook = {
    id: string;
    url: string;
    label: string | null;
    active: boolean;
    createdAt: string;
};

export function WebhookSection({ open }: { open?: boolean }) {
    const [webhooks, setWebhooks] = useState<Webhook[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [newUrl, setNewUrl] = useState('');
    const [newLabel, setNewLabel] = useState('');
    const [error, setError] = useState('');
    const [creating, setCreating] = useState(false);
    const [testingId, setTestingId] = useState<string | null>(null);

    const fetchWebhooks = useCallback(async () => {
        const res = await authFetch(`${API_BASE}/webhooks`);
        if (res.ok) {
            setWebhooks(await res.json());
        }
    }, []);

    useEffect(() => {
        if (open) void fetchWebhooks();
    }, [open, fetchWebhooks]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setCreating(true);
        try {
            const res = await authFetch(`${API_BASE}/webhooks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: newUrl, label: newLabel || undefined }),
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.error || 'Failed to add webhook');
            }
            setNewUrl('');
            setNewLabel('');
            setShowForm(false);
            await fetchWebhooks();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to add webhook');
        } finally {
            setCreating(false);
        }
    };

    const handleToggle = async (id: string) => {
        setError('');
        try {
            const res = await authFetch(`${API_BASE}/webhooks/${id}/toggle`, { method: 'PATCH' });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.error || 'Failed to toggle webhook');
            }
            await fetchWebhooks();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to toggle webhook');
        }
    };

    const handleDelete = async (id: string) => {
        setError('');
        try {
            const res = await authFetch(`${API_BASE}/webhooks/${id}`, { method: 'DELETE' });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.error || 'Failed to delete webhook');
            }
            await fetchWebhooks();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete webhook');
        }
    };

    const handleTest = async (id: string) => {
        setError('');
        setTestingId(id);
        try {
            const res = await authFetch(`${API_BASE}/webhooks/${id}/test`, { method: 'POST' });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.error || 'Test failed');
            }
            const result = await res.json();
            if (!result.sent) {
                setError('Test notification was not delivered');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Test failed');
        } finally {
            setTestingId(null);
        }
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3">
                <CardTitle>Webhook / Push Notifications</CardTitle>
                <Button variant="outline" size="sm" onClick={() => setShowForm(!showForm)}>
                    {showForm ? 'Cancel' : 'Add URL'}
                </Button>
            </CardHeader>
            <CardContent>
                {showForm && (
                    <form onSubmit={handleCreate} className="flex items-end gap-3 mb-4 p-3 rounded-lg bg-slate-50 dark:bg-neutral-800/50 border border-slate-200 dark:border-neutral-700">
                        <div className="flex flex-col gap-1.5 flex-1">
                            <Label htmlFor="new-webhook-url">Webhook URL</Label>
                            <Input
                                id="new-webhook-url"
                                type="url"
                                placeholder="https://outlook.office.com/webhook/..."
                                value={newUrl}
                                onChange={(e) => setNewUrl(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="new-webhook-label">Label (optional)</Label>
                            <Input
                                id="new-webhook-label"
                                placeholder="e.g. Team Channel"
                                value={newLabel}
                                onChange={(e) => setNewLabel(e.target.value)}
                                className="w-48"
                            />
                        </div>
                        <Button type="submit" size="sm" disabled={creating || !newUrl}>
                            {creating ? 'Adding...' : 'Create'}
                        </Button>
                    </form>
                )}

                {error && (
                    <p className="text-sm text-red-600 dark:text-red-400 mb-3">{error}</p>
                )}

                {webhooks.length === 0 && !showForm ? (
                    <p className="text-sm text-slate-500 dark:text-neutral-400">
                        No webhook URLs configured. Add a URL to receive push notifications when monitors fail.
                    </p>
                ) : (
                    <div className="flex flex-col gap-2">
                        {webhooks.map((w) => (
                            <div
                                key={w.id}
                                className={`flex items-center gap-3 p-3 rounded-lg border bg-white dark:bg-neutral-800 ${w.active ? 'border-slate-200 dark:border-neutral-700' : 'border-slate-200 dark:border-neutral-700 opacity-50'}`}
                            >
                                <div className="flex-1 min-w-0">
                                    {w.label && (
                                        <span className="text-sm font-medium text-slate-900 dark:text-neutral-100 mr-2">
                                            {w.label}
                                        </span>
                                    )}
                                    <span className="text-sm text-slate-500 dark:text-neutral-400 truncate block">
                                        {w.url}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => void handleToggle(w.id)}
                                        aria-label={w.active ? 'Disable webhook' : 'Enable webhook'}
                                        title={w.active ? 'Disable' : 'Enable'}
                                        className={w.active ? 'text-green-600 dark:text-green-400' : 'text-slate-400 dark:text-neutral-500'}
                                    >
                                        <PowerIcon size={16} />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => void handleTest(w.id)}
                                        disabled={testingId === w.id}
                                        aria-label="Test webhook"
                                        title="Send test notification"
                                    >
                                        <SendIcon size={16} />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => void handleDelete(w.id)}
                                        aria-label="Delete webhook"
                                        title="Delete webhook"
                                    >
                                        <TrashIcon size={16} />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
