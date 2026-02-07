'use client';

import { useState, useEffect, useCallback } from 'react';
import { EndpointsTable } from './endpoints/endpoints-table';
import { PasswordDialog } from './password-dialog';
import { UsersSection } from './users-section';
import { WebhookSection } from './webhook-section';
import { isAuthenticated, getUser, logout } from '@/lib/auth';

export function ConfigDrawer() {
    const [open, setOpen] = useState(false);
    const [authDialogMode, setAuthDialogMode] = useState<'login' | 'change-password' | null>(null);
    const [loggedIn, setLoggedIn] = useState(false);

    useEffect(() => {
        setLoggedIn(isAuthenticated());
    }, []);

    const handleGearClick = useCallback(() => {
        if (isAuthenticated()) {
            setOpen(true);
        } else {
            setAuthDialogMode('login');
        }
    }, []);

    const handleLoginSuccess = useCallback(() => {
        setLoggedIn(true);
        const user = getUser();
        if (user?.mustChangePassword) {
            setAuthDialogMode('change-password');
        } else {
            setAuthDialogMode(null);
            setOpen(true);
        }
    }, []);

    const handleChangePasswordSuccess = useCallback(() => {
        setAuthDialogMode(null);
        setOpen(true);
    }, []);

    const handleLogout = useCallback(() => {
        logout();
        setLoggedIn(false);
        setOpen(false);
    }, []);

    return (
        <>
            <button
                onClick={handleGearClick}
                className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Configuration"
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
            </button>

            {authDialogMode === 'login' && (
                <PasswordDialog
                    open
                    onOpenChange={(next) => { if (!next) setAuthDialogMode(null); }}
                    mode="login"
                    onSuccess={handleLoginSuccess}
                />
            )}
            {authDialogMode === 'change-password' && (
                <PasswordDialog
                    open
                    onOpenChange={() => {}}
                    mode="change-password"
                    onSuccess={handleChangePasswordSuccess}
                />
            )}

            {open && (
                <div className="fixed inset-0 z-40" onClick={() => setOpen(false)}>
                    <div className="absolute inset-0 bg-black/20 dark:bg-black/40" />
                </div>
            )}

            <div
                className={`fixed top-0 right-0 z-50 h-full w-full max-w-5xl bg-white dark:bg-neutral-900 shadow-[-8px_0_30px_rgba(0,0,0,0.12)] dark:shadow-[-8px_0_30px_rgba(0,0,0,0.7)] border-l border-slate-200 dark:border-neutral-700 transform transition-transform duration-300 ease-in-out ${open ? 'translate-x-0' : 'translate-x-full'}`}
            >
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-neutral-700">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-neutral-100">Configuration</h2>
                    <div className="flex items-center gap-2">
                        {loggedIn && (
                            <span className="text-xs text-slate-500 dark:text-neutral-400">
                                {getUser()?.username}
                            </span>
                        )}
                        {loggedIn && (
                            <button
                                onClick={handleLogout}
                                className="px-3 py-1.5 text-xs rounded-md border border-slate-200 dark:border-neutral-600 text-slate-600 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors"
                            >
                                Sign Out
                            </button>
                        )}
                        <button
                            onClick={() => setOpen(false)}
                            className="p-2 rounded-lg text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-100 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
                            aria-label="Close configuration"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>
                </div>
                <div className="overflow-y-auto h-[calc(100%-65px)] p-6 flex flex-col gap-6">
                    <EndpointsTable />
                    <WebhookSection open={open} />
                    <UsersSection open={open} onClose={handleLogout} />
                </div>
            </div>
        </>
    );
}
