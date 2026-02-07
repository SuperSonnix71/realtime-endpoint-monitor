'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckIcon, EyeIcon, EyeOffIcon } from '@/components/ui/icons';

export function AlertsTable() {
    const queryClient = useQueryClient();
    const [showAll, setShowAll] = useState(false);
    const [busy, setBusy] = useState(false);
    const { data } = useQuery({
        queryKey: ['alerts', showAll],
        queryFn: () => api.alerts.list(showAll),
        refetchInterval: 30000,
    });

    const invalidate = () => queryClient.invalidateQueries({ queryKey: ['alerts'] });

    const hasNew = data?.some((a) => !a.dismissed) ?? false;

    const dismissAll = async () => {
        setBusy(true);
        try {
            await api.alerts.dismiss();
            await invalidate();
        } finally {
            setBusy(false);
        }
    };

    const dismissOne = async (id: string) => {
        await api.alerts.dismissOne(id);
        await invalidate();
    };

    const toggleView = () => {
        setShowAll((v) => !v);
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>Alerts</CardTitle>
                    <div className="flex items-center gap-1">
                        {hasNew && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={dismissAll}
                                disabled={busy}
                                aria-label="Mark all as read"
                                title="Mark all as read"
                            >
                                <CheckIcon size={16} />
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={toggleView}
                            aria-label={showAll ? 'Show new only' : 'Show full log'}
                            title={showAll ? 'Show new only' : 'Show full log'}
                        >
                            {showAll ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableHeader className="w-8" />
                            <TableHeader>Message</TableHeader>
                            <TableHeader>Status</TableHeader>
                            <TableHeader>Time</TableHeader>
                        </TableRow>
                    </TableHead>
                    <tbody>
                        {data?.map((a) => (
                            <TableRow key={a.id} className={a.dismissed ? 'opacity-40' : ''}>
                                <TableCell className="w-8 p-0 text-center">
                                    {!a.dismissed && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6"
                                            onClick={() => dismissOne(a.id)}
                                            aria-label="Mark as read"
                                            title="Mark as read"
                                        >
                                            <CheckIcon size={14} />
                                        </Button>
                                    )}
                                </TableCell>
                                <TableCell>{a.message}</TableCell>
                                <TableCell><Badge tone={a.sent ? 'success' : 'danger'}>{a.sent ? 'Sent' : 'Pending'}</Badge></TableCell>
                                <TableCell>{formatDate(a.createdAt)}</TableCell>
                            </TableRow>
                        )) ?? null}
                    </tbody>
                </Table>
                {!data?.length && <div className="text-sm text-slate-500 dark:text-neutral-400 p-4">No alerts yet</div>}
            </CardContent>
        </Card>
    );
}
