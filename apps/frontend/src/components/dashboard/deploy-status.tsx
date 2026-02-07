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
    return (
        <div className="bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg shadow-lg px-4 py-3 text-sm">
            <div className="font-semibold text-slate-700 dark:text-neutral-300 mb-2">{label}</div>
            {payload
                .filter((p) => p.value > 0)
                .sort((a, b) => b.value - a.value)
                .map((p) => (
                    <div key={p.name} className="flex items-center gap-2 py-0.5">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
                        <span className="text-slate-600 dark:text-neutral-400 flex-1">{p.name}</span>
                        <span className="font-bold text-slate-900 dark:text-neutral-100 tabular-nums ml-4">{p.value}</span>
                    </div>
                ))}
        </div>
    );
}

export function DeployStatus() {
    const { data: checks } = useQuery({
        queryKey: ['checks', 'deploy'],
        queryFn: () => api.checks.list(undefined, 500),
        refetchInterval: 30000,
    });
    const { data: endpoints } = useQuery({
        queryKey: ['endpoints'],
        queryFn: () => api.endpoints.list(),
        refetchInterval: 30000,
    });

    const { points, endpointNames } = useMemo(() => {
        if (!checks || !endpoints) return { points: [], endpointNames: [] };

        const nameMap = new Map(endpoints.map((e) => [e.id, e.name]));
        const names = endpoints.map((e) => e.name);

        const buckets = new Map<string, Record<string, number>>();

        checks.forEach((c) => {
            const day = new Date(c.createdAt).toISOString().slice(0, 10);
            const name = nameMap.get(c.endpointId) ?? 'Unknown';
            if (!buckets.has(day)) {
                const row: Record<string, number> = {};
                names.forEach((n) => (row[n] = 0));
                buckets.set(day, row);
            }
            const row = buckets.get(day)!;
            row[name] = (row[name] ?? 0) + 1;
        });

        const sorted = Array.from(buckets.entries())
            .sort((a, b) => (a[0] < b[0] ? -1 : 1))
            .slice(-14)
            .map(([day, counts]) => ({ day, ...counts }));

        return { points: sorted, endpointNames: names };
    }, [checks, endpoints]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Checks by Endpoint</CardTitle>
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
            <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={points}>
                        <defs>
                            {endpointNames.map((name, i) => (
                                <linearGradient key={name} id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={chartColor(i)} stopOpacity={0.4} />
                                    <stop offset="100%" stopColor={chartColor(i)} stopOpacity={0.08} />
                                </linearGradient>
                            ))}
                        </defs>
                        <XAxis
                            dataKey="day"
                            tickFormatter={(d: string) => d.slice(5)}
                            tick={{ fontSize: 11, fill: '#94a3b8' }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            tick={{ fontSize: 11, fill: '#94a3b8' }}
                            axisLine={false}
                            tickLine={false}
                            width={40}
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
                                fill={`url(#grad-${i})`}
                                dot={false}
                                activeDot={{ r: 3, strokeWidth: 0, fill: chartColor(i) }}
                            />
                        ))}
                    </AreaChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
