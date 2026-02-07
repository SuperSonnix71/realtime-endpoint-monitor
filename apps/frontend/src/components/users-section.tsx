'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { EditIcon, TrashIcon, CheckIcon, XIcon, KeyIcon } from '@/components/ui/icons';
import { authFetch, getUser, logout } from '@/lib/auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

type User = {
    id: string;
    username: string;
    mustChangePassword: boolean;
    createdAt: string;
};

export function UsersSection({ open, onClose }: { open?: boolean; onClose?: () => void }) {
    const [users, setUsers] = useState<User[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [newUsername, setNewUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [error, setError] = useState('');
    const [creating, setCreating] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState('');
    const [passwordId, setPasswordId] = useState<string | null>(null);
    const [newPw, setNewPw] = useState('');

    const currentUser = getUser();

    const fetchUsers = useCallback(async () => {
        const res = await authFetch(`${API_BASE}/users`);
        if (res.ok) {
            setUsers(await res.json());
        }
    }, []);

    useEffect(() => {
        if (open) void fetchUsers();
    }, [open, fetchUsers]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setCreating(true);
        try {
            const res = await authFetch(`${API_BASE}/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: newUsername, password: newPassword }),
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.error || 'Failed to create user');
            }
            setNewUsername('');
            setNewPassword('');
            setShowForm(false);
            await fetchUsers();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create user');
        } finally {
            setCreating(false);
        }
    };

    const handleRename = async (id: string) => {
        if (!editingName.trim()) return;
        setError('');
        try {
            const res = await authFetch(`${API_BASE}/users/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: editingName.trim() }),
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.error || 'Failed to rename user');
            }
            setEditingId(null);
            setEditingName('');
            await fetchUsers();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to rename user');
        }
    };

    const handleResetPassword = async (id: string) => {
        if (!newPw.trim() || newPw.length < 4) {
            setError('Password must be at least 4 characters');
            return;
        }
        setError('');
        try {
            const res = await authFetch(`${API_BASE}/users/${id}/password`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: newPw }),
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.error || 'Failed to reset password');
            }
            setPasswordId(null);
            setNewPw('');
            await fetchUsers();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to reset password');
        }
    };

    const handleDelete = async (id: string) => {
        setError('');
        try {
            const res = await authFetch(`${API_BASE}/users/${id}`, { method: 'DELETE' });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.error || 'Failed to remove user');
            }
            if (id === currentUser?.id) {
                logout();
                onClose?.();
                return;
            }
            await fetchUsers();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to remove user');
        }
    };

    const startEditing = (id: string, username: string) => {
        setPasswordId(null);
        setNewPw('');
        setEditingId(id);
        setEditingName(username);
    };

    const startPasswordReset = (id: string) => {
        setEditingId(null);
        setEditingName('');
        setPasswordId(id);
        setNewPw('');
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3">
                <CardTitle>Users</CardTitle>
                <Button variant="outline" size="sm" onClick={() => setShowForm(!showForm)}>
                    {showForm ? 'Cancel' : 'Add User'}
                </Button>
            </CardHeader>
            <CardContent>
                {showForm && (
                    <form onSubmit={handleCreate} autoComplete="off" className="flex items-end gap-3 mb-4 p-3 rounded-lg bg-slate-50 dark:bg-neutral-800/50 border border-slate-200 dark:border-neutral-700">
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="new-user-name">Username</Label>
                            <Input
                                id="new-user-name"
                                value={newUsername}
                                onChange={(e) => setNewUsername(e.target.value)}
                                autoFocus
                                autoComplete="off"
                                className="w-48"
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="new-user-pass">Temporary Password</Label>
                            <Input
                                id="new-user-pass"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                autoComplete="off"
                                className="w-48"
                            />
                        </div>
                        <Button type="submit" size="sm" disabled={creating || !newUsername || !newPassword}>
                            {creating ? 'Creating...' : 'Create'}
                        </Button>
                    </form>
                )}

                {error && (
                    <p className="text-sm text-red-600 dark:text-red-400 mb-3">{error}</p>
                )}

                <Table>
                    <TableHead>
                        <TableRow>
                            <TableHeader>Username</TableHeader>
                            <TableHeader>Status</TableHeader>
                            <TableHeader>Created</TableHeader>
                            <TableHeader className="text-right">Actions</TableHeader>
                        </TableRow>
                    </TableHead>
                    <tbody>
                        {users.map((u) => (
                            <TableRow key={u.id}>
                                <TableCell className="whitespace-nowrap">
                                    {editingId === u.id ? (
                                        <form
                                            className="flex items-center gap-2"
                                            onSubmit={(e) => { e.preventDefault(); void handleRename(u.id); }}
                                        >
                                            <Input
                                                value={editingName}
                                                onChange={(e) => setEditingName(e.target.value)}
                                                autoFocus
                                                className="h-8 w-36"
                                            />
                                            <Button type="submit" size="icon" variant="default" aria-label="Save" title="Save">
                                                <CheckIcon size={16} />
                                            </Button>
                                            <Button type="button" size="icon" variant="ghost" onClick={() => setEditingId(null)} aria-label="Cancel" title="Cancel">
                                                <XIcon size={16} />
                                            </Button>
                                        </form>
                                    ) : passwordId === u.id ? (
                                        <form
                                            className="flex items-center gap-2"
                                            autoComplete="off"
                                            onSubmit={(e) => { e.preventDefault(); void handleResetPassword(u.id); }}
                                        >
                                            <Input
                                                type="password"
                                                placeholder="New password"
                                                value={newPw}
                                                onChange={(e) => setNewPw(e.target.value)}
                                                autoFocus
                                                autoComplete="off"
                                                className="h-8 w-36"
                                            />
                                            <Button type="submit" size="icon" variant="default" aria-label="Save password" title="Save password">
                                                <CheckIcon size={16} />
                                            </Button>
                                            <Button type="button" size="icon" variant="ghost" onClick={() => { setPasswordId(null); setNewPw(''); }} aria-label="Cancel" title="Cancel">
                                                <XIcon size={16} />
                                            </Button>
                                        </form>
                                    ) : (
                                        u.username
                                    )}
                                </TableCell>
                                <TableCell>
                                    {u.mustChangePassword ? (
                                        <Badge tone="warning">Must change password</Badge>
                                    ) : (
                                        <Badge tone="success">Active</Badge>
                                    )}
                                </TableCell>
                                <TableCell className="whitespace-nowrap">
                                    {new Date(u.createdAt).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="text-right">
                                    {editingId !== u.id && passwordId !== u.id && (
                                        <div className="flex items-center justify-end gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => startEditing(u.id, u.username)}
                                                aria-label="Rename"
                                                title="Rename"
                                            >
                                                <EditIcon size={16} />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => startPasswordReset(u.id)}
                                                aria-label="Reset password"
                                                title="Reset password"
                                            >
                                                <KeyIcon size={16} />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => void handleDelete(u.id)}
                                                aria-label="Remove"
                                                title="Remove"
                                            >
                                                <TrashIcon size={16} />
                                            </Button>
                                        </div>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </tbody>
                </Table>
            </CardContent>
        </Card>
    );
}
