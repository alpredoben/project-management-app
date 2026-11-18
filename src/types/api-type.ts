export interface In_PaginationMeta {
  current_page: number;
  per_page: number;
  total_items: number;
  total_pages: number;
  has_next_page: boolean;
  has_previous_page: boolean;
}

export type T_SortOrder = 'ASC' | 'DESC' | 'asc' | 'desc';

export interface In_QueryParam {
  page?: number;
  limit?: number;
  search?: string;
  sort_by?: string;
  order_by?: T_SortOrder;
}

export interface In_ApiMeta {
  pagination?: In_PaginationMeta;
  total_rows?: number;
}

export interface In_PaginatedResult<T> {
  items: T[];
  pagination: In_PaginationMeta | null;
  totalRows: number;
}

export interface In_ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
  meta?: In_ApiMeta;
  code?: string;
  timestamp?: string;
}

export interface In_TokenStorageAdapter {
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
  getTokenType?: () => string | null;
  onTokensRefreshed: (payload: In_AuthTokenPayload) => void;
  onAuthFailure: () => void;
}

export interface In_AuthTokenPayload {
  token_type: string;
  access_token: string;
  refresh_token: string;
}

export type In_AuthSessionPayload = In_AuthTokenPayload;

export interface In_AuthPermissionItem {
  id: string;
  name: string;
}

export interface In_AuthRoleItem {
  id: string;
  name: string;
  slug: string;
  permissions: In_AuthPermissionItem[];
}


export interface In_AuthProfile {
  id: string;
  name: string;
  nip: string | null;
  email: string;
  phone_number: string;
  avatar_url: string | null;
  is_active: boolean;
  is_email_verified: boolean;
  is_login: boolean;
  last_login_at: string | null;
  roles: In_AuthRoleItem[];
  permissions: In_AuthPermissionItem[];
}


export interface In_UserRegister {
  id: string;
  name: string;
  nip: string;
  email: string;
  phone_number?: string | null;
  created_at: string;
}

export interface In_RegisterPayload {
  user: In_UserRegister,
  verification_token: string;
  verification_path: string;
}

export interface In_ForgotPasswordPayload {
  reset_token: string | null;
  reset_path: string | null;
}

export interface In_ResetPasswordPayload { 
  token: string; 
  new_password: string 
}

export interface In_PermissionSummary {
  id: string;
  name: string;
  module: string;
  description: string | null;
}

export interface In_Permission extends In_PermissionSummary {
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  updated_by?: string | null;
}

export interface In_RoleSummary {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

export interface In_Role extends In_RoleSummary {
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  updated_by?: string | null;
}

export interface In_RoleDetail extends In_Role {
  permissions: In_Permission[],
}

export interface In_User {
  id: string;
  name: string;
  nip: string;
  email: string;
  phone_number: string;
  avatar_url: string;
  is_email_verified: boolean;
  is_active: boolean;
  last_login_at: string;
  role_ids?: string[],
  roles?: In_RoleSummary[];
  created_at: string;
  updated_at: string;
}

export type WorkspaceVisibility = 'private' | 'internal' | 'public';
