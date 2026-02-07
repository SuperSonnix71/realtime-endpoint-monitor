import { prisma } from '../db/client.js';

type Metrics = {
  uptimePercent: number;
  latencyP50: number | null;
  latencyP95: number | null;
  latencyP99: number | null;
  totalChecks: number;
};

function percentile(values: number[], p: number): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

export async function getMetrics(limit = 500): Promise<Metrics> {
  const checks = await prisma.check.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: { success: true, responseTimeMs: true },
  });

  if (checks.length === 0) {
    return {
      uptimePercent: 100,
      latencyP50: null,
      latencyP95: null,
      latencyP99: null,
      totalChecks: 0,
    };
  }

  const successes = checks.filter((c) => c.success).length;
  const responseTimes = checks.map((c) => c.responseTimeMs);

  return {
    uptimePercent: (successes / checks.length) * 100,
    latencyP50: percentile(responseTimes, 50),
    latencyP95: percentile(responseTimes, 95),
    latencyP99: percentile(responseTimes, 99),
    totalChecks: checks.length,
  };
}
