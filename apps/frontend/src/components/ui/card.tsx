import { cn } from '@/lib/utils';

type CardProps = React.HTMLAttributes<HTMLDivElement>;

type CardHeaderProps = React.HTMLAttributes<HTMLDivElement>;

type CardTitleProps = React.HTMLAttributes<HTMLParagraphElement>;

type CardContentProps = React.HTMLAttributes<HTMLDivElement>;

type CardFooterProps = React.HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'bg-white dark:bg-neutral-800 rounded-2xl shadow-[0_12px_30px_rgba(15,23,42,0.08)] dark:shadow-[0_12px_30px_rgba(0,0,0,0.5)] border border-slate-100 dark:border-neutral-700',
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: CardHeaderProps) {
  return (
    <div className={cn('p-4 pb-2 flex flex-col gap-1', className)} {...props} />
  );
}

export function CardTitle({ className, ...props }: CardTitleProps) {
  return (
    <p className={cn('text-sm font-semibold text-slate-600 dark:text-neutral-400 tracking-wide', className)} {...props} />
  );
}

export function CardContent({ className, ...props }: CardContentProps) {
  return <div className={cn('px-4 pb-4', className)} {...props} />;
}

export function CardFooter({ className, ...props }: CardFooterProps) {
  return <div className={cn('px-4 pb-4', className)} {...props} />;
}
