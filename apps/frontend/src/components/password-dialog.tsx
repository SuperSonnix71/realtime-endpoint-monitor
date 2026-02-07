'use client';

import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { login, changePassword } from '@/lib/auth';

type PasswordDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    mode: 'login' | 'change-password';
    onSuccess: () => void;
};

export function PasswordDialog({ open, onOpenChange, mode, onSuccess }: PasswordDialogProps) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const reset = useCallback(() => {
        setUsername('');
        setPassword('');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setError('');
        setLoading(false);
    }, []);

    const handleLogin = async () => {
        setError('');
        setLoading(true);
        try {
            await login(username, password);
            reset();
            onSuccess();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async () => {
        setError('');
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        if (newPassword.length < 4) {
            setError('Password must be at least 4 characters');
            return;
        }
        setLoading(true);
        try {
            await changePassword(currentPassword, newPassword);
            reset();
            onSuccess();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to change password');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (mode === 'login') void handleLogin();
        else void handleChangePassword();
    };

    const handleOpenChange = (next: boolean) => {
        if (!next) reset();
        onOpenChange(next);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className={mode === 'login' ? 'max-w-sm' : undefined}>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500 dark:text-neutral-400">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                        {mode === 'login' ? 'Sign In' : 'Change Password'}
                    </DialogTitle>
                </DialogHeader>

                {mode === 'change-password' && (
                    <p className="text-sm text-slate-500 dark:text-neutral-400">
                        You must change your password before continuing.
                    </p>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
                    {mode === 'login' ? (
                        <>
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="login-username">Username</Label>
                                <Input
                                    id="login-username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    autoFocus
                                    autoComplete="username"
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="login-password">Password</Label>
                                <Input
                                    id="login-password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    autoComplete="current-password"
                                />
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="current-password">Current Password</Label>
                                <Input
                                    id="current-password"
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    autoFocus
                                    autoComplete="current-password"
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="new-password">New Password</Label>
                                <Input
                                    id="new-password"
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    autoComplete="new-password"
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="confirm-password">Confirm New Password</Label>
                                <Input
                                    id="confirm-password"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    autoComplete="new-password"
                                />
                            </div>
                        </>
                    )}

                    {error && (
                        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                    )}

                    <div className="flex justify-end gap-2 mt-1">
                        {mode === 'login' && (
                            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                                Cancel
                            </Button>
                        )}
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Update Password'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
