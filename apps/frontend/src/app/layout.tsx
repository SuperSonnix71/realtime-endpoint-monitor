import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { Providers } from './providers';
import { HeaderActions } from '@/components/header-actions';
import './globals.css';

export const metadata: Metadata = {
    title: 'Realtime Endpoint Monitoring',
    description: 'Real-time monitoring of API endpoints with alerts and performance metrics',
    icons: {
        icon: '/favicon.svg',
    },
};

function CameraIcon() {
    return (
        <svg width="28" height="28" viewBox="0 0 64 64" fill="currentColor" className="text-slate-400 shrink-0">
            <rect x="10" y="16" width="6" height="5" />
            <path d="M16 12l30-6c3-.6 6 1.5 6 4.5v16c0 3-3 5.1-6 4.5L16 25c-2.5-.5-4-2.5-4-5v-3c0-2.5 1.5-4.5 4-5z" />
            <path d="M16 14l28-5.5c1.5-.3 3 .7 3 2.2v3.3L15 20v-2.5c0-1.5 0-3 1-3.5z" fill="#0f172a" />
            <rect x="42" y="32" width="10" height="20" />
            <path d="M37 52h20l-3 6H40z" />
            <rect x="35" y="58" width="24" height="4" />
        </svg>
    );
}

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body>
                <Providers>
                    <div className="page">
                        <header className="topbar">
                            <div className="flex items-center gap-3">
                                <CameraIcon />
                                <div>
                                    <div>Realtime Endpoint monitoring</div>
                                    <div className="text-xs font-normal text-slate-400 mt-0.5">API endpoints with alerts and performance metrics</div>
                                </div>
                            </div>
                            <HeaderActions />
                        </header>
                        <main className="main">{children}</main>
                    </div>
                </Providers>
            </body>
        </html>
    );
}
