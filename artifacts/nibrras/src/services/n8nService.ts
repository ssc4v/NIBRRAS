import { callNirbas, reportClientError } from './backendClient';

export interface SystemStatus {
  id: string;
  name: string;
  endpoint: string;
  enabled: boolean;
  status: string;
  healthChecked: boolean;
  models?: string[];
}

export interface ModelOption {
  id: 'openai' | 'gemini' | 'deepseek';
  label: string;
  connected: boolean;
}

export interface AuditEvent {
  id: string;
  level: string;
  service: string;
  message: string;
  createdAt: string;
  executionId?: string | null;
}

export async function getSystems(): Promise<{ systems: SystemStatus[]; checkedAt: string; note: string }> {
  const response = await callNirbas<{ systems: SystemStatus[]; checkedAt: string; note: string }>('control', { action: 'systems' });
  return response.data as { systems: SystemStatus[]; checkedAt: string; note: string };
}

export async function getModels(): Promise<{ available: ModelOption[]; defaultModel: string }> {
  const response = await callNirbas<{ available: ModelOption[]; defaultModel: string }>('control', { action: 'models' });
  return response.data as { available: ModelOption[]; defaultModel: string };
}

export async function updateSettings(updates: Record<string, unknown>): Promise<Record<string, unknown>> {
  const response = await callNirbas<Record<string, unknown>>('control', { action: 'updateSettings', updates });
  return response.data as Record<string, unknown>;
}

export async function getAuditEvents(limit = 30): Promise<AuditEvent[]> {
  const response = await callNirbas<AuditEvent[]>('audit', { action: 'list', limit });
  return response.data as AuditEvent[];
}

export async function runNirbasService(service: string, input: Record<string, unknown>): Promise<unknown> {
  try {
    const response = await callNirbas('workflowRunner', { service, input });
    return response.data;
  } catch (error) {
    void reportClientError('workflow-runner-ui', error, { service, input });
    throw error;
  }
}
