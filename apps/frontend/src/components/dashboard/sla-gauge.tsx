import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatPercent } from '@/lib/format';

export function SLAGauge() {
  const { data } = useQuery({ queryKey: ['metrics'], queryFn: api.metrics.get, refetchInterval: 30000 });
  const value = Math.min(data?.uptimePercent ?? 0, 100);
  const angle = (value / 100) * 180;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>1 Month Service Level Agreement</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center gap-6">
        <div className="relative w-40 h-20 overflow-hidden">
          <div className="absolute inset-0 origin-bottom center w-full h-full rounded-b-full bg-slate-200" />
          <div
            className="absolute inset-0 origin-bottom center w-full h-full rounded-b-full"
            style={{
              background: `conic-gradient(#0ea5e9 ${angle}deg, #e2e8f0 ${angle}deg)`,
              transform: 'rotate(180deg)',
            }}
          />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-2 text-2xl font-extrabold text-slate-900">
            {formatPercent(value)}
          </div>
        </div>
        <div className="text-sm text-slate-600">Based on checks over the last month.</div>
      </CardContent>
    </Card>
  );
}
