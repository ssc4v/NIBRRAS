import { runtimeConfig } from '../config/runtime';
import { AppError, toAppError } from '../lib/app-error';

const RETRYABLE_STATUS_CODES = new Set([408, 425, 429, 500, 502, 503, 504]);
const BLOCKED_SERVICE_STATUSES = new Set(['not_implemented', 'queued', 'mock', 'disabled']);

export type NibrrasStatus = 'success' | 'error' | 'not_implemented' | 'queued' | 'disabled';

export interface NibrrasResponse<T = unknown> {
  ok: boolean;
  status?: NibrrasStatus | string;
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
  data?: NibrrasResponse<T>;
  executionId?: string;
  subExecutionId?: string;
  error?: { code?: string; message?: string } | string | null;
}

export type NibrrasService =
  | 'chat'
  | 'deepSearch'
  | 'learning'
  | 'questionBank'
  | 'workflowRunner'
  | 'control'
  | 'audit';

export interface NibrrasRequestOptions {
  signal?: AbortSignal;
  retries?: number;
}

function extractErrorMessage(
  payload: { error?: { message?: string } | string | null },
  fallback: string,
): string {
  if (typeof payload.error === 'string' && payload.error.trim()) return payload.error.trim();
  if (payload.error && typeof payload.error === 'object' && payload.error.message?.trim()) {
    return payload.error.message.trim();
  }
  return fallback;
}

function assertObject(value: unknown, message: string): asserts value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new AppError('INVALID_RESPONSE', message);
  }
}

async function parseJsonResponse<T>(response: Response): Promise<GatewayResponse<T>> {
  const raw = await response.text();
  if (!raw.trim()) {
    throw new AppError('INVALID_RESPONSE', `استجابة فارغة من بوابة نبراس: HTTP ${response.status}`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (cause) {
    throw new AppError('INVALID_RESPONSE', `استجابة غير صالحة من بوابة نبراس: HTTP ${response.status}`, { cause });
  }

  assertObject(parsed, 'استجابة بوابة نبراس ليست كائنًا صالحًا');
  return parsed as unknown as GatewayResponse<T>;
}

function validateServiceResponse<T>(service: NibrrasService, data: NibrrasResponse<T>): NibrrasResponse<T> {
  if (data.ok !== true) {
    throw new AppError('BACKEND_UNAVAILABLE', extractErrorMessage(data, `فشل تنفيذ خدمة ${service}`));
  }

  if (BLOCKED_SERVICE_STATUSES.has(String(data.status))) {
    throw new AppError('BACKEND_UNAVAILABLE', extractErrorMessage(data, `الخدمة ${service} غير جاهزة`));
  }

  if (!data.executionId?.trim()) {
    throw new AppError('INVALID_RESPONSE', `خدمة ${service} لم ترجع معرّف تنفيذ حقيقي`);
  }

  return data;
}

function combineAbortSignals(externalSignal?: AbortSignal): {
  signal: AbortSignal;
  cleanup: () => void;
} {
  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(() => controller.abort(), runtimeConfig.requestTimeoutMs);
  const abortFromCaller = () => controller.abort();

  if (externalSignal?.aborted) controller.abort();
  else externalSignal?.addEventListener('abort', abortFromCaller, { once: true });

  return {
    signal: controller.signal,
    cleanup: () => {
      globalThis.clearTimeout(timeoutId);
      externalSignal?.removeEventListener('abort', abortFromCaller);
    },
  };
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const id = globalThis.setTimeout(resolve, ms);
    const onAbort = () => {
      globalThis.clearTimeout(id);
      reject(new DOMException('Aborted', 'AbortError'));
    };

    if (signal?.aborted) onAbort();
    else signal?.addEventListener('abort', onAbort, { once: true });
  });
}

async function requestGateway<T>(
  service: NibrrasService,
  payload: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<{ response: Response; gateway: GatewayResponse<T> }> {
  const combined = combineAbortSignals(signal);

  try {
    const response = await fetch(runtimeConfig.gatewayUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ service, payload }),
      signal: combined.signal,
      cache: 'no-store',
      credentials: 'omit',
    });

    return { response, gateway: await parseJsonResponse<T>(response) };
  } finally {
    combined.cleanup();
  }
}

export async function callNibrras<T = unknown>(
  service: NibrrasService,
  payload: Record<string, unknown>,
  options: NibrrasRequestOptions = {},
): Promise<NibrrasResponse<T>> {
  const retries = Math.max(0, Math.min(options.retries ?? 1, 3));
  let lastError: AppError | undefined;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const { response, gateway } = await requestGateway<T>(service, payload, options.signal);

      if (!response.ok) {
        const message = response.status === 404
          ? 'بوابة نبراس غير منشورة أو أن رابطها غير صحيح'
          : extractErrorMessage(gateway, `فشل الاتصال: HTTP ${response.status}`);

        const error = new AppError('BACKEND_UNAVAILABLE', message, {
          retryable: RETRYABLE_STATUS_CODES.has(response.status),
        });

        if (error.retryable && attempt < retries) {
          await delay(500 * 2 ** attempt, options.signal);
          continue;
        }
        throw error;
      }

      if (gateway.ok !== true) {
        throw new AppError(
          'BACKEND_UNAVAILABLE',
          extractErrorMessage(gateway, 'فشلت بوابة نبراس في توجيه الطلب'),
        );
      }

      if (!gateway.executionId?.trim() || !gateway.subExecutionId?.trim()) {
        throw new AppError('INVALID_RESPONSE', 'بوابة نبراس لم ترجع معرّفات التنفيذ المطلوبة');
      }

      if (!gateway.data) {
        throw new AppError('INVALID_RESPONSE', 'بوابة نبراس لم ترجع نتيجة الخدمة');
      }

      return validateServiceResponse(service, gateway.data);
    } catch (error) {
      const appError = toAppError(error);
      lastError = appError;

      if (options.signal?.aborted) throw appError;
      if (appError.retryable && attempt < retries) {
        await delay(500 * 2 ** attempt, options.signal);
        continue;
      }
      break;
    }
  }

  throw lastError ?? new AppError('UNKNOWN', 'تعذر الاتصال بخدمات نبراس');
}

export async function reportClientError(
  service: string,
  error: unknown,
  details?: unknown,
): Promise<void> {
  const appError = toAppError(error);
  try {
    await callNibrras('audit', {
      action: 'log',
      level: 'error',
      service,
      code: appError.code,
      message: appError.message,
      retryable: appError.retryable,
      details,
      appVersion: runtimeConfig.appVersion,
      environment: runtimeConfig.environment,
    }, { retries: 0 });
  } catch {
    // Audit failure must never replace the original application error.
  }
}
