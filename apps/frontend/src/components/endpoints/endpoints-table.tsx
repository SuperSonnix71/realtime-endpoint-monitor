'use client';

import { useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { authFetch } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EditIcon, TrashIcon } from '@/components/ui/icons';
import { EndpointDialog } from './endpoint-dialog';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export function EndpointsTable() {
    const queryClient = useQueryClient();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { data } = useQuery({ queryKey: ['endpoints'], queryFn: api.endpoints.list, refetchInterval: 30000 });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const response = await api.endpoints.delete(id);
            return response;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['endpoints'] });
        },
        onError: (error) => {
            console.error('Delete failed:', error);
        },
    });

    const handleExport = async () => {
        try {
            const response = await fetch(`${API_BASE}/endpoints/export`);
            const data = await response.json();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `endpoints-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Export failed:', error);
            alert('Failed to export endpoints');
        }
    };

    const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            const text = await file.text();
            const endpoints = JSON.parse(text);

            const response = await authFetch(`${API_BASE}/endpoints/import`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(endpoints),
            });

            if (!response.ok) {
                throw new Error('Import request failed');
            }

            const result = await response.json();
            alert(`Imported ${result.imported} endpoints. Failed: ${result.failed}`);
            queryClient.invalidateQueries({ queryKey: ['endpoints'] });
        } catch (error) {
            console.error('Import failed:', error);
            alert('Failed to import endpoints. Check file format.');
        }

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3">
                <CardTitle>Monitors</CardTitle>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleExport}>
                        Export
                    </Button>
                    <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                        Import
                    </Button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json"
                        onChange={handleImport}
                        className="hidden"
                    />
                    <EndpointDialog triggerLabel="Add monitor" />
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableHeader>Name</TableHeader>
                            <TableHeader>Method</TableHeader>
                            <TableHeader>URL</TableHeader>
                            <TableHeader>Interval</TableHeader>
                            <TableHeader>Status</TableHeader>
                            <TableHeader className="text-right">Actions</TableHeader>
                        </TableRow>
                    </TableHead>
                    <tbody>
                        {data?.map((e) => (
                            <TableRow key={e.id}>
                                <TableCell className="whitespace-nowrap">{e.name}</TableCell>
                                <TableCell className="whitespace-nowrap">{e.method}</TableCell>
                                <TableCell className="max-w-[200px] truncate">{e.url}</TableCell>
                                <TableCell className="whitespace-nowrap">{e.intervalSeconds}s</TableCell>
                                <TableCell>
                                    <Badge tone={e.active ? 'success' : 'danger'}>{e.active ? 'Active' : 'Inactive'}</Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                                        <EndpointDialog endpoint={e} triggerLabel="Edit" triggerIcon={<EditIcon size={16} />} triggerVariant="ghost" triggerSize="icon" />
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => deleteMutation.mutate(e.id)}
                                            disabled={deleteMutation.isPending}
                                            aria-label="Delete"
                                            title="Delete"
                                        >
                                            <TrashIcon size={16} />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )) ?? null}
                    </tbody>
                </Table>
            </CardContent>
        </Card>
    );
}
