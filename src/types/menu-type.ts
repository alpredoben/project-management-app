import type { ComponentType } from "react";

export type T_MenuIconKey =
  | 'overview'
  | 'auth'
  | 'users'
  | 'roles'
  | 'permissions'
  | 'workspaces'
  | 'workspace-members'
  | 'projects'
  | 'project-members'
  | 'project-statuses'
  | 'project-types'
  | 'milestones'
  | 'tasks'
  | 'task-types'
  | 'task-statuses'
  | 'task-attachments';

export interface In_PublicRouteMenuItem {
  id: string;
  label: string;
  path: string;
  title: string;
  description: string;
  apiEndpoint: string;
  showInAuthNav?: boolean;
}

export interface In_AdminMenuItem {
  id: string;
  label: string;
  path: string;
  title: string;
  description: string;
  icon: T_MenuIconKey;
  apiPrefix: string;
  requiredRoles?: readonly string[];
  hidden?: boolean;
}

export interface In_AdminMenuGroup {
  id: string;
  label: string;
  items: readonly In_AdminMenuItem[];
}

export interface In_AdminRouteNode {
  id: string;
  label: string;
  path: string | null;
  title?: string;
  description: string | null;
  icon: T_MenuIconKey | null;
  component: ComponentType | null;
  apiPrefix?: string;
  requiredRoles?: readonly string[];
  hidden?: boolean;
  items: readonly In_AdminRouteNode[];
}

export interface In_BreadcrumbItem {
  label: string;
  path?: string;
}

export interface In_RouteConfig {
  path: string;
  component: ComponentType;
  title?: string;
  allowWhenAuthenticated?: boolean;
}