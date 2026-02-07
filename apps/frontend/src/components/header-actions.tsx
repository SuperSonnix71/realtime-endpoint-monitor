'use client';

import { ThemeToggle } from './theme-toggle';
import { ConfigDrawer } from './config-drawer';

export function HeaderActions() {
    return (
        <div className="flex items-center gap-1">
            <ThemeToggle />
            <ConfigDrawer />
        </div>
    );
}
