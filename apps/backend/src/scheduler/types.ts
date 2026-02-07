import { Endpoint } from '@prisma/client';

export type CheckResult = {
  statusCode: number | null;
  success: boolean;
  responseTimeMs: number;
  responseBody: unknown;
  error: string | null;
};

export type ScheduledEndpoint = Endpoint & {
  lastRunAt?: number;
};
