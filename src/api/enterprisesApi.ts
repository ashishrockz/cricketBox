import apiClient from './apiClient';
import type { ApiResponse, Enterprise, EnterpriseType, EnterpriseRole } from '../types';

// ─── Request types ────────────────────────────────────────────────────────────

export interface CreateEnterprisePayload {
  name: string;
  description?: string;
  type?: EnterpriseType;
  contact?: { email?: string; phone?: string; website?: string };
  address?: { street?: string; city?: string; state?: string; country?: string; pincode?: string };
}

export interface UpdateEnterprisePayload extends Partial<CreateEnterprisePayload> {
  settings?: {
    isPublic?: boolean;
    allowMemberInvites?: boolean;
    joinRequiresApproval?: boolean;
  };
}

export interface AddMemberPayload {
  userId: string;
  role: Exclude<EnterpriseRole, 'owner'>;
}

export interface ListEnterprisesParams {
  page?: number;
  limit?: number;
  search?: string;
  type?: EnterpriseType;
}

// ─── API calls ────────────────────────────────────────────────────────────────

/** List public enterprises (no auth required) */
export const listEnterprises = (params?: ListEnterprisesParams) =>
  apiClient.get<ApiResponse<{ enterprises: Enterprise[] }>>('/enterprises', { params });

/** Get an enterprise by ID or slug */
export const getEnterprise = (idOrSlug: string) =>
  apiClient.get<ApiResponse<{ enterprise: Enterprise }>>(`/enterprises/${idOrSlug}`);

/** Get the current user's own enterprise */
export const getMyEnterprise = () =>
  apiClient.get<ApiResponse<{ enterprise: Enterprise }>>('/enterprises/my/details');

/**
 * Create an enterprise — requires enterprise subscription plan.
 * Each user can only own one enterprise.
 */
export const createEnterprise = (payload: CreateEnterprisePayload) =>
  apiClient.post<ApiResponse<{ enterprise: Enterprise }>>('/enterprises', payload);

/** Update enterprise details (owner only) */
export const updateEnterprise = (enterpriseId: string, payload: UpdateEnterprisePayload) =>
  apiClient.put<ApiResponse<{ enterprise: Enterprise }>>(`/enterprises/${enterpriseId}`, payload);

/** Add a member to the enterprise (owner / admin only) */
export const addMember = (enterpriseId: string, payload: AddMemberPayload) =>
  apiClient.post<ApiResponse<{ enterprise: Enterprise }>>(`/enterprises/${enterpriseId}/members`, payload);

/** Remove a member from the enterprise (owner / admin only) */
export const removeMember = (enterpriseId: string, userId: string) =>
  apiClient.delete<ApiResponse<{ enterprise: Enterprise }>>(`/enterprises/${enterpriseId}/members/${userId}`);

/** Update a member's role (owner / admin only) */
export const updateMemberRole = (
  enterpriseId: string,
  userId: string,
  role: Exclude<EnterpriseRole, 'owner'>,
) =>
  apiClient.put<ApiResponse<{ enterprise: Enterprise }>>(
    `/enterprises/${enterpriseId}/members/${userId}/role`,
    { role },
  );
