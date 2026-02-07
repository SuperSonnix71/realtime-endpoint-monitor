'use client';

import dynamic from 'next/dynamic';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { DeployStatus } from '@/components/dashboard/deploy-status';
import { AlertsTable } from '@/components/alerts/alerts-table';
import { LiveFeed } from '@/components/dashboard/live-feed';
import { DowntimeByMonitor } from '@/components/dashboard/downtime-by-monitor';

const LatencyChart = dynamic(() => import('../components/dashboard/latency-chart.tsx').then(m => m.LatencyChart), { ssr: false });

export default function Page() {
    return (
        <div className="space-y-6 p-8">
            <StatsCards />

            <div className="grid gap-6 lg:grid-cols-2">
                <DeployStatus />
                <DowntimeByMonitor />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <LatencyChart />
                <LiveFeed />
            </div>

            <AlertsTable />
        </div>
    );
}
