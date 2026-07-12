const NIRBAS_BASE_URL = 'https://sc4v.app.n8n.cloud/webhook';

export async function callNirbas<T>(endpoint: string, payload: Record<string, unknown>): Promise<T> {
  const response = await fetch(`${NIRBAS_BASE_URL}/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`NIRBAS backend error: ${response.status}`);
  }

  return response.json() as Promise<T>;
}
