import { mockWorkflows, mockAgents, mockLogs } from '../data/mockData';
import { Workflow, WorkflowAgent, LogEntry } from '../types';
import { callNirbas } from './backendClient';

export const listWorkflows = async (): Promise<Workflow[]> => [...mockWorkflows];

export const getWorkflowAgents = async (workflowId: string): Promise<WorkflowAgent[]> =>
  mockAgents.filter(a => a.workflowId === workflowId);

export const runWorkflowMock = async (workflowId: string): Promise<void> => {
  await callNirbas('nirbas-workflow-runner', { workflowId, input: {} });
};

export const installWorkflowMock = async (workflowId: string): Promise<void> => {
  await callNirbas('nirbas-control-center', { action: 'install-workflow', workflowId });
};

export const hideWorkflowMock = async (workflowId: string): Promise<void> => {
  await callNirbas('nirbas-control-center', { action: 'hide-workflow', workflowId });
};

export const getWorkflowLogsMock = async (workflowId: string): Promise<LogEntry[]> =>
  mockLogs.filter(l => l.source === workflowId);

export const getAgentDetails = async (agentId: string): Promise<WorkflowAgent | undefined> =>
  mockAgents.find(a => a.id === agentId);

export const updateAgentPromptMock = async (agentId: string, prompt: string): Promise<void> => {
  await callNirbas('nirbas-control-center', { action: 'update-agent-prompt', agentId, prompt });
};

export const updateAgentModelMock = async (agentId: string, model: string): Promise<void> => {
  await callNirbas('nirbas-control-center', { action: 'update-agent-model', agentId, model });
};

export const updateAgentToolsMock = async (agentId: string, tools: string[]): Promise<void> => {
  await callNirbas('nirbas-control-center', { action: 'update-agent-tools', agentId, tools });
};

export const getGlobalLogsMock = async (): Promise<LogEntry[]> => [...mockLogs];
