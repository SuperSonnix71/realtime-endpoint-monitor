'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Row = {
    id: string;
    name: string;
    avg: number;
    fastest: number;
    slowest: number;
    total: number;
};

function formatMs(ms: number): string {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    const mins = Math.floor(ms / 60000);
    const secs = Math.round((ms % 60000) / 1000);
    return `${mins}m ${secs}s`;
}

function speedColor(ms: number): { bar: string; glow: string; label: string } {
    if (ms < 300) return { bar: 'from-emerald-400 to-emerald-500', glow: 'shadow-emerald-500/20', label: 'text-emerald-600 dark:text-emerald-400' };
    if (ms < 1000) return { bar: 'from-emerald-400 to-teal-500', glow: 'shadow-teal-500/20', label: 'text-teal-600 dark:text-teal-400' };
    if (ms < 3000) return { bar: 'from-amber-400 to-amber-500', glow: 'shadow-amber-500/20', label: 'text-amber-600 dark:text-amber-400' };
    if (ms < 8000) return { bar: 'from-orange-400 to-orange-500', glow: 'shadow-orange-500/20', label: 'text-orange-600 dark:text-orange-400' };
    return { bar: 'from-red-400 to-red-500', glow: 'shadow-red-500/20', label: 'text-red-600 dark:text-red-400' };
}

function SpeedBar({ row, maxMs }: { row: Row; maxMs: number }) {
    const widthPct = maxMs > 0 ? Math.max((row.avg / maxMs) * 100, 3) : 3;
    const colors = speedColor(row.avg);

    return (
        <div className="group py-1.5">
            <div className="flex items-baseline justify-between mb-1.5">
                <span className="text-xs font-semibold text-slate-700 dark:text-neutral-300 truncate max-w-[55%]">
                    {row.name}
                </span>
                <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold tabular-nums ${colors.label}`}>
                        {formatMs(row.avg)}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-neutral-600">avg</span>
                </div>
            </div>

            {/* Bar */}
            <div className="relative h-5 rounded-full bg-slate-100 dark:bg-neutral-800/80 overflow-hidden">
                <div
                    className={`h-full rounded-full bg-gradient-to-r ${colors.bar} shadow-md ${colors.glow} transition-all duration-700 ease-out`}
                    style={{ width: `${widthPct}%` }}
                />
            </div>

            {/* Range on hover */}
            <div className="flex justify-between mt-1 h-0 group-hover:h-4 overflow-hidden transition-all duration-300">
                <span className="text-[10px] text-slate-400 dark:text-neutral-600 tabular-nums">
                    Fastest: {formatMs(row.fastest)}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-neutral-600 tabular-nums">
                    Slowest: {formatMs(row.slowest)}
                </span>
            </div>
        </div>
    );
}

export function DowntimeByMonitor() {
    const { data: checks } = useQuery({
        queryKey: ['checks', 'response-times'],
        queryFn: () => api.checks.list(undefined, 500),
        refetchInterval: 30000,
    });
    const { data: endpoints } = useQuery({
        queryKey: ['endpoints'],
        queryFn: () => api.endpoints.list(),
        refetchInterval: 30000,
    });

    const rows: Row[] = useMemo(() => {
        if (!checks || !endpoints) return [];

        const endpointMap = new Map(endpoints.map((e) => [e.id, e.name]));
        const map = new Map<string, { name: string; times: number[] }>();

        checks.forEach((c) => {
            if (c.responseTimeMs == null) return;
            const endpointName = endpointMap.get(c.endpointId) ?? 'Unknown';
            if (!map.has(c.endpointId)) {
                map.set(c.endpointId, { name: endpointName, times: [] });
            }
            map.get(c.endpointId)!.times.push(c.responseTimeMs);
        });

        return Array.from(map.entries())
            .map(([id, v]) => {
                const sorted = v.times.slice().sort((a, b) => a - b);
                const sum = sorted.reduce((a, b) => a + b, 0);
                return {
                    id,
                    name: v.name,
                    avg: sum / sorted.length,
                    fastest: sorted[0],
                    slowest: sorted[sorted.length - 1],
                    total: sorted.length,
                };
            })
            .sort((a, b) => b.avg - a.avg);
    }, [checks, endpoints]);

    const maxMs = rows.length > 0 ? Math.max(...rows.map((r) => r.avg)) : 0;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Response Times</CardTitle>
                <p className="text-[11px] text-slate-400 dark:text-neutral-600 mt-0.5">
                    Slowest endpoints first · hover for range
                </p>
            </CardHeader>
            <CardContent>
                {rows.length === 0 ? (
                    <div className="flex items-center justify-center h-40 text-sm text-slate-400 dark:text-neutral-600">
                        No check data yet
                    </div>
                ) : (
                    <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                        {rows.map((row) => (
                            <SpeedBar key={row.id} row={row} maxMs={maxMs} />
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
