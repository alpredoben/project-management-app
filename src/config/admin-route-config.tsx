import { matchPath } from "react-router-dom";
import { lazyPage, slashed } from "@/shared/libs/helper";
import type {
  In_AdminRouteNode,
  In_BreadcrumbItem,
  In_RouteConfig,
} from "@/types/menu-type";
import { ROUTE_PATH_LIST } from "@/shared/constants";

/**
 * SINGLE SOURCE OF TRUTH untuk menu sidebar, route, judul tab & breadcrumb admin.
 *
 * Menambah halaman baru:
 *  - Halaman menu   -> tambah node di `items` milik group.
 *  - Halaman detail -> tambah node di `items` milik halaman induknya.
 */
export const ADMIN_ROUTE_LIST: readonly In_AdminRouteNode[] = [
  {
    id: "overview",
    label: "Workspace Console",
    path: null,
    description: null,
    icon: null,
    component: null,
    items: [
      {
        id: "dashboard-overview",
        label: "Overview",
        path: slashed(ROUTE_PATH_LIST.OVERVIEW.DASHBOARD),
        title: "Executive Overview",
        description:
          "Live portfolio metrics across workspaces, active projects, milestones, and tasks.",
        icon: "overview",
        apiPrefix: "/api/v1",
        component: lazyPage(
          () => import("@/features/dashboard/pages/DashboardOverview"),
          "DashboardOverviewPage",
        ),
        items: [],
      },
      {
        id: "auth-session",
        label: "Auth & Session",
        path: slashed(ROUTE_PATH_LIST.OVERVIEW.AUTH_SESSION),
        title: "Authentication & Session",
        description:
          "Inspect current user profile, rotate refresh tokens, or terminate session.",
        icon: "auth",
        apiPrefix: "/api/v1/auth",
        component: lazyPage(
          () => import("@/features/auth/pages/AuthSessionPage"),
          "AuthSessionPage",
        ),
        items: [],
      },
    ],
  },
  {
    id: "workspace-group",
    label: "Workspace",
    path: null,
    description: null,
    icon: null,
    component: null,
    items: [
      {
        id: "workspace",
        label: "Workspace",
        path: slashed(ROUTE_PATH_LIST.WORKSPACE.WORKSPACE),
        title: "Workspaces",
        description:
          "Organize engineering workspaces, team collaborations, and brand logos.",
        icon: "workspaces",
        apiPrefix: "/api/v1/workspace",
        component: lazyPage(
          () => import("@/features/workspace/pages/WorkspacePage"),
          "WorkspacePage",
        ),
        items: [
          {
            id: "workspace-detail",
            label: "Workspace Detail",
            path: slashed(ROUTE_PATH_LIST.WORKSPACE.WORKSPACE_DETAIL()),
            title: "Workspace Detail",
            description: "Detail of workspace.",
            icon: "workspaces",
            apiPrefix: "/api/v1/workspace",
            component: lazyPage(
              () => import("@/features/workspace/pages/WorkspaceDetailPage"),
              "WorkspaceDetailPage",
            ),
            items: [],
          },
        ],
      },
      {
        id: "workspace-members",
        label: "Workspace Members",
        path: slashed(ROUTE_PATH_LIST.WORKSPACE.WORKSPACE_MEMBERS),
        title: "Workspace Members",
        description: "Manage member assignments and position within workspaces.",
        icon: "workspace-members",
        apiPrefix: "/api/v1/workspace-members",
        component: lazyPage(
          () => import("@/features/workspace-members/pages/WorkspaceMemberPage"),
          "WorkspaceMemberPage",
        ),
        items: [
          {
            id: "workspace-member-detail",
            label: "Workspace Member Detail",
            path: slashed(ROUTE_PATH_LIST.WORKSPACE.WORKSPACE_MEMBERS_DETAIL()),
            title: "Workspace Member Detail",
            description: "Detail of workspace member.",
            icon: "workspace-members",
            apiPrefix: "/api/v1/workspace-members",
            component: lazyPage(
              () => import("@/features/workspace-members/pages/WorkspaceMemberDetailPage"),
              "WorkspaceMemberDetailPage",
            ),
            items: [],
          },
        ],
      },
    ],
  },
  {
    id: "project-group",
    label: "Project",
    path: null,
    description: null,
    icon: null,
    component: null,
    items: [
      {
        id: "projects",
        label: "Project",
        path: slashed(ROUTE_PATH_LIST.PROJECT.PROJECT),
        title: "Projects",
        description:
          "Monitor portfolio deliverables, milestones, workspace associations, and project statuses.",
        icon: "projects",
        apiPrefix: "/api/v1/projects",
        component: lazyPage(
          () => import("@/features/projects/pages/ProjectPage"),
          "ProjectPage",
        ),
        items: [
          {
            id: "project-detail",
            label: "Project Detail",
            path: slashed(ROUTE_PATH_LIST.PROJECT.PROJECT_DETAIL()),
            title: "Project Detail",
            description: "Detail of project.",
            icon: "projects",
            apiPrefix: "/api/v1/projects",
            component: lazyPage(
              () => import("@/features/projects/pages/ProjectDetailPage"),
              "ProjectDetailPage",
            ),
            items: [],
          },
        ],
      },
      {
        id: "milestones",
        label: "Milestone",
        path: slashed(ROUTE_PATH_LIST.MILESTONE.MILESTONE),
        title: "Milestones",
        description:
          "Plan and deliver key project deliverables, target deadlines, and sprint milestones.",
        icon: "milestones",
        apiPrefix: "/api/v1/milestone",
        component: lazyPage(
          () => import("@/features/milestone/pages/MilestonePage"),
          "MilestonePage",
        ),
        items: [
          {
            id: "milestone-detail",
            label: "Milestone Detail",
            path: slashed(ROUTE_PATH_LIST.MILESTONE.MILESTONE_DETAIL()),
            title: "Milestone Detail",
            description: "Detail of milestone.",
            icon: "milestones",
            apiPrefix: "/api/v1/milestone",
            component: lazyPage(
              () => import("@/features/milestone/pages/MilestoneDetailPage"),
              "MilestoneDetailPage",
            ),
            items: [],
          },
        ],
      },
    ],
  },
  {
    id: "access-control",
    label: "Access Control",
    path: null,
    description: null,
    icon: null,
    component: null,
    items: [
      {
        id: "users",
        label: "Users",
        path: slashed(ROUTE_PATH_LIST.ACCESS_CONTROL.USER),
        title: "User Directory",
        description: "Manage engineering user accounts and assign RBAC roles.",
        icon: "users",
        apiPrefix: "/api/v1/user",
        component: lazyPage(
          () => import("@/features/access-control/pages/UsersPage"),
          "UsersPage",
        ),
        items: [],
      },
      {
        id: "roles",
        label: "Roles",
        path: slashed(ROUTE_PATH_LIST.ACCESS_CONTROL.ROLE),
        title: "Roles",
        description:
          "Define organizational roles and attach granular permissions.",
        icon: "roles",
        apiPrefix: "/api/v1/role",
        component: lazyPage(
          () => import("@/features/access-control/pages/RolesPage"),
          "RolesPage",
        ),
        items: [
          {
            id: "role-permissions",
            label: "Role Permissions",
            path: slashed(ROUTE_PATH_LIST.ACCESS_CONTROL.ROLE_PERMISSION()),
            title: "Role Permissions",
            description: "Attach permissions to a role.",
            icon: "roles",
            apiPrefix: "/api/v1/role",
            component: lazyPage(
              () =>
                import("@/features/access-control/pages/RolePermissionsPage"),
              "RolePermissionsPage",
            ),
            items: [],
          },
        ],
      },
      {
        id: "permissions",
        label: "Permissions",
        path: slashed(ROUTE_PATH_LIST.ACCESS_CONTROL.PERMISSION),
        title: "Permissions",
        description:
          "Configure capability keys and module-level access policies.",
        icon: "permissions",
        apiPrefix: "/api/v1/permission",
        component: lazyPage(
          () => import("@/features/access-control/pages/PermissionsPage"),
          "PermissionsPage",
        ),
        items: [],
      },
    ],
  },
  {
    id: "master-data",
    label: "Master Data",
    path: null,
    description: null,
    icon: null,
    component: null,
    items: [
      {
        id: "project-type",
        label: "Project Type",
        path: slashed(ROUTE_PATH_LIST.MASTER_DATA.PROJECT_TYPE),
        title: "Project Type",
        description: "Manage master data project type.",
        icon: "project-types",
        apiPrefix: "/api/v1/project-types",
        component: lazyPage(
          () =>
            import("@/features/master-data/project-types/pages/ProjectTypePage"),
          "ProjectTypePage",
        ),
        items: [
          {
            id: "project-type-detail",
            label: "Project Type Detail",
            path: slashed(ROUTE_PATH_LIST.MASTER_DATA.PROJECT_TYPE_DETAIL()),
            title: "Project Type Detail",
            description: "Detail of project type.",
            icon: "project-types",
            apiPrefix: "/api/v1/project-types",
            component: lazyPage(
              () =>
                import("@/features/master-data/project-types/pages/ProjectTypeDetailPage"),
              "ProjectTypeDetailPage",
            ),
            items: [],
          },
        ],
      },
      {
        id: "project-status",
        label: "Project Status",
        path: slashed(ROUTE_PATH_LIST.MASTER_DATA.PROJECT_STATUS),
        title: "Project Status",
        description: "Manage master data project status lifecycle.",
        icon: "project-statuses",
        apiPrefix: "/api/v1/project-status",
        component: lazyPage(
          () =>
            import("@/features/master-data/project-status/pages/ProjectStatusPage"),
          "ProjectStatusPage",
        ),
        items: [
          {
            id: "project-status-detail",
            label: "Project Status Detail",
            path: slashed(ROUTE_PATH_LIST.MASTER_DATA.PROJECT_STATUS_DETAIL()),
            title: "Project Status Detail",
            description: "Detail of project status.",
            icon: "project-statuses",
            apiPrefix: "/api/v1/project-status",
            component: lazyPage(
              () =>
                import("@/features/master-data/project-status/pages/ProjectStatusDetailPage"),
              "ProjectStatusDetailPage",
            ),
            items: [],
          },
        ],
      },
      {
        id: "task-status",
        label: "Task Status",
        path: slashed(ROUTE_PATH_LIST.MASTER_DATA.TASK_STATUS),
        title: "Task Status",
        description: "Manage master data task status lifecycle.",
        icon: "task-statuses",
        apiPrefix: "/api/v1/task-status",
        component: lazyPage(
          () =>
            import("@/features/master-data/task-status/pages/TaskStatusPage"),
          "TaskStatusPage",
        ),
        items: [
          {
            id: "task-status-detail",
            label: "Task Status Detail",
            path: slashed(ROUTE_PATH_LIST.MASTER_DATA.TAKS_STATUS_DETAIL()),
            title: "Task Status Detail",
            description: "Detail of task status.",
            icon: "task-statuses",
            apiPrefix: "/api/v1/task-status",
            component: lazyPage(
              () =>
                import("@/features/master-data/task-status/pages/TaskStatusDetailPage"),
              "TaskStatusDetailPage",
            ),
            items: [],
          },
        ],
      },
      {
        id: "task-type",
        label: "Task Type",
        path: slashed(ROUTE_PATH_LIST.MASTER_DATA.TASK_TYPE),
        title: "Task Type",
        description: "Manage master data task type lifecycle.",
        icon: "task-types",
        apiPrefix: "/api/v1/task-type",
        component: lazyPage(
          () => import("@/features/master-data/task-types/pages/TaskTypePage"),
          "TaskTypePage",
        ),
        items: [
          {
            id: "task-type-detail",
            label: "Task Type Detail",
            path: slashed(ROUTE_PATH_LIST.MASTER_DATA.TASK_TYPE_DETAIL()),
            title: "Task Type Detail",
            description: "Detail of task type.",
            icon: "task-types",
            apiPrefix: "/api/v1/task-type",
            component: lazyPage(
              () =>
                import("@/features/master-data/task-types/pages/TaskTypeDetailPage"),
              "TaskTypeDetailPage",
            ),
            items: [],
          },
        ],
      },
      {
        id: "position",
        label: "Position",
        path: slashed(ROUTE_PATH_LIST.MASTER_DATA.POSITION),
        title: "Position",
        description: "Manage master data position lifecycle.",
        icon: "positions",
        apiPrefix: "/api/v1/position",
        component: lazyPage(
          () => import("@/features/master-data/position/pages/PositionPage"),
          "PositionPage",
        ),
        items: [
          {
            id: "position-detail",
            label: "Position Detail",
            path: slashed(ROUTE_PATH_LIST.MASTER_DATA.POSITION_DETAIL()),
            title: "Position Detail",
            description: "Detail of position.",
            icon: "positions",
            apiPrefix: "/api/v1/position",
            component: lazyPage(
              () =>
                import("@/features/master-data/position/pages/PositionDetailPage"),
              "PositionDetailPage",
            ),
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
    const trail = [
      ...parents,
      { label, path: path?.includes(":") ? undefined : (path ?? undefined) },
    ];
    const self =
      path && component
        ? [{ path, component, title: title ?? label, trail }]
        : [];
    return [...self, ...buildRoutes(items, trail)];
  });

/** Semua halaman admin (menu & detail) dalam satu daftar datar. */
export const ADMIN_ROUTES = buildRoutes(ADMIN_ROUTE_LIST);

/** Cari halaman admin untuk pathname aktif (mendukung path ":id"). */
export const findAdminRoute = (pathname: string) =>
  ADMIN_ROUTES.find((r) => matchPath(r.path, pathname));
