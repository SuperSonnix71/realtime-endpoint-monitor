import { cn } from '@/lib/utils';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'outline' | 'ghost' | 'danger';
  size?: 'default' | 'sm' | 'icon';
};

const base =
  'inline-flex items-center justify-center gap-2 rounded-md text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-800 disabled:opacity-60 disabled:pointer-events-none';

const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
  default: 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200',
  outline: 'border border-slate-200 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-slate-900 dark:text-neutral-100 hover:bg-slate-50 dark:hover:bg-neutral-700',
  ghost: 'bg-transparent text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-700',
  danger: 'bg-red-600 text-white hover:bg-red-500',
};

const sizes: Record<NonNullable<ButtonProps['size']>, string> = {
  default: 'h-10 px-4',
  sm: 'h-9 px-3',
  icon: 'h-8 w-8 p-0',
};

export function Button({ className, variant = 'default', size = 'default', ...props }: ButtonProps) {
  return <button className={cn(base, variants[variant], sizes[size], className)} {...props} />;
}
