import { api } from '../lib/apiClient';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'expired';

export interface Approval {
  id: string;
  action: string;
  employeeId: string | null;
  workflowId: string | null;
  riskLevel: RiskLevel;
  reason: string | null;
  proposedInput: unknown;
  proposedOutput: unknown;
  estimatedCost: string | null;
  status: ApprovalStatus;
  comment: string | null;
  requestedAt: string;
  expiresAt: string | null;
  resolvedAt: string | null;
}

export async function listApprovals(status?: ApprovalStatus): Promise<Approval[]> {
  const path = status ? `/approvals?status=${status}` : '/approvals';
  return api.get<Approval[]>(path);
}

export async function getApproval(id: string): Promise<Approval> {
  return api.get<Approval>(`/approvals/${id}`);
}

export async function approveAction(id: string, comment?: string): Promise<Approval> {
  return api.post<Approval>(`/approvals/${id}/approve`, { comment });
}

export async function rejectAction(id: string, comment?: string): Promise<Approval> {
  return api.post<Approval>(`/approvals/${id}/reject`, { comment });
}

export async function createApproval(input: {
  action: string;
  employeeId?: string;
  workflowId?: string;
  riskLevel?: RiskLevel;
  reason?: string;
  proposedInput?: unknown;
  proposedOutput?: unknown;
  estimatedCost?: string;
}): Promise<Approval> {
  return api.post<Approval>('/approvals', input);
}

export const RISK_LABELS: Record<RiskLevel, string> = {
  low: 'منخفض',
  medium: 'متوسط',
  high: 'مرتفع',
  critical: 'حرج',
};

export const STATUS_LABELS: Record<ApprovalStatus, string> = {
  pending: 'معلق',
  approved: 'موافق عليه',
  rejected: 'مرفوض',
  expired: 'منتهي الصلاحية',
};
