import { cn } from '@/lib/utils';

type TableProps = React.HTMLAttributes<HTMLTableElement>;

type TableHeadProps = React.HTMLAttributes<HTMLTableSectionElement>;

type TableRowProps = React.HTMLAttributes<HTMLTableRowElement>;

type TableCellProps = React.TdHTMLAttributes<HTMLTableCellElement>;

type TableHeaderCellProps = React.ThHTMLAttributes<HTMLTableCellElement>;

export function Table({ className, ...props }: TableProps) {
  return (
    <div className="overflow-x-auto">
      <table
        className={cn('w-full border-collapse text-sm text-slate-700 dark:text-neutral-300', className)}
        {...props}
      />
    </div>
  );
}

export function TableHead({ className, ...props }: TableHeadProps) {
  return <thead className={cn('bg-slate-50 dark:bg-neutral-800/50 text-slate-500 dark:text-neutral-400 uppercase text-xs', className)} {...props} />;
}

export function TableRow({ className, ...props }: TableRowProps) {
  return <tr className={cn('border-b border-slate-100 dark:border-neutral-700 last:border-0', className)} {...props} />;
}

export function TableHeader({ className, ...props }: TableHeaderCellProps) {
  return <th className={cn('px-3 py-2 font-semibold text-left', className)} {...props} />;
}

export function TableCell({ className, ...props }: TableCellProps) {
  return <td className={cn('px-3 py-2 align-middle', className)} {...props} />;
}
