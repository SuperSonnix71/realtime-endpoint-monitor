'use client';

import { Bug, Github } from 'lucide-react';
import { ThemeToggle } from './theme-toggle';
import { ConfigDrawer } from './config-drawer';

export function HeaderActions() {
    return (
        <div className="flex items-center gap-1">
            <a
                href="https://github.com/SuperSonnix71/realtime-endpoint-monitor"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 w-10"
                title="View on GitHub"
            >
                <Github className="h-[1.2rem] w-[1.2rem]" />
            </a>
            <a
                href="https://github.com/SuperSonnix71/realtime-endpoint-monitor/issues/new"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 w-10"
                title="Report an issue"
            >
                <Bug className="h-[1.2rem] w-[1.2rem]" />
            </a>
            <ThemeToggle />
            <ConfigDrawer />
        </div>
    );
}
