const NIRBAS_BASE_URL = import.meta.env.VITE_NIRBAS_BASE_URL || 'https://sc4v.app.n8n.cloud/webhook';

type NirbasEnvelope = {
  ok?: boolean;
  status?: string;
  message?: string;
  error?: { message?: string } | string;
};

export async function callNirbas<T>(endpoint: string, payload: Record<string, unknown>): Promise<T> {
  const response = await fetch(`${NIRBAS_BASE_URL}/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new Error(`استجابة غير صالحة من خدمة نبراس (${response.status})`);
  }

  const envelope = (data ?? {}) as NirbasEnvelope;
  const errorMessage = typeof envelope.error === 'string' ? envelope.error : envelope.error?.message;

  if (!response.ok) throw new Error(errorMessage || envelope.message || `NIRBAS backend error: ${response.status}`);
  if (envelope.ok === false) throw new Error(errorMessage || envelope.message || 'فشلت العملية في Backend');
  if (['not_implemented', 'queued', 'mock', 'disabled'].includes(String(envelope.status || ''))) {
    throw new Error(envelope.message || 'هذه الميزة غير متصلة بخدمة حقيقية بعد');
  }

  return data as T;
}
