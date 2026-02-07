export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export type ISODateString = string;

export type Endpoint = {
  id: string;
  name: string;
  url: string;
  method: HttpMethod | string;
  headers: Record<string, string>;
  payload: unknown;
  timeoutMs: number;
  intervalSeconds: number;
  alertOnFailure: boolean;
  alertThresholdMs: number | null;
  active: boolean;
  createdAt: ISODateString;
  updatedAt: ISODateString;
};

export type Check = {
  id: string;
  endpointId: string;
  statusCode: number | null;
  success: boolean;
  responseTimeMs: number;
  responseBody: unknown;
  error: string | null;
  createdAt: ISODateString;
};

export type Alert = {
  id: string;
  endpointId: string;
  message: string;
  sent: boolean;
  createdAt: ISODateString;
};

export type Metrics = {
  uptimePercent: number;
  latencyP50: number | null;
  latencyP95: number | null;
  latencyP99: number | null;
  totalChecks: number;
};

export type EndpointCreateInput = {
  name: string;
  url: string;
  method?: HttpMethod | string;
  headers?: Record<string, string>;
  payload?: unknown;
  timeoutMs?: number;
  intervalSeconds?: number;
  alertOnFailure?: boolean;
  alertThresholdMs?: number | null;
  active?: boolean;
};

export type EndpointUpdateInput = Partial<EndpointCreateInput>;

export type SSEEventName = 'check' | 'alert';
export type SSECheckPayload = Check;
export type SSEAlertPayload = Alert;
