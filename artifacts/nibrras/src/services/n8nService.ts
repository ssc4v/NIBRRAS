import { mockWorkflows, mockAgents, mockLogs } from '../data/mockData';
import { Workflow, WorkflowAgent, LogEntry } from '../types';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const listWorkflows = async (): Promise<Workflow[]> => {
  await delay(400);
  return [...mockWorkflows];
};

export const getWorkflowAgents = async (workflowId: string): Promise<WorkflowAgent[]> => {
  await delay(300);
  return mockAgents.filter(a => a.workflowId === workflowId);
};

export const runWorkflowMock = async (workflowId: string): Promise<void> => {
  await delay(600);
  console.log(`Mock: Workflow ${workflowId} executed.`);
};

export const installWorkflowMock = async (workflowId: string): Promise<void> => {
  await delay(300);
  console.log(`Mock: Workflow ${workflowId} installed/pinned.`);
};

export const hideWorkflowMock = async (workflowId: string): Promise<void> => {
  await delay(300);
  console.log(`Mock: Workflow ${workflowId} hidden.`);
};

export const getWorkflowLogsMock = async (workflowId: string): Promise<LogEntry[]> => {
  await delay(400);
  return mockLogs.filter(l => l.source === workflowId);
};

export const getAgentDetails = async (agentId: string): Promise<WorkflowAgent | undefined> => {
  await delay(200);
  return mockAgents.find(a => a.id === agentId);
};

export const updateAgentPromptMock = async (agentId: string, prompt: string): Promise<void> => {
  await delay(500);
  console.log(`Mock: Agent ${agentId} prompt updated to: ${prompt}`);
};

export const updateAgentModelMock = async (agentId: string, model: string): Promise<void> => {
  await delay(400);
  console.log(`Mock: Agent ${agentId} model updated to: ${model}`);
};

export const updateAgentToolsMock = async (agentId: string, tools: string[]): Promise<void> => {
  await delay(400);
  console.log(`Mock: Agent ${agentId} tools updated to:`, tools);
};

export const getGlobalLogsMock = async (): Promise<LogEntry[]> => {
  await delay(500);
  return [...mockLogs];
};
