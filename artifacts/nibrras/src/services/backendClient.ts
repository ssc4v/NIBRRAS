const NIRBAS_BASE_URL = 'https://sc4v.app.n8n.cloud/webhook';

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

const endpoints = {
  chat: 'nirbas-chat',
  deepSearch: 'nirbas-deep-search',
  learning: 'nirbas-learning',
  questionBank: 'nirbas-question-bank',
  workflowRunner: 'nirbas-workflow-runner',
  control: 'nirbas-control-center',
  audit: 'nirbas-error-audit',
} as const;

export type NirbasService = keyof typeof endpoints;

function errorMessage(payload: NirbasResponse, fallback: string): string {
  if (typeof payload.error === 'string') return payload.error;
  if (payload.error?.message) return payload.error.message;
  return fallback;
}

export async function callNirbas<T = unknown>(
  service: NirbasService,
  payload: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<NirbasResponse<T>> {
  const response = await fetch(`${NIRBAS_BASE_URL}/${endpoints[service]}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal,
  });

  let data: NirbasResponse<T>;
  try {
    data = await response.json();
  } catch {
    throw new Error(`استجابة غير صالحة من ${service}`);
  }

  if (!response.ok) throw new Error(errorMessage(data, `فشل الاتصال: HTTP ${response.status}`));
  if (data.ok !== true) throw new Error(errorMessage(data, `فشل تنفيذ ${service}`));
  if (['not_implemented', 'queued', 'mock', 'disabled'].includes(String(data.status))) {
    throw new Error(errorMessage(data, `الخدمة ${service} غير جاهزة`));
  }
  if (!data.executionId) throw new Error(`لم يرجع ${service} معرّف تنفيذ حقيقي`);

  return data;
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
