import apiClient, { API_URL } from './client';

export type ProfileStatus = 'DRAFT' | 'PUBLISHED' | 'SUSPENDED';
export type ProfileTheme = 'DEFAULT' | 'DARK' | 'OCEAN' | 'SUNSET' | 'FOREST';
export type LinkType =
  | 'WEBSITE'
  | 'INSTAGRAM'
  | 'FACEBOOK'
  | 'LINKEDIN'
  | 'WHATSAPP'
  | 'YOUTUBE'
  | 'TIKTOK'
  | 'OTHER';
export type IdentifierKind = 'NFC' | 'QR';
export type IdentifierStatus = 'ACTIVE' | 'INACTIVE' | 'REVOKED';
export type LeadSource = 'PROFILE' | 'NFC' | 'QR';

export const THEMES: { value: ProfileTheme; label: string }[] = [
  { value: 'DEFAULT', label: 'Claro' },
  { value: 'DARK', label: 'Oscuro' },
  { value: 'OCEAN', label: 'Océano' },
  { value: 'SUNSET', label: 'Atardecer' },
  { value: 'FOREST', label: 'Bosque' },
];

export const LINK_TYPES: { value: LinkType; label: string }[] = [
  { value: 'WEBSITE', label: 'Sitio web' },
  { value: 'INSTAGRAM', label: 'Instagram' },
  { value: 'FACEBOOK', label: 'Facebook' },
  { value: 'LINKEDIN', label: 'LinkedIn' },
  { value: 'WHATSAPP', label: 'WhatsApp' },
  { value: 'YOUTUBE', label: 'YouTube' },
  { value: 'TIKTOK', label: 'TikTok' },
  { value: 'OTHER', label: 'Otro' },
];

export const STATUS_LABELS: Record<ProfileStatus, string> = {
  DRAFT: 'Borrador',
  PUBLISHED: 'Publicado',
  SUSPENDED: 'Suspendido',
};

export interface ProfileLink {
  id: string;
  label: string;
  url: string;
  type: LinkType;
  sortOrder: number;
  isActive: boolean;
}

export interface ProfileFields {
  slug: string;
  displayName: string;
  headline: string | null;
  bio: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  locationLabel: string | null;
  showEmail: boolean;
  showPhone: boolean;
  leadsEnabled: boolean;
  theme: ProfileTheme;
}

export interface OwnProfile extends ProfileFields {
  id: string;
  publicUrl: string;
  status: ProfileStatus;
  publishedAt: string | null;
  suspendedAt: string | null;
  createdAt: string;
  updatedAt: string;
  links: ProfileLink[];
}

/** Lo que devuelve GET /profiles/public/:slug (lista permitida por el backend). */
export interface PublicProfile {
  slug: string;
  displayName: string;
  headline: string | null;
  bio: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  website: string | null;
  locationLabel: string | null;
  email: string | null;
  phone: string | null;
  theme: ProfileTheme;
  leadsEnabled: boolean;
  links: { label: string; url: string; type: LinkType }[];
}

export interface Identifier {
  id: string;
  kind: IdentifierKind;
  label: string | null;
  code: string;
  url: string;
  status: IdentifierStatus;
  revokedAt: string | null;
  createdAt: string;
}

