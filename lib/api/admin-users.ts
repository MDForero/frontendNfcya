import apiClient from './client';
import type { Page } from './profiles';
import type { Role } from '@/lib/utils/auth-helpers';

export type UserStatus = 'ACTIVA' | 'SUSPENDIDA';
/** Roles que un SUPER_ADMIN puede crear desde el panel (el resto se registra solo). */
export type CreatableAdminRole = 'SUPER_ADMIN' | 'SOPORTE';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
  role: Role;
  status: UserStatus;
  organization: { id: string; name: string } | null;
  providers: string[];
  createdAt: string;
}

export interface Organization {
  id: string;
  name: string;
}

export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  ACTIVA: 'Activa',
  SUSPENDIDA: 'Suspendida',
};

export const listAdminUsers = async (params: {
  page?: number;
  pageSize?: number;
  role?: Role | '';
  status?: UserStatus | '';
  search?: string;
}) =>
  (
    await apiClient.get<Page<AdminUser>>('/admin/users', {
      params: {
        page: params.page ?? 1,
        pageSize: params.pageSize ?? 20,
        role: params.role || undefined,
        status: params.status || undefined,
        search: params.search || undefined,
      },
    })
  ).data;

export const createAdminUser = async (data: { name: string; email: string; role: CreatableAdminRole }) =>
  (await apiClient.post<AdminUser>('/admin/users', data)).data;

export const deleteAdminUser = async (id: string) => {
  await apiClient.delete(`/admin/users/${id}`);
};

export const changeUserRole = async (id: string, role: Role) =>
  (await apiClient.patch<AdminUser>(`/admin/users/${id}/role`, { role })).data;

export const changeUserOrganization = async (id: string, organizationId: string | null) =>
  (await apiClient.patch<AdminUser>(`/admin/users/${id}/organization`, { organizationId })).data;

export const suspendUser = async (id: string) =>
  (await apiClient.post<AdminUser>(`/admin/users/${id}/suspend`)).data;

export const reactivateUser = async (id: string) =>
  (await apiClient.post<AdminUser>(`/admin/users/${id}/reactivate`)).data;

export const resendUserVerification = async (id: string) => {
  await apiClient.post(`/admin/users/${id}/resend-verification`);
};

export const sendUserPasswordReset = async (id: string) => {
  await apiClient.post(`/admin/users/${id}/send-password-reset`);
};

/** Para los selectores basta la primera página grande (el MVP maneja pocas organizaciones). */
export const listOrganizations = async () =>
  (await apiClient.get<Page<Organization>>('/admin/organizations', { params: { pageSize: 100 } })).data.items;
