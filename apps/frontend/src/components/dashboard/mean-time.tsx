'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return '—';
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

export function MeanTime() {
  const { data: alerts, isLoading: isLoadingAlerts, error: alertsError } = useQuery({
    queryKey: ['alerts', 'mttr'],
    queryFn: () => api.alerts.list(),
    refetchInterval: 30000,
  });

  const { data: checks, isLoading: isLoadingChecks, error: checksError } = useQuery({
    queryKey: ['checks', 'mttr'],
    queryFn: () => api.checks.list(undefined, 1000),
    refetchInterval: 30000,
  });

  const { mttrMs, samples } = useMemo(() => {
    if (!alerts?.length || !checks?.length) return { mttrMs: null as number | null, samples: 0 };

    const checksByEndpoint = new Map<string, { createdAtMs: number; success: boolean }[]>();
    checks.forEach((c) => {
      const arr = checksByEndpoint.get(c.endpointId) ?? [];
      arr.push({ createdAtMs: new Date(c.createdAt).getTime(), success: c.success });
      checksByEndpoint.set(c.endpointId, arr);
    });
    checksByEndpoint.forEach((arr) => arr.sort((a, b) => a.createdAtMs - b.createdAtMs));

    const durations: number[] = [];
    const recentAlerts = alerts
      .slice()
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .slice(-50);

    for (const alert of recentAlerts) {
      const series = checksByEndpoint.get(alert.endpointId);
      if (!series?.length) continue;
      const start = new Date(alert.createdAt).getTime();
      for (const check of series) {
        if (check.createdAtMs <= start) continue;
        if (!check.success) continue;
        durations.push(check.createdAtMs - start);
        break;
      }
    }

    if (!durations.length) return { mttrMs: null as number | null, samples: 0 };
    const avg = durations.reduce((sum, v) => sum + v, 0) / durations.length;
    return { mttrMs: avg, samples: durations.length };
  }, [alerts, checks]);

  const errorMessage =
    alertsError instanceof Error
      ? alertsError.message
      : checksError instanceof Error
        ? checksError.message
        : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>MTTR</CardTitle>
      </CardHeader>
      <CardContent className="pt-2 pb-5">
        {errorMessage ? (
          <div className="text-sm text-red-600">Failed to load: {errorMessage}</div>
        ) : isLoadingAlerts || isLoadingChecks ? (
          <div className="text-sm text-slate-500">Loading…</div>
        ) : (
          <>
            <div className="text-3xl font-extrabold text-slate-900">{mttrMs == null ? '—' : formatDuration(mttrMs)}</div>
            <div className="text-xs text-slate-500 mt-2">Based on {samples} recoveries from recent alerts</div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

