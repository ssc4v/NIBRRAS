import type { Workflow, WorkflowAgent, LogEntry } from '../types';
import { callNirbas } from './backendClient';

type ActionResult = { ok?: boolean; status?: string; executionId?: string; message?: string };

const requireExecuted = (result: ActionResult, label: string): void => {
  if (result.ok !== true || !result.executionId) {
    throw new Error(result.message || `${label}: لم يتم إثبات تنفيذ العملية`);
  }
};

export const listWorkflows = async (): Promise<Workflow[]> => [];
export const getWorkflowAgents = async (_workflowId: string): Promise<WorkflowAgent[]> => [];
export const getWorkflowLogsMock = async (_workflowId: string): Promise<LogEntry[]> => [];
export const getAgentDetails = async (_agentId: string): Promise<WorkflowAgent | undefined> => undefined;
export const getGlobalLogsMock = async (): Promise<LogEntry[]> => [];

export const runWorkflowMock = async (workflowId: string): Promise<void> => {
  const result = await callNirbas<ActionResult>('nirbas-workflow-runner', { workflowId, input: {} });
  requireExecuted(result, 'تشغيل Workflow');
};

export const installWorkflowMock = async (workflowId: string): Promise<void> => {
  const result = await callNirbas<ActionResult>('nirbas-control-center', { action: 'install-workflow', workflowId });
  requireExecuted(result, 'تثبيت Workflow');
};

export const hideWorkflowMock = async (workflowId: string): Promise<void> => {
  const result = await callNirbas<ActionResult>('nirbas-control-center', { action: 'hide-workflow', workflowId });
  requireExecuted(result, 'إخفاء Workflow');
};

export const updateAgentPromptMock = async (agentId: string, prompt: string): Promise<void> => {
  const result = await callNirbas<ActionResult>('nirbas-control-center', { action: 'update-agent-prompt', agentId, prompt });
  requireExecuted(result, 'تحديث تعليمات الوكيل');
};

export const updateAgentModelMock = async (agentId: string, model: string): Promise<void> => {
  const result = await callNirbas<ActionResult>('nirbas-control-center', { action: 'update-agent-model', agentId, model });
  requireExecuted(result, 'تحديث نموذج الوكيل');
};

export const updateAgentToolsMock = async (agentId: string, tools: string[]): Promise<void> => {
  const result = await callNirbas<ActionResult>('nirbas-control-center', { action: 'update-agent-tools', agentId, tools });
  requireExecuted(result, 'تحديث أدوات الوكيل');
};
