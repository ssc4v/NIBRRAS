import { api } from '../lib/apiClient';

export type TaskStatus =
  | 'new'
  | 'planning'
  | 'waiting_approval'
  | 'running'
  | 'completed'
  | 'failed'
  | 'paused'
  | 'cancelled';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: string;
  title: string;
  instructions: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  deadline: string | null;
  assignedEmployeeId: string | null;
  supervisorId: string | null;
  requiresApproval: boolean;
  relatedWorkflowId: string | null;
  inputData: unknown;
  outputData: unknown;
  errorMessage: string | null;
  executionId: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function listTasks(): Promise<Task[]> {
  return api.get<Task[]>('/tasks');
}

export async function getTask(id: string): Promise<Task> {
  return api.get<Task>(`/tasks/${id}`);
}

export async function createTask(input: {
  title: string;
  instructions?: string;
  priority?: TaskPriority;
  deadline?: string;
  assignedEmployeeId?: string;
  requiresApproval?: boolean;
  relatedWorkflowId?: string;
  inputData?: unknown;
}): Promise<Task> {
  return api.post<Task>('/tasks', input);
}

export async function updateTask(id: string, updates: Partial<Task>): Promise<Task> {
  return api.patch<Task>(`/tasks/${id}`, updates);
}

export async function cancelTask(id: string): Promise<Task> {
  return api.post<Task>(`/tasks/${id}/cancel`);
}

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  new: 'جديد',
  planning: 'جاري التخطيط',
  waiting_approval: 'ينتظر موافقة',
  running: 'جاري التنفيذ',
  completed: 'مكتمل',
  failed: 'فشل',
  paused: 'متوقف',
  cancelled: 'ملغى',
};

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'منخفض',
  medium: 'متوسط',
  high: 'مرتفع',
  urgent: 'عاجل',
};
