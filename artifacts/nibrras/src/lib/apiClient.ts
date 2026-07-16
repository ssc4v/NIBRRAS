/**
 * Direct REST client for the Nirbas API server.
 * Used for internal entities (employees, tasks, approvals, n8n management).
 * NOT the same as backendClient.ts which routes through the n8n gateway.
 */

const BASE = '/api';

export class ApiError extends Error {
  public readonly code: string;
  public readonly status: number;
  constructor(message: string, code: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  try {
    const res = await fetch(`${BASE}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(options.headers ?? {}),
      },
      signal: controller.signal,
      cache: 'no-store',
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || data?.ok === false) {
      const message =
        data?.error?.message ??
        data?.message ??
        `خطأ في الطلب: HTTP ${res.status}`;
      const code = data?.error?.code ?? 'API_ERROR';
      throw new ApiError(message, code, res.status);
    }

    return (data?.data ?? data) as T;
  } finally {
    clearTimeout(timeout);
  }
}

export const api = {
  get: <T>(path: string) => apiFetch<T>(path, { method: 'GET' }),
  post: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  patch: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, {
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  delete: <T>(path: string) => apiFetch<T>(path, { method: 'DELETE' }),

  /** Raw fetch that returns the full response body including ok/data/error */
  raw: async (path: string, options: RequestInit = {}) => {
    const res = await fetch(`${BASE}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...(options.headers ?? {}) },
      cache: 'no-store',
    });
    return res.json();
  },
};
