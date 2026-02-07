export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(value);
}

export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return `${formatNumber(value)}%`;
}

export function formatMillis(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return `${formatNumber(value)} ms`;
}

export function formatDate(value: string): string {
  return new Date(value).toLocaleString();
}
