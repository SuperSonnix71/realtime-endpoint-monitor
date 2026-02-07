import { cn } from '@/lib/utils';

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        'w-full rounded-md border border-slate-200 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-slate-900 dark:text-neutral-100 shadow-sm placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-800',
        className
      )}
      {...props}
    />
  );
}
