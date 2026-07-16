import { logger } from "./logger.js";

export class N8nConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "N8nConfigError";
  }
}

export class N8nApiError extends Error {
  public readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "N8nApiError";
    this.status = status;
  }
}

export function isN8nConfigured(): boolean {
  return Boolean(process.env.N8N_BASE_URL?.trim() && process.env.N8N_API_KEY?.trim());
}

function getConfig() {
  const baseUrl = process.env.N8N_BASE_URL?.trim().replace(/\/$/, "");
  const apiKey = process.env.N8N_API_KEY?.trim();
  if (!baseUrl || !apiKey) {
    throw new N8nConfigError(
      "N8N_BASE_URL و N8N_API_KEY غير مضبوطان — أضفهما في Replit Secrets"
    );
  }
  return { baseUrl, apiKey };
}

async function n8nFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const { baseUrl, apiKey } = getConfig();
  const url = `${baseUrl}/api/v1${path}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-N8N-API-KEY": apiKey,
        ...(options.headers ?? {}),
      },
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      logger.warn({ status: res.status, path, body: body.slice(0, 300) }, "n8n API error");
      throw new N8nApiError(
        `فشل الاتصال بـ n8n: HTTP ${res.status}`,
        res.status
      );
    }

    return res.json() as Promise<T>;
  } finally {
    clearTimeout(timeout);
  }
}

// ─── Workflows ───────────────────────────────────────────────────────────────

export async function listWorkflows(limit = 50) {
  return n8nFetch<{ data: unknown[]; nextCursor?: string }>(
    `/workflows?limit=${limit}`
  );
}

export async function getWorkflow(id: string) {
  return n8nFetch<Record<string, unknown>>(`/workflows/${id}`);
}

export async function createWorkflow(definition: Record<string, unknown>) {
  return n8nFetch<Record<string, unknown>>("/workflows", {
    method: "POST",
    body: JSON.stringify(definition),
  });
}

export async function updateWorkflow(
  id: string,
  definition: Record<string, unknown>
) {
  return n8nFetch<Record<string, unknown>>(`/workflows/${id}`, {
    method: "PUT",
    body: JSON.stringify(definition),
  });
}

export async function activateWorkflow(id: string) {
  return n8nFetch<Record<string, unknown>>(
    `/workflows/${id}/activate`,
    { method: "POST" }
  );
}

export async function deactivateWorkflow(id: string) {
  return n8nFetch<Record<string, unknown>>(
    `/workflows/${id}/deactivate`,
    { method: "POST" }
  );
}

export async function deleteN8nWorkflow(id: string) {
  return n8nFetch<Record<string, unknown>>(`/workflows/${id}`, {
    method: "DELETE",
  });
}

// ─── Executions ──────────────────────────────────────────────────────────────

export async function listExecutions(workflowId?: string, limit = 20) {
  const params = new URLSearchParams({ limit: String(limit) });
  if (workflowId) params.set("workflowId", workflowId);
  return n8nFetch<{ data: unknown[] }>(`/executions?${params}`);
}

export async function getExecution(id: string) {
  return n8nFetch<Record<string, unknown>>(`/executions/${id}`);
}

// ─── Connection test ─────────────────────────────────────────────────────────

export async function testN8nConnection(): Promise<{
  ok: boolean;
  message: string;
  baseUrl?: string;
}> {
  if (!isN8nConfigured()) {
    return {
      ok: false,
      message: "N8N_BASE_URL أو N8N_API_KEY غير مضبوطان",
    };
  }

  try {
    const { baseUrl } = getConfig();
    await n8nFetch("/workflows?limit=1");
    return {
      ok: true,
      message: "الاتصال بـ n8n يعمل بنجاح",
      baseUrl,
    };
  } catch (err) {
    const message =
      err instanceof N8nApiError
        ? err.message
        : err instanceof N8nConfigError
        ? err.message
        : "تعذر الاتصال بـ n8n";
    return { ok: false, message };
  }
}
