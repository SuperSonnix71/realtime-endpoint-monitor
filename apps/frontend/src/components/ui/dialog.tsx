'use client';

import { cloneElement, createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

type DialogContextValue = {
    open: boolean;
    setOpen: (next: boolean) => void;
};

const DialogContext = createContext<DialogContextValue | null>(null);

function useDialogContext() {
    const ctx = useContext(DialogContext);
    if (!ctx) throw new Error('Dialog components must be used within <Dialog>');
    return ctx;
}

export function Dialog({
    open: controlledOpen,
    onOpenChange,
    children,
}: {
    open?: boolean;
    onOpenChange?: (next: boolean) => void;
    children: React.ReactNode;
}) {
    const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
    const open = controlledOpen ?? uncontrolledOpen;
    const setOpen = useCallback((next: boolean) => {
        onOpenChange?.(next);
        if (controlledOpen === undefined) setUncontrolledOpen(next);
    }, [controlledOpen, onOpenChange]);

    const value = useMemo(() => ({ open, setOpen }), [open, setOpen]);
    return <DialogContext.Provider value={value}>{children}</DialogContext.Provider>;
}

export function DialogTrigger({
    asChild,
    children,
}: {
    asChild?: boolean;
    children: React.ReactElement;
}) {
    const { setOpen } = useDialogContext();
    const childProps = {
        onClick: (e: React.MouseEvent) => {
            children.props.onClick?.(e);
            if (!e.defaultPrevented) setOpen(true);
        },
    };

    if (asChild) return <>{cloneElementSafe(children, childProps)}</>;
    return cloneElementSafe(children, childProps);
}

export function DialogContent({ className, children }: { className?: string; children: React.ReactNode }) {
    const { open, setOpen } = useDialogContext();
    useEffect(() => {
        if (!open) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setOpen(false);
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [open, setOpen]);
    if (!open) return null;

    return createPortal(
        <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-slate-950/40" onMouseDown={() => setOpen(false)} />
            <div className="absolute inset-0 flex items-center justify-center p-4">
                <div
                    role="dialog"
                    aria-modal="true"
                    className={cn(
                        'w-full max-w-2xl rounded-2xl bg-white dark:bg-neutral-800 shadow-[0_20px_60px_rgba(15,23,42,0.3)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.7)] border border-slate-100 dark:border-neutral-700 p-5',
                        className
                    )}
                    onMouseDown={(e) => e.stopPropagation()}
                >
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
}

export function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return <div className={cn('mb-4 flex items-start justify-between gap-4', className)} {...props} />;
}

export function DialogTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
    return <h2 className={cn('text-lg font-extrabold text-slate-900 dark:text-neutral-100', className)} {...props} />;
}

function cloneElementSafe<T extends React.ReactElement>(
    element: T,
    props: Partial<React.ComponentProps<any>>
): T {
    return cloneElement(element, props) as T;
}
