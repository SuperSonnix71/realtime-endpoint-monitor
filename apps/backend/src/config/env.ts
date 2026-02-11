import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url(),
  DISPATCH_DELAY_MS: z.coerce.number().default(1500),
  ENDPOINT_REFRESH_MS: z.coerce.number().default(30000),
  MAX_CONCURRENCY: z.coerce.number().default(1),
  DEFAULT_TIMEOUT_MS: z.coerce.number().default(30000),
  TEAMS_WEBHOOK_URL: z.string().url().optional(),
  ALERT_RETRY_COUNT: z.coerce.number().default(3),
  ALERT_COOLDOWN_MS: z.coerce.number().default(300000),
  RETENTION_DAYS: z.coerce.number().default(30),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])
    .default('info'),
  ADMIN_USER: z.string().default('admin'),
  ADMIN_PASSWORD: z.string().min(4),
  JWT_SECRET: z.string().min(16),
});

export const env = envSchema.parse(process.env);
export type Env = z.infer<typeof envSchema>;
