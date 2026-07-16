import { api } from '../lib/apiClient';
import type { AiEmployee, CreateEmployeeInput } from '../types/employee';

export async function listEmployees(): Promise<AiEmployee[]> {
  return api.get<AiEmployee[]>('/employees');
}

export async function getEmployee(id: string): Promise<AiEmployee> {
  return api.get<AiEmployee>(`/employees/${id}`);
}

export async function createEmployee(input: CreateEmployeeInput): Promise<AiEmployee> {
  return api.post<AiEmployee>('/employees', input);
}

export async function updateEmployee(
  id: string,
  updates: Partial<CreateEmployeeInput & { status: string; currentTask: string | null }>
): Promise<AiEmployee> {
  return api.patch<AiEmployee>(`/employees/${id}`, updates);
}

export async function activateEmployee(id: string): Promise<AiEmployee> {
  return api.post<AiEmployee>(`/employees/${id}/activate`);
}

export async function pauseEmployee(id: string): Promise<AiEmployee> {
  return api.post<AiEmployee>(`/employees/${id}/pause`);
}

export async function archiveEmployee(id: string): Promise<AiEmployee> {
  return api.post<AiEmployee>(`/employees/${id}/archive`);
}

export async function testEmployee(id: string): Promise<AiEmployee> {
  return api.post<AiEmployee>(`/employees/${id}/test`);
}

export async function duplicateEmployee(id: string): Promise<AiEmployee> {
  return api.post<AiEmployee>(`/employees/${id}/duplicate`);
}

export async function deleteEmployee(id: string): Promise<void> {
  await api.delete(`/employees/${id}`);
}
