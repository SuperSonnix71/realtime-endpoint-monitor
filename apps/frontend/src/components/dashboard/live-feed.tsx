'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDate, formatMillis } from '@/lib/format';
import type { Check } from '@/types';

type FeedItem = Check & { receivedAt: number };

const MAX_ITEMS = 20;

export function LiveFeed() {
    const scrollRef = useRef<HTMLDivElement | null>(null);
    const [items, setItems] = useState<FeedItem[]>([]);

    const { data: endpoints } = useQuery({
        queryKey: ['endpoints'],
        queryFn: api.endpoints.list,
        refetchInterval: 30000,
    });

    const { data: initialChecks } = useQuery({
        queryKey: ['checks', 'live-feed'],
        queryFn: () => api.checks.list(undefined, MAX_ITEMS),
        refetchInterval: 30000,
    });

    const endpointNameById = useMemo(() => {
        const map = new Map<string, string>();
        endpoints?.forEach((e) => map.set(e.id, e.name));
        return map;
    }, [endpoints]);

    useEffect(() => {
        if (!initialChecks?.length) return;
        setItems((prev) => {
            if (prev.length > 0) return prev;
            return initialChecks
                .slice()
                .reverse()
                .map((c) => ({ ...c, receivedAt: Date.now() }))
                .slice(-MAX_ITEMS);
        });
    }, [initialChecks]);

    useEffect(() => {
        const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        const url = `${base}/events`;
        const source = new EventSource(url);

        const onCheck = (e: MessageEvent) => {
            let parsed: Check | null = null;
            try {
                parsed = JSON.parse(e.data) as Check;
            } catch {
                parsed = null;
            }
            if (!parsed) return;

            setItems((prev) => [...prev, { ...parsed!, receivedAt: Date.now() }].slice(-MAX_ITEMS));
        };

        source.addEventListener('check', onCheck as EventListener);
        return () => source.close();
    }, []);

    useEffect(() => {
        const viewport = scrollRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement | null;
        if (viewport) {
            viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
        }
    }, [items.length]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Live Feed</CardTitle>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-64 rounded-lg border border-slate-100 dark:border-neutral-700" ref={scrollRef}>
                    <div className="divide-y divide-slate-100 dark:divide-neutral-700">
                        {items.map((item) => {
                            const name = endpointNameById.get(item.endpointId) ?? item.endpointId;
                            return (
                                <div key={`${item.id}-${item.receivedAt}`} className="px-3 py-2 flex items-center gap-3">
                                    <Badge tone={item.success ? 'success' : 'danger'}>
                                        {item.success ? 'OK' : 'FAIL'}
                                    </Badge>
                                    <div className="min-w-0 flex-1">
                                        <div className="text-sm font-semibold text-slate-800 dark:text-neutral-200 truncate">{name}</div>
                                        <div className="text-xs text-slate-500 dark:text-neutral-400">{formatDate(item.createdAt)}</div>
                                    </div>
                                    <div className="text-xs font-semibold text-slate-700 dark:text-neutral-300 tabular-nums">
                                        {formatMillis(item.responseTimeMs)}
                                    </div>
                                </div>
                            );
                        })}
                        {!items.length && (
                            <div className="px-3 py-10 text-sm text-slate-500 dark:text-neutral-400 text-center">No events yet</div>
                        )}
                        <div />
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
