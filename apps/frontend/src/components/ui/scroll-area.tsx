import { forwardRef } from 'react';
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';
import { cn } from '@/lib/utils';

export const ScrollArea = forwardRef<HTMLDivElement, { className?: string; children: React.ReactNode }>(
  function ScrollArea({ className, children }, ref) {
    return (
      <ScrollAreaPrimitive.Root ref={ref} className={cn('overflow-hidden', className)}>
        <ScrollAreaPrimitive.Viewport className="h-full w-full rounded">
          {children}
        </ScrollAreaPrimitive.Viewport>
        <ScrollAreaPrimitive.Scrollbar
          className="flex select-none touch-none p-1 bg-slate-100 dark:bg-neutral-700"
          orientation="vertical"
        >
          <ScrollAreaPrimitive.Thumb className="flex-1 rounded-full bg-slate-300 dark:bg-neutral-500" />
        </ScrollAreaPrimitive.Scrollbar>
      </ScrollAreaPrimitive.Root>
    );
  }
);
