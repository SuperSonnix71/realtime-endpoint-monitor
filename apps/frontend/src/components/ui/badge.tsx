import { cn } from '@/lib/utils';

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  tone?: 'success' | 'danger' | 'warning' | 'info';
};

const toneClasses: Record<string, string> = {
  success: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-950 dark:text-emerald-400 dark:ring-emerald-800',
  danger: 'bg-red-50 text-red-700 ring-1 ring-red-100 dark:bg-red-950 dark:text-red-400 dark:ring-red-800',
  warning: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100 dark:bg-amber-950 dark:text-amber-400 dark:ring-amber-800',
  info: 'bg-sky-50 text-sky-700 ring-1 ring-sky-100 dark:bg-sky-950 dark:text-sky-400 dark:ring-sky-800',
};

export function Badge({ className, tone = 'info', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold',
        toneClasses[tone],
        className
      )}
      {...props}
    />
  );
}