export interface Lead {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  message: string | null;
  source: LeadSource;
  createdAt: string;
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export type ProfileInput = Partial<Omit<ProfileFields, 'slug' | 'displayName'>> & {
  slug: string;
  displayName: string;
};

// --- Perfil propio ---

export const getMyProfile = async () => (await apiClient.get<OwnProfile>('/profiles/me')).data;

export const createProfile = async (data: ProfileInput) =>
  (await apiClient.post<OwnProfile>('/profiles', data)).data;

export const updateProfile = async (data: Partial<ProfileFields>) =>
  (await apiClient.patch<OwnProfile>('/profiles/me', data)).data;

export const checkSlug = async (slug: string) =>
  (
    await apiClient.get<{ slug: string; available: boolean; reason: string | null }>(
      '/profiles/slug-availability',
      { params: { slug } },
    )
  ).data;

export const publishProfile = async () => (await apiClient.post<OwnProfile>('/profiles/me/publish')).data;

export const unpublishProfile = async () =>
  (await apiClient.post<OwnProfile>('/profiles/me/unpublish')).data;

// --- Enlaces ---

export type LinkInput = { label: string; url: string; type: LinkType; isActive?: boolean };

export const createLink = async (data: LinkInput) =>
  (await apiClient.post<ProfileLink>('/profiles/me/links', data)).data;

export const updateLink = async (id: string, data: Partial<LinkInput>) =>
  (await apiClient.patch<ProfileLink>(`/profiles/me/links/${id}`, data)).data;

export const deleteLink = async (id: string) => {
  await apiClient.delete(`/profiles/me/links/${id}`);
};

export const reorderLinks = async (ids: string[]) =>
  (await apiClient.patch<ProfileLink[]>('/profiles/me/links/reorder', { ids })).data;

// --- NFC / QR ---

export const listIdentifiers = async () =>
  (await apiClient.get<Identifier[]>('/profiles/me/identifiers')).data;

export const createIdentifier = async (kind: IdentifierKind, label?: string) =>
  (await apiClient.post<Identifier>('/profiles/me/identifiers', { kind, label: label || undefined })).data;

export const setIdentifierStatus = async (id: string, status: IdentifierStatus) =>
  (await apiClient.patch<Identifier>(`/profiles/me/identifiers/${id}/status`, { status })).data;

// --- Leads ---

export const listMyLeads = async (page = 1, pageSize = 20) =>
  (await apiClient.get<Page<Lead>>('/profiles/me/leads', { params: { page, pageSize } })).data;

export const deleteMyLead = async (id: string) => {
  await apiClient.delete(`/profiles/me/leads/${id}`);
};

// --- Público (sin sesión) ---

export const getPublicProfile = async (slug: string) =>
  (await apiClient.get<PublicProfile>(`/profiles/public/${encodeURIComponent(slug)}`)).data;

export const resolveCode = async (code: string) =>
  (await apiClient.get<{ slug: string; kind: IdentifierKind }>(`/resolve/${encodeURIComponent(code)}`)).data;

export const getLeadConsentText = async () =>
  (await apiClient.get<{ purpose: string }>('/profiles/public/leads/consent')).data.purpose;

export type LeadInput = {
  name: string;
  email?: string;
  phone?: string;
  message?: string;
  consentAccepted: boolean;
  source?: LeadSource;
};

export const sendLead = async (slug: string, data: LeadInput) => {
  await apiClient.post(`/profiles/public/${encodeURIComponent(slug)}/leads`, data);
};

/** Enlace directo de descarga: el backend responde con Content-Disposition: attachment. */
export const vcardUrl = (slug: string) => `${API_URL}/profiles/public/${encodeURIComponent(slug)}/vcard`;

// --- Administración ---

export interface AdminProfile {
  id: string;
  slug: string;
  publicUrl: string;
  displayName: string;
  status: ProfileStatus;
  publishedAt: string | null;
  suspendedAt: string | null;
  createdAt: string;
  updatedAt: string;
  owner: {
    id: string;
    email: string;
    name: string;
    role: string;
    status: string;
    organizationId: string | null;
  };
}

export const listAdminProfiles = async (params: {
  page?: number;
  pageSize?: number;
  status?: ProfileStatus | '';
  search?: string;
}) =>
  (
    await apiClient.get<Page<AdminProfile>>('/admin/profiles', {
      params: {
        page: params.page ?? 1,
        pageSize: params.pageSize ?? 20,
        status: params.status || undefined,
        search: params.search || undefined,
      },
    })
  ).data;

export const suspendProfile = async (id: string) =>
  (await apiClient.post<AdminProfile>(`/admin/profiles/${id}/suspend`)).data;

export const reactivateProfile = async (id: string) =>
  (await apiClient.post<AdminProfile>(`/admin/profiles/${id}/reactivate`)).data;
