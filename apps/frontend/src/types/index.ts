export type Endpoint = {
  id: string;
  name: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  payload: unknown;
  timeoutMs: number;
  intervalSeconds: number;
  alertOnFailure: boolean;
  alertThresholdMs: number | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Check = {
  id: string;
  endpointId: string;
  statusCode: number | null;
  success: boolean;
  responseTimeMs: number;
  responseBody: unknown;
  error: string | null;
  createdAt: string;
};

export type Metrics = {
  uptimePercent: number;
  latencyP50: number | null;
  latencyP95: number | null;
  latencyP99: number | null;
  totalChecks: number;
};

export type Alert = {
  id: string;
  endpointId: string;
  message: string;
  sent: boolean;
  dismissed: boolean;
  createdAt: string;
};

export type WebhookUrl = {
  id: string;
  url: string;
  label: string | null;
  active: boolean;
  createdAt: string;
};
