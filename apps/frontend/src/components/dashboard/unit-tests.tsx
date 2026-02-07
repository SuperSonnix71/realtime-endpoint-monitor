'use client';

import { useMemo } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function UnitTests() {
  const { data: checks } = useQuery({ queryKey: ['checks', 'unit'], queryFn: () => api.checks.list(undefined, 200), refetchInterval: 30000 });
  const summary = useMemo(() => {
    const success = checks?.filter((c) => c.success).length ?? 0;
    const fail = checks?.length ? checks.length - success : 0;
    return { success, fail };
  }, [checks]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Unit Tests</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-6">
        <div className="flex items-center gap-3">
          <CheckCircle className="text-emerald-500" />
          <div>
            <div className="text-xs font-semibold text-slate-500">Passing</div>
            <div className="text-3xl font-extrabold text-slate-900">{summary.success}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <XCircle className="text-red-500" />
          <div>
            <div className="text-xs font-semibold text-slate-500">Failing</div>
            <div className="text-3xl font-extrabold text-slate-900">{summary.fail}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
