import { cn } from '@/lib/utils';

type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement>;

export function Label({ className, ...props }: LabelProps) {
  return <label className={cn('text-sm font-semibold text-slate-700 dark:text-neutral-300', className)} {...props} />;
}
