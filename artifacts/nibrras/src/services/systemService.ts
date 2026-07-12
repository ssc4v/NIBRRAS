const BASE = 'https://sc4v.app.n8n.cloud/webhook';

async function post<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${BASE}/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data?.ok === false) {
    throw new Error(data?.error?.message || `فشل الطلب (${response.status})`);
  }
  return data as T;
}

export const planAction = (request: Record<string, unknown>) => post<any>('nirbas-action-engine', { action: 'plan', intent: String(request.intent || 'update_system_test'), payload: request });
export const approveAction = (actionId: string) => post<any>('nirbas-action-engine', { action: 'approve', actionId });
export const rejectAction = (actionId: string) => post<any>('nirbas-action-engine', { action: 'reject', actionId });
export const rollbackAction = (actionId: string) => post<any>('nirbas-action-engine', { action: 'rollback', actionId });
export const runEvals = (tests: unknown[]) => post<any>('nirbas-evals', { suite: 'mobile-smoke', tests });
export const inspectHuggingFace = (modelId: string) => post<any>('nirbas-huggingface-importer', { modelId });
