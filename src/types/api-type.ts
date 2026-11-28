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
}

export interface In_RoleDetail extends In_Role {
  created_at: string;
  updated_at: string;
  permissions: In_PermissionSummary[],
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

export interface  In_Workspace {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
};

export type WorkspaceVisibility = 'private' | 'internal' | 'public';

export interface In_ProjectType {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface In_ProjectStatus {
  id: string;
  name: string;
  color_code: string;
  description: string | null;
  sequence_order: number;
  created_at: string;
  updated_at: string;
}

export interface In_ProjectWorkspace {
  id: string;
  name: string;
  slug?: string | null;
  logo_url?: string | null;
}

export interface In_ProjectProjectType {
  id: string;
  name: string;
  description?: string | null;
}

export interface In_ProjectProjectStatus {
  id: string;
  name: string;
  color_code?: string | null;
  sequence_order?: number | null;
  description?: string | null;
}

export interface In_Project {
  id: string;
  workspace_id?: string | null;
  workspace?: In_ProjectWorkspace | null;
  project_type_id?: string | null;
  project_type?: In_ProjectProjectType | null;
  project_status_id?: string | null;
  project_status?: In_ProjectProjectStatus | null;
  name: string;
  key?: string | null;
  description?: string | null;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
}

export interface In_ProjectQueryParam extends In_QueryParam {
  workspace_id?: string;
  project_status_id?: string;
  project_type_id?: string;
}

export interface In_MilestoneProject {
  id: string;
  name: string;
  description?: string | null;
  start_date?: string | null;
  end_date?: string | null;
}

export type T_MilestoneStatus = 'open' | 'finish' | string;

export interface In_Milestone {
  id: string;
  project_id?: string | null;
  project?: In_MilestoneProject | null;
  title: string;
  description?: string | null;
  status?: T_MilestoneStatus | null;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  updated_by?: string | null;
  deleted_at?: string | null;
  deleted_by?: string | null;
}

export interface In_MilestoneQueryParam extends In_QueryParam {
  project_id?: string;
  status?: string;
}

export interface In_Workspace {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
}


export interface In_TaskStatus  {
  id: string;
  name: string;
  color_code: string;
  description: string | null;
  sequence_order: number;
  created_at: string;
  updated_at: string;
}

export interface In_TaskType {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface In_Position {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

export interface In_WorkspaceMemberWorkspace {
  id: string;
  name: string;
  slug: string;
  logo_url?: string | null;
}

export interface In_WorkspaceMemberUser {
  id: string;
  name: string;
  email?: string | null;
  nip?: string | null;
  avatar_url?: string | null;
}

export interface In_WorkspaceMemberPosition {
  id: string;
  name: string;
  slug: string;
}

export interface In_WorkspaceMember {
  id: string;
  workspace_id?: string;
  workspace: In_WorkspaceMemberWorkspace;
  user_id?: string;
  user: In_WorkspaceMemberUser;
  position_id?: string;
  position: In_WorkspaceMemberPosition;
  joined_at?: string;
  created_at: string;
  updated_at: string;
}

export type T_TaskPriority = 'low' | 'medium' | 'high' | 'urgent' | string;

export interface In_TaskProject {
  id: string;
  name: string;
  key?: string | null;
}

export interface In_TaskMilestone {
  id: string;
  title: string;
}

export interface In_TaskTypeRef {
  id: string;
  name: string;
  description?: string | null;
}

export interface In_TaskStatusRef {
  id: string;
  name: string;
  color_code?: string | null;
  sequence_order?: number | null;
}

export interface In_Task {
  id: string;
  project_id?: string | null;
  project?: In_TaskProject | null;
  milestone_id?: string | null;
  milestone?: In_TaskMilestone | null;
  task_type_id?: string | null;
  task_type?: In_TaskTypeRef | null;
  task_status_id?: string | null;
  task_status?: In_TaskStatusRef | null;
  user_requested_id?: string | null;
  task_key?: string | null;
  title: string;
  description?: string | null;
  priority: T_TaskPriority;
  estimated_hours?: string | number | null;
  start_date?: string | null;
  end_date?: string | null;
  mom_number?: string | null;
  mom_date?: string | null;
  created_at: string;
  updated_at: string;
}

export interface In_TaskQueryParam extends In_QueryParam {
  project_id?: string;
  milestone_id?: string;
  task_type_id?: string;
  task_status_id?: string;
  priority?: string;
}

export interface In_TaskStatusSummary {
  id: string;
  name: string;
  color_code?: string | null;
}

export interface In_TaskAssignerUser {
  id: string;
  name: string;
  avatar_url?: string | null;
}

export interface In_TaskAssigner {
  id: string;
  user?: In_TaskAssignerUser | null;
  name?: string;
  avatar_url?: string | null;
}

export interface In_TaskTrackingItem {
  id: string;
  created_at: string;
  updated_at: string;
  task_type?: In_TaskTypeRef | null;
  task_status?: In_TaskStatusRef | null;
  task_assigners?: In_TaskAssigner[];
  task_key?: string | null;
  title: string;
  description?: string | null;
  priority?: T_TaskPriority | null;
  estimated_hours?: string | number | null;
  start_date?: string | null;
  end_date?: string | null;
}


