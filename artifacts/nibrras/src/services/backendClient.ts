const NIRBAS_GATEWAY_URL = 'https://sc4v.app.n8n.cloud/webhook/nirbas-api';

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

export type NirbasService = 'chat' | 'deepSearch' | 'learning' | 'questionBank' | 'workflowRunner' | 'control' | 'audit';

function errorMessage(payload: { error?: { message?: string } | string | null }, fallback: string): string {
  if (typeof payload.error === 'string') return payload.error;
  if (payload.error?.message) return payload.error.message;
  return fallback;
}

function validateServiceResponse<T>(service: NirbasService, data: NirbasResponse<T>): NirbasResponse<T> {
  if (data.ok !== true) throw new Error(errorMessage(data, `فشل تنفيذ ${service}`));
  if (['not_implemented', 'queued', 'mock', 'disabled'].includes(String(data.status))) {
    throw new Error(errorMessage(data, `الخدمة ${service} غير جاهزة`));
  }
  if (!data.executionId) throw new Error(`لم يرجع ${service} معرّف تنفيذ حقيقي`);
  return data;
}

export async function callNirbas<T = unknown>(
  service: NirbasService,
  payload: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<NirbasResponse<T>> {
  const response = await fetch(NIRBAS_GATEWAY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ service, payload }),
    signal,
  });

  let gateway: GatewayResponse<T>;
  try {
    gateway = await response.json();
  } catch {
    throw new Error('استجابة غير صالحة من بوابة نبراس');
  }

  if (!response.ok) throw new Error(errorMessage(gateway, `فشل الاتصال: HTTP ${response.status}`));
  if (gateway.ok !== true) throw new Error(errorMessage(gateway, 'فشلت بوابة نبراس في توجيه الطلب'));
  if (!gateway.executionId || !gateway.subExecutionId) throw new Error('لم ترجع بوابة نبراس معرفات التنفيذ');
  if (!gateway.data) throw new Error('بوابة نبراس لم ترجع نتيجة الخدمة');

  return validateServiceResponse(service, gateway.data);
}

export async function reportClientError(service: string, error: unknown, details?: unknown): Promise<void> {
  try {
    await callNirbas('audit', {
      action: 'log',
      level: 'error',
      service,
      message: error instanceof Error ? error.message : String(error),
      details,
    });
  } catch {
    // لا نسمح لفشل السجل بإخفاء الخطأ الأصلي.
  }
}
