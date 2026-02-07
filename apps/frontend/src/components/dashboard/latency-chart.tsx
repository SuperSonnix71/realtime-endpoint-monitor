'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { chartColor } from '@/lib/chart-colors';

type TooltipProps = {
    active?: boolean;
    payload?: { name: string; value: number; color: string }[];
    label?: string;
};

function CustomTooltip({ active, payload, label }: TooltipProps) {
    if (!active || !payload?.length) return null;
    const time = label ? new Date(label).toLocaleString() : '';
    return (
        <div className="bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg shadow-lg px-4 py-3 text-sm">
            <div className="font-semibold text-slate-700 dark:text-neutral-300 mb-2">{time}</div>
            {payload
                .filter((p) => p.value != null)
                .sort((a, b) => b.value - a.value)
                .map((p) => (
                    <div key={p.name} className="flex items-center gap-2 py-0.5">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
                        <span className="text-slate-600 dark:text-neutral-400 flex-1">{p.name}</span>
                        <span className="font-bold text-slate-900 dark:text-neutral-100 tabular-nums ml-4">
                            {p.value >= 1000 ? `${(p.value / 1000).toFixed(1)}s` : `${Math.round(p.value)}ms`}
                        </span>
                    </div>
                ))}
        </div>
    );
}

export function LatencyChart() {
    const { data: endpoints } = useQuery({
        queryKey: ['endpoints'],
        queryFn: api.endpoints.list,
        refetchInterval: 30000,
    });
    const { data: checks } = useQuery({
        queryKey: ['checks', 'latency'],
        queryFn: () => api.checks.list(undefined, 500),
        refetchInterval: 30000,
    });

    const { points, endpointNames } = useMemo(() => {
        if (!checks || !endpoints) return { points: [], endpointNames: [] };

        const nameMap = new Map(endpoints.map((e) => [e.id, e.name]));
        const names = endpoints.map((e) => e.name);

        const ordered = checks
            .slice()
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

        // Bucket by 5-minute intervals for a cleaner chart
        const buckets = new Map<string, Record<string, { sum: number; count: number }>>();

        ordered.forEach((c) => {
            const d = new Date(c.createdAt);
            const mins = Math.floor(d.getMinutes() / 5) * 5;
            d.setMinutes(mins, 0, 0);
            const key = d.toISOString();
            const name = nameMap.get(c.endpointId) ?? 'Unknown';

            if (!buckets.has(key)) {
                const row: Record<string, { sum: number; count: number }> = {};
                names.forEach((n) => (row[n] = { sum: 0, count: 0 }));
                buckets.set(key, row);
            }
            const row = buckets.get(key)!;
            if (!row[name]) row[name] = { sum: 0, count: 0 };
            row[name].sum += c.responseTimeMs;
            row[name].count += 1;
        });

        const data = Array.from(buckets.entries())
            .sort((a, b) => (a[0] < b[0] ? -1 : 1))
            .map(([time, aggs]) => {
                const point: Record<string, number | string | undefined> = { time };
                names.forEach((n) => {
                    point[n] = aggs[n]?.count > 0 ? Math.round(aggs[n].sum / aggs[n].count) : undefined;
                });
                return point;
            });

        return { points: data, endpointNames: names };
    }, [checks, endpoints]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Response Time</CardTitle>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
                    {endpointNames.map((name, i) => (
                        <div key={name} className="flex items-center gap-1.5">
                            <span
                                className="w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: chartColor(i) }}
                            />
                            <span className="text-[11px] text-slate-500 dark:text-neutral-500">{name}</span>
                        </div>
                    ))}
                </div>
            </CardHeader>
            <CardContent className="h-72">
                {!points.length ? (
                    <div className="h-full flex items-center justify-center text-sm text-slate-400 dark:text-neutral-600">
                        No check data
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={points}>
                            <defs>
                                {endpointNames.map((name, i) => (
                                    <linearGradient key={name} id={`lat-grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor={chartColor(i)} stopOpacity={0.4} />
                                        <stop offset="100%" stopColor={chartColor(i)} stopOpacity={0.08} />
                                    </linearGradient>
                                ))}
                            </defs>
                            <XAxis
                                dataKey="time"
                                tickFormatter={(d: string) => {
                                    const date = new Date(d);
                                    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
                                }}
                                tick={{ fontSize: 11, fill: '#94a3b8' }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis
                                tickFormatter={(v: number) =>
                                    v >= 1000 ? `${(v / 1000).toFixed(1)}s` : `${v}ms`
                                }
                                tick={{ fontSize: 11, fill: '#94a3b8' }}
                                axisLine={false}
                                tickLine={false}
                                width={50}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            {endpointNames.map((name, i) => (
                                <Area
                                    key={name}
                                    type="monotone"
                                    dataKey={name}
                                    stackId="1"
                                    stroke={chartColor(i)}
                                    strokeWidth={1.5}
                                    fill={`url(#lat-grad-${i})`}
                                    dot={false}
                                    activeDot={{ r: 3, strokeWidth: 0, fill: chartColor(i) }}
                                    connectNulls
                                />
                            ))}
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </CardContent>
        </Card>
    );
}
