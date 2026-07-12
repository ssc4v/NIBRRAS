const DEFAULT_NIRBAS_GATEWAY_URL = 'https://sc4v.app.n8n.cloud/webhook/nirbas-api';
const REQUEST_TIMEOUT_MS = 45_000;
const RETRYABLE_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);

export type NirbasStatus = 'success' | 'error' | 'not_implemented' | 'queued' | 'disabled';

export interface NirbasResponse<T = unknown> {
  ok: boolean;
  status?: NirbasStatus | string;
  service?: string;
  data?: T;
  result?: T;
  output?: string;
  reply?: string;
  executionId?: string;
  error?: { code?: string; message?: string } | string | null;
}

interface GatewayResponse<T = unknown> {
  ok: boolean;
  status?: string;
  targetService?: string;
  data?: NirbasResponse<T>;
  executionId?: string;
  subExecutionId?: string;
  error?: { message?: string } | string | null;
}

export type NirbasService =
  | 'chat'
  | 'deepSearch'
  | 'learning'
  | 'questionBank'
  | 'workflowRunner'
  | 'control'
  | 'audit';

function getGatewayUrl(): string {
  const configured = String(import.meta.env.VITE_NIRBAS_GATEWAY_URL ?? '').trim();
  return configured || DEFAULT_NIRBAS_GATEWAY_URL;
}

function errorMessage(
  payload: { error?: { message?: string } | string | null },
  fallback: string,
): string {
  if (typeof payload.error === 'string') return payload.error;
  if (payload.error?.message) return payload.error.message;
  return fallback;
}

function validateServiceResponse<T>(
  service: NirbasService,
  data: NirbasResponse<T>,
): NirbasResponse<T> {
  if (data.ok !== true) {
    throw new Error(errorMessage(data, `فشل تنفيذ ${service}`));
  }

  if (['not_implemented', 'queued', 'mock', 'disabled'].includes(String(data.status))) {
    throw new Error(errorMessage(data, `الخدمة ${service} غير جاهزة`));
  }

  if (!data.executionId) {
    throw new Error(`لم يرجع ${service} معرّف تنفيذ حقيقي`);
  }

  return data;
}

async function parseGatewayResponse<T>(response: Response): Promise<GatewayResponse<T>> {
  const raw = await response.text();
  if (!raw.trim()) {
    throw new Error(`استجابة فارغة من بوابة نبراس: HTTP ${response.status}`);
  }

  try {
    return JSON.parse(raw) as GatewayResponse<T>;
  } catch {
    throw new Error(`استجابة غير صالحة من بوابة نبراس: HTTP ${response.status}`);
  }
}

async function requestGateway<T>(
  service: NirbasService,
  payload: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<{ response: Response; gateway: GatewayResponse<T> }> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const abortFromCaller = () => controller.abort();
  signal?.addEventListener('abort', abortFromCaller, { once: true });

  try {
    const response = await fetch(getGatewayUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ service, payload }),
      signal: controller.signal,
      cache: 'no-store',
    });

    const gateway = await parseGatewayResponse<T>(response);
    return { response, gateway };
  } finally {
    window.clearTimeout(timeout);
    signal?.removeEventListener('abort', abortFromCaller);
  }
}

export async function callNirbas<T = unknown>(
  service: NirbasService,
  payload: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<NirbasResponse<T>> {
  let lastError: unknown;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const { response, gateway } = await requestGateway<T>(service, payload, signal);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('بوابة نبراس غير منشورة أو أن رابطها غير صحيح. تحقق من NIRBAS API Gateway في n8n.');
        }

        const message = errorMessage(gateway, `فشل الاتصال: HTTP ${response.status}`);
        const retryable = RETRYABLE_STATUS_CODES.has(response.status);
        if (retryable && attempt === 0) {
          await new Promise(resolve => window.setTimeout(resolve, 700));
          continue;
        }
        throw new Error(message);
      }

      if (gateway.ok !== true) {
        throw new Error(errorMessage(gateway, 'فشلت بوابة نبراس في توجيه الطلب'));
      }

      if (!gateway.executionId || !gateway.subExecutionId) {
        throw new Error('لم ترجع بوابة نبراس معرّفات التنفيذ المطلوبة');
      }

      if (!gateway.data) {
        throw new Error('بوابة نبراس لم ترجع نتيجة الخدمة');
      }

      return validateServiceResponse(service, gateway.data);
    } catch (error) {
      lastError = error;
      if (signal?.aborted) throw error;
      if (attempt === 0 && error instanceof TypeError) {
        await new Promise(resolve => window.setTimeout(resolve, 700));
        continue;
      }
      break;
    }
  }

  if (lastError instanceof DOMException && lastError.name === 'AbortError') {
    throw new Error('انتهت مهلة الاتصال بخدمات نبراس');
  }
  if (lastError instanceof Error) throw lastError;
  throw new Error('تعذر الاتصال بخدمات نبراس');
}

export async function reportClientError(
  service: string,
  error: unknown,
  details?: unknown,
): Promise<void> {
  try {
    await callNirbas('audit', {
      action: 'log',
      level: 'error',
      service,
      message: error instanceof Error ? error.message : String(error),
      details,
    });
  } catch {
    // Do not hide the original application error if audit logging is unavailable.
  }
}
