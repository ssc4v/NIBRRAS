import { api } from '../lib/apiClient';

export interface N8nWorkflow {
  id: string;
  name: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
  nodes?: unknown[];
  tags?: { id: string; name: string }[];
}

export interface N8nExecution {
  id: string;
  workflowId: string;
  status: 'success' | 'error' | 'waiting' | 'running' | 'unknown';
  startedAt?: string;
  stoppedAt?: string;
  mode?: string;
}

export interface N8nStatus {
  ok: boolean;
  configured: boolean;
  message: string;
  baseUrl?: string;
}

export async function getN8nStatus(): Promise<N8nStatus> {
  const raw = await api.raw('/n8n/status');
  return raw as N8nStatus;
}

export async function listN8nWorkflows(): Promise<N8nWorkflow[]> {
  return api.get<N8nWorkflow[]>('/n8n/workflows');
}

export async function getN8nWorkflow(id: string): Promise<N8nWorkflow> {
  return api.get<N8nWorkflow>(`/n8n/workflows/${id}`);
}

export async function activateN8nWorkflow(id: string): Promise<N8nWorkflow> {
  return api.post<N8nWorkflow>(`/n8n/workflows/${id}/activate`);
}

export async function deactivateN8nWorkflow(id: string): Promise<N8nWorkflow> {
  return api.post<N8nWorkflow>(`/n8n/workflows/${id}/deactivate`);
}

export async function listN8nExecutions(workflowId?: string, limit = 20): Promise<N8nExecution[]> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (workflowId) params.set('workflowId', workflowId);
  return api.get<N8nExecution[]>(`/n8n/executions?${params}`);
}
