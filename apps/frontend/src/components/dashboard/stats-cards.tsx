'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

type EndpointStat = {
    label: string;
    uptime: number;
    downtime: number;
    spanMs: number;
};

function formatUptime(spanMs: number, uptimePercent: number): { short: string; mid: string; long: string } {
    const uptimeMs = spanMs * (uptimePercent / 100);
    const totalMinutes = Math.floor(uptimeMs / 60000);
    const totalHours = Math.floor(totalMinutes / 60);
    const totalDays = Math.floor(totalHours / 24);
    const totalMonths = Math.floor(totalDays / 30);

    const mins = totalMinutes % 60;
    const hrs = totalHours % 24;
    const days = totalDays % 30;

    const short = `${totalHours}h ${mins}m`;
    const mid = totalDays > 0 ? `${totalDays}d ${hrs}h` : short;
    const long = totalMonths > 0 ? `${totalMonths}mo ${days}d ${hrs}h` : mid;

    return { short, mid, long };
}

const RING_SIZE = 120;
const STROKE = 10;
const RADIUS = (RING_SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function DonutRing({ uptime }: { uptime: number }) {
    const uptimeDash = (uptime / 100) * CIRCUMFERENCE;
    const downtimeDash = CIRCUMFERENCE - uptimeDash;
    const gap = uptime > 0 && uptime < 100 ? 3 : 0;

    return (
        <svg width={RING_SIZE} height={RING_SIZE} className="drop-shadow-[0_0_8px_rgba(16,185,129,0.25)] dark:drop-shadow-[0_0_12px_rgba(16,185,129,0.4)]">
            <defs>
                <linearGradient id="uptimeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#059669" />
                    <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
                <linearGradient id="downtimeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#dc2626" />
                    <stop offset="100%" stopColor="#ef4444" />
                </linearGradient>
            </defs>
            {/* Track */}
            <circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RADIUS}
                fill="none"
                stroke="currentColor"
                className="text-slate-100 dark:text-neutral-800"
                strokeWidth={STROKE}
            />
            {/* Uptime arc */}
            {uptime > 0 && (
                <circle
                    cx={RING_SIZE / 2}
                    cy={RING_SIZE / 2}
                    r={RADIUS}
                    fill="none"
                    stroke="url(#uptimeGrad)"
                    strokeWidth={STROKE}
                    strokeLinecap="round"
                    strokeDasharray={`${uptimeDash - gap} ${CIRCUMFERENCE - uptimeDash + gap}`}
                    transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
                />
            )}
            {/* Downtime arc */}
            {uptime < 100 && (
                <circle
                    cx={RING_SIZE / 2}
                    cy={RING_SIZE / 2}
                    r={RADIUS}
                    fill="none"
                    stroke="url(#downtimeGrad)"
                    strokeWidth={STROKE}
                    strokeLinecap="round"
                    strokeDasharray={`${downtimeDash - gap} ${CIRCUMFERENCE - downtimeDash + gap}`}
                    strokeDashoffset={-uptimeDash - gap}
                    transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
                />
            )}
        </svg>
    );
}

function StatCard({ stat }: { stat: EndpointStat }) {
    const duration = formatUptime(stat.spanMs, stat.uptime);
    const uptimeStr = stat.uptime.toFixed(1);
    const downtimeStr = stat.downtime.toFixed(1);

    return (
        <div className="group relative bg-white dark:bg-neutral-900 rounded-2xl border border-slate-100 dark:border-neutral-800 shadow-[0_8px_30px_rgba(15,23,42,0.06)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] p-5 transition-all duration-300 hover:shadow-[0_12px_40px_rgba(15,23,42,0.12)] dark:hover:shadow-[0_12px_40px_rgba(0,0,0,0.6)] hover:-translate-y-0.5">
            {/* Donut + center text */}
            <div className="flex items-center gap-5">
                <div className="relative flex-shrink-0">
                    <DonutRing uptime={stat.uptime} />
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-[11px] font-bold text-slate-900 dark:text-neutral-100 truncate max-w-[80px] text-center leading-tight" title={stat.label}>
                            {stat.label}
                        </span>
                        <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 leading-none mt-0.5">
                            {uptimeStr}%
                        </span>
                    </div>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 space-y-2.5">
                    {/* Uptime / Downtime split */}
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-600 dark:bg-emerald-400 flex-shrink-0" />
                            <span className="text-xs text-slate-600 dark:text-neutral-400">Uptime</span>
                            <span className="text-xs font-bold text-slate-900 dark:text-neutral-100 ml-auto">{uptimeStr}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-600 dark:bg-red-400 flex-shrink-0" />
                            <span className="text-xs text-slate-600 dark:text-neutral-400">Downtime</span>
                            <span className="text-xs font-bold text-slate-900 dark:text-neutral-100 ml-auto">{downtimeStr}%</span>
                        </div>
                    </div>

                    {/* Duration */}
                    <div className="pt-1.5 border-t border-slate-100 dark:border-neutral-800">
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-slate-500 dark:text-neutral-500 tabular-nums">
                            <span>{duration.short}</span>
                            {duration.mid !== duration.short && <span>{duration.mid}</span>}
                            {duration.long !== duration.mid && <span>{duration.long}</span>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function StatsCards() {
    const { data: endpoints } = useQuery({ queryKey: ['endpoints'], queryFn: api.endpoints.list, refetchInterval: 30000 });
    const { data: checks } = useQuery({ queryKey: ['checks', 'uptime'], queryFn: () => api.checks.list(undefined, 500), refetchInterval: 30000 });

    const stats: EndpointStat[] = useMemo(() => {
        if (!endpoints || !checks) return [];

        return endpoints.map((endpoint) => {
            const endpointChecks = checks.filter((c) => c.endpointId === endpoint.id);
            const successCount = endpointChecks.filter((c) => c.success).length;
            const uptime = endpointChecks.length > 0 ? (successCount / endpointChecks.length) * 100 : 0;

            let spanMs = 0;
            if (endpointChecks.length >= 2) {
                const sorted = endpointChecks.map((c) => new Date(c.createdAt).getTime()).sort((a, b) => a - b);
                spanMs = sorted[sorted.length - 1] - sorted[0];
            } else if (endpointChecks.length === 1) {
                spanMs = Date.now() - new Date(endpointChecks[0].createdAt).getTime();
            }

            return {
                label: endpoint.name,
                uptime,
                downtime: 100 - uptime,
                spanMs,
            };
        });
    }, [endpoints, checks]);

    return (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {stats.map((stat) => (
                <StatCard key={stat.label} stat={stat} />
            ))}
        </div>
    );
}
