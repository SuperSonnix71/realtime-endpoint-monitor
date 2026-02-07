export const CHART_PALETTE = [
    '#6366f1', // indigo
    '#10b981', // emerald
    '#f59e0b', // amber
    '#ef4444', // red
    '#06b6d4', // cyan
    '#ec4899', // pink
    '#8b5cf6', // violet
    '#14b8a6', // teal
    '#f97316', // orange
    '#84cc16', // lime
];

export function chartColor(index: number): string {
    return CHART_PALETTE[index % CHART_PALETTE.length];
}
