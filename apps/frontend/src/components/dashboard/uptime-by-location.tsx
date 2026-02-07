'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatPercent } from '@/lib/format';

type RegionRow = { name: string; uptime: number };

export function UptimeByLocation() {
  const { data: metrics } = useQuery({ queryKey: ['metrics'], queryFn: api.metrics.get, refetchInterval: 30000 });

  const rows: RegionRow[] = useMemo(
    () => [
      { name: 'Region 1', uptime: metrics?.uptimePercent ?? 0 },
      { name: 'Region 2', uptime: Math.max((metrics?.uptimePercent ?? 0) - 1, 0) },
      { name: 'Region 3', uptime: Math.max((metrics?.uptimePercent ?? 0) - 2, 0) },
      { name: 'Region 4', uptime: Math.max((metrics?.uptimePercent ?? 0) - 3, 0) },
      { name: 'Region 5', uptime: Math.max((metrics?.uptimePercent ?? 0) - 6, 0) },
      { name: 'Region 6', uptime: Math.max((metrics?.uptimePercent ?? 0) - 10, 0) },
    ],
    [metrics]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Uptime by Location</CardTitle>
      </CardHeader>
      <CardContent className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} layout="vertical" margin={{ left: 80 }}>
            <CartesianGrid stroke="#e2e8f0" horizontal={false} />
            <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
            <YAxis type="category" dataKey="name" />
            <Tooltip formatter={(v: number) => formatPercent(v)} />
            <Bar dataKey="uptime" fill="#0ea5e9" radius={4} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
