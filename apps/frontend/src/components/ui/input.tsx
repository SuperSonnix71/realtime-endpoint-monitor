import { cn } from '@/lib/utils';

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, type = 'text', ...props }: InputProps) {
  return (
    <input
      type={type}
      className={cn(
        'h-10 w-full rounded-md border border-slate-200 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 text-sm text-slate-900 dark:text-neutral-100 shadow-sm placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-800',
        className
      )}
      {...props}
    />
  );
}
