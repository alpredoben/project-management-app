import { matchPath } from "react-router-dom";
import { lazyPage } from "@/shared/libs/helper";
import type {
  In_AdminRouteNode,
  In_BreadcrumbItem,
  In_RouteConfig,
} from "@/types/menu-type";

/**
 * SINGLE SOURCE OF TRUTH untuk menu sidebar, route, judul tab & breadcrumb admin.
 *
 * Menambah halaman baru:
 *  - Halaman menu   -> tambah node di `items` milik group.
 *  - Halaman detail -> tambah node di `items` milik halaman induknya.
 */
export const ADMIN_ROUTE_LIST: readonly In_AdminRouteNode[] = [
  {
    id: 'overview',
    label: 'Workspace Console',
    path: null,
    description: null,
    icon: null,
    component: null,
    items: [
      {
        id: 'dashboard-overview',
        label: 'Overview',
        path: '/admin',
        title: 'Executive Overview',
        description: 'Live portfolio metrics across workspaces, active projects, milestones, and tasks.',
        icon: 'overview',
        apiPrefix: '/api/v1',
        component: lazyPage(() => import("@/features/dashboard/pages/DashboardOverview"), "DashboardOverviewPage"),
        items: [],
      },
      {
        id: 'auth-session',
        label: 'Auth & Session',
        path: '/admin/auth',
        title: 'Authentication & Session',
        description: 'Inspect current user profile, rotate refresh tokens, or terminate session.',
        icon: 'auth',
        apiPrefix: '/api/v1/auth',
        component: lazyPage(() => import("@/features/auth/pages/AuthSessionPage"), "AuthSessionPage"),
        items: [],
      },
    ],
  },
  {
    id: 'workspace-group',
    label: 'Workspace',
    path: null,
    description: null,
    icon: null,
    component: null,
    items: [
      {
        id: 'workspace',
        label: 'Workspace',
        path: '/admin/workspace',
        title: 'Workspaces',
        description: 'Organize engineering workspaces, team collaborations, and brand logos.',
        icon: 'workspaces',
        apiPrefix: '/api/v1/workspace',
        component: lazyPage(() => import("@/features/workspace/pages/WorkspacePage"), "WorkspacePage"),
        items: [
          {
            id: 'workspace-detail',
            label: 'Workspace Detail',
            path: '/admin/workspace/:id',
            title: 'Workspace Detail',
            description: 'Detail of workspace.',
            icon: 'workspaces',
            apiPrefix: '/api/v1/workspace',
            component: lazyPage(() => import("@/features/workspace/pages/WorkspaceDetailPage"), "WorkspaceDetailPage"),
            items: [],
          },
        ],
      },
    ],
  },
  {
    id: 'access-control',
    label: 'Access Control',
    path: null,
    description: null,
    icon: null,
    component: null,
    items: [
      {
        id: 'users',
        label: 'Users',
        path: '/admin/users',
        title: 'User Directory',
        description: 'Manage engineering user accounts and assign RBAC roles.',
        icon: 'users',
        apiPrefix: '/api/v1/user',
        component: lazyPage(() => import("@/features/access-control/pages/UsersPage"), "UsersPage"),
        items: [],
      },
      {
        id: 'roles',
        label: 'Roles',
        path: '/admin/roles',
        title: 'Roles',
        description: 'Define organizational roles and attach granular permissions.',
        icon: 'roles',
        apiPrefix: '/api/v1/role',
        component: lazyPage(() => import("@/features/access-control/pages/RolesPage"), "RolesPage"),
        items: [
          {
            id: 'role-permissions',
            label: 'Role Permissions',
            path: '/admin/roles/:id/permissions',
            title: 'Role Permissions',
            description: 'Attach permissions to a role.',
            icon: 'roles',
            apiPrefix: '/api/v1/role',
            component: lazyPage(() => import("@/features/access-control/pages/RolePermissionsPage"), "RolePermissionsPage"),
            items: [],
          },
        ],
      },
      {
        id: 'permissions',
        label: 'Permissions',
        path: '/admin/permissions',
        title: 'Permissions',
        description: 'Configure capability keys and module-level access policies.',
        icon: 'permissions',
        apiPrefix: '/api/v1/permission',
        component: lazyPage(() => import("@/features/access-control/pages/PermissionsPage"), "PermissionsPage"),
        items: [],
      },
    ],
  },
  {
    id: 'master-data',
    label: 'Master Data',
    path: null,
    description: null,
    icon: null,
    component: null,
    items: [
      {
        id: 'project-type',
        label: 'Project Type',
        path: '/admin/project-type',
        title: 'Project Type',
        description: 'Manage master data project type.',
        icon: 'project-types',
        apiPrefix: '/api/v1/project-types',
        component: lazyPage(() => import("@/features/master-data/project-types/pages/ProjectTypePage"), "ProjectTypePage"),
        items: [
          {
            id: 'project-type-detail',
            label: 'Project Type Detail',
            path: '/admin/project-type/:id',
            title: 'Project Type Detail',
            description: 'Detail of project type.',
            icon: 'project-types',
            apiPrefix: '/api/v1/project-types',
            component: lazyPage(() => import("@/features/master-data/project-types/pages/ProjectTypeDetailPage"), "ProjectTypeDetailPage"),
            items: [],
          },
        ],
      },
      {
        id: 'project-status',
        label: 'Project Status',
        path: '/admin/project-status',
        title: 'Project Status',
        description: 'Manage master data project status lifecycle.',
        icon: 'project-statuses',
        apiPrefix: '/api/v1/project-status',
        component: lazyPage(() => import("@/features/master-data/project-status/pages/ProjectStatusPage"), "ProjectStatusPage"),
        items: [
          {
            id: 'project-status-detail',
            label: 'Project Status Detail',
            path: '/admin/project-status/:id',
            title: 'Project Status Detail',
            description: 'Detail of project status.',
            icon: 'project-statuses',
            apiPrefix: '/api/v1/project-status',
            component: lazyPage(() => import("@/features/master-data/project-status/pages/ProjectStatusDetailPage"), "ProjectStatusDetailPage"),
            items: [],
          },
        ],
      },
      {
        id: 'task-status',
        label: 'Task Status',
        path: '/admin/task-status',
        title: 'Task Status',
        description: 'Manage master data task status lifecycle.',
        icon: 'task-statuses',
        apiPrefix: '/api/v1/task-status',
        component: lazyPage(() => import("@/features/master-data/task-status/pages/TaskStatusPage"), "TaskStatusPage"),
        items: [
          {
            id: 'task-status-detail',
            label: 'Task Status Detail',
            path: '/admin/task-status/:id',
            title: 'Task Status Detail',
            description: 'Detail of task status.',
            icon: 'task-statuses',
            apiPrefix: '/api/v1/task-status',
            component: lazyPage(() => import("@/features/master-data/task-status/pages/TaskStatusDetailPage"), "TaskStatusDetailPage"),
            items: [],
          },
        ],
      },
    ],
  },
];

/* -------------------------------------------------------------------------- */
/*  Turunan: SATU kali proses rekursif → route datar + judul + breadcrumb     */
/* -------------------------------------------------------------------------- */

export interface In_AdminRoute extends In_RouteConfig {
  trail: In_BreadcrumbItem[];
}

const buildRoutes = (
  nodes: readonly In_AdminRouteNode[],
  parents: In_BreadcrumbItem[] = [],
): In_AdminRoute[] =>
  nodes.flatMap(({ path, component, title, label, items }) => {
    const trail = [...parents, { label, path: path?.includes(":") ? undefined : path ?? undefined }];
    const self = path && component ? [{ path, component, title: title ?? label, trail }] : [];
    return [...self, ...buildRoutes(items, trail)];
  });

/** Semua halaman admin (menu & detail) dalam satu daftar datar. */
export const ADMIN_ROUTES = buildRoutes(ADMIN_ROUTE_LIST);

/** Cari halaman admin untuk pathname aktif (mendukung path ":id"). */
export const findAdminRoute = (pathname: string) =>
  ADMIN_ROUTES.find((r) => matchPath(r.path, pathname));