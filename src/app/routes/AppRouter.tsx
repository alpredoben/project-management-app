import { lazy, useEffect, type ComponentType } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import {
  findMenuByPath,
  getAllAdminMenuItems,
  PUBLIC_ROUTES,
} from "@/config/menu-config";
import { NotFoundPage } from "@/features/errors/NotFoundPage";
import { PublicRouteGuard } from "./PublicRouteGuard";
import { PrivateRouteGuard } from "./PrivateRouteGuard";

export const WebPages = {
  Login: lazy(() =>
    import("@/features/auth/pages/LoginPage").then((m) => ({
      default: m.LoginPage,
    })),
  ),

  Register: lazy(() =>
    import("@/features/auth/pages/RegisterPage").then((m) => ({
      default: m.RegisterPage,
    })),
  ),

  ForgotPassword: lazy(() =>
    import("@/features/auth/pages/ForgotPasswordPage").then((m) => ({
      default: m.ForgotPasswordPage,
    })),
  ),

  ResetPassword: lazy(() =>
    import("@/features/auth/pages/ResetPasswordPage").then((m) => ({
      default: m.ResetPasswordPage,
    })),
  ),

  VerifiedEmail: lazy(() =>
    import("@/features/auth/pages/VerifiedEmailPage").then((m) => ({
      default: m.VerifiedEmailPage,
    })),
  ),

  DashboardOverview: lazy(() =>
    import("@/features/dashboard/pages/DashboardOverview").then((m) => ({
      default: m.DashboardOverviewPage,
    })),
  ),

  AuthSession: lazy(() =>
    import("@/features/auth/pages/AuthSessionPage").then((m) => ({
      default: m.AuthSessionPage,
    })),
  ),

  Users: lazy(() =>
    import("@/features/access-control/pages/UsersPage").then((m) => ({
      default: m.UsersPage,
    })),
  ),

  Roles: lazy(() =>
    import("@/features/access-control/pages/RolesPage").then((m) => ({
      default: m.RolesPage,
    })),
  ),
  RolePermissions: lazy(() =>
    import("@/features/access-control/pages/RolePermissionsPage").then((m) => ({
      default: m.RolePermissionsPage,
    })),
  ),
  Permissions: lazy(() =>
    import("@/features/access-control/pages/PermissionsPage").then((m) => ({
      default: m.PermissionsPage,
    })),
  ),

  ProjectType: lazy(() =>
    import("@/features/master-data/project-types/pages/ProjectTypePage").then(
      (m) => ({
        default: m.ProjectTypePage,
      }),
    ),
  ),

  ProjectTypeDetail: lazy(() =>
    import(
      "@/features/master-data/project-types/pages/ProjectTypeDetailPage"
    ).then((m) => ({
      default: m.ProjectTypeDetailPage,
    })),
  ),

  ProjectStatus: lazy(() =>
    import(
      "@/features/master-data/project-status/pages/ProjectStatusPage"
    ).then((m) => ({
      default: m.ProjectStatusPage,
    })),
  ),

  ProjectStatusDetail: lazy(() =>
    import(
      "@/features/master-data/project-status/pages/ProjectStatusDetailPage"
    ).then((m) => ({
      default: m.ProjectStatusDetailPage,
    })),
  ),

  Workspace: lazy(() =>
    import("@/features/workspace/pages/WorkspacePage").then((m) => ({
      default: m.WorkspacePage,
    })),
  ),

  WorkspaceDetail: lazy(() =>
    import("@/features/workspace/pages/WorkspaceDetailPage").then((m) => ({
      default: m.WorkspaceDetailPage,
    })),
  ),
};

const ADMIN_ROUTE_COMPONENTS: Record<string, ComponentType> = {
  "dashboard-overview": WebPages.DashboardOverview,
  "auth-session": WebPages.AuthSession,
  users: WebPages.Users,
  roles: WebPages.Roles,
  permissions: WebPages.Permissions,
  "project-type": WebPages.ProjectType,
  "project-status": WebPages.ProjectStatus,
  workspace: WebPages.Workspace,
  workspaces: WebPages.Workspace,
};


function DocumentTitleSync() {
  const location = useLocation();

  useEffect(() => {
    if (/^\/admin\/roles\/[^/]+\/permissions$/.test(location.pathname)) {
      document.title = "Role Permissions — MILE-DEV";
      return;
    }
    if (/^\/admin\/project-type\/[^/]+$/.test(location.pathname)) {
      document.title = "Project Type Detail — MILE-DEV";
      return;
    }
    if (/^\/admin\/project-status\/[^/]+$/.test(location.pathname)) {
      document.title = "Project Status Detail — MILE-DEV";
      return;
    }
    if (/^\/admin\/workspaces?\/[^/]+$/.test(location.pathname)) {
      document.title = "Workspace Detail — MILE-DEV";
      return;
    }
    const publicMatch = PUBLIC_ROUTES.find((r) => r.path === location.pathname);
    if (publicMatch) {
      document.title = `${publicMatch.title} — MILE-DEV`;
      return;
    }
    const adminMatch = findMenuByPath(location.pathname);
    if (adminMatch.item) {
      document.title = `${adminMatch.item.title} — MILE-DEV`;
      return;
    }
    document.title = "MILE-DEV — Project Management";
  }, [location.pathname]);

  return null;
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <DocumentTitleSync />
      <Routes>
        <Route path="/" element={<Navigate to="/admin" replace />} />

        {/* Public Routes */}
        <Route element={<PublicRouteGuard />}>
          <Route path="/login" element={<WebPages.Login />} />
          <Route path="/register" element={<WebPages.Register />} />
          <Route path="/forgot-password" element={<WebPages.ForgotPassword />} />
          <Route path="/reset-password" element={<WebPages.ResetPassword />} />
          <Route path="/auth/verified-email" element={<WebPages.VerifiedEmail />} />
        </Route>

        {/* Private Admin Dashboard Routes (driven by menu-config.ts) */}
        <Route element={<PrivateRouteGuard />}>
          <Route
            path="/admin/roles/:id/permissions"
            element={<WebPages.RolePermissions />}
          />
          <Route
            path="/admin/project-type/:id"
            element={<WebPages.ProjectTypeDetail />}
          />
          <Route
            path="/admin/project-status/:id"
            element={<WebPages.ProjectStatusDetail />}
          />
          <Route
            path="/admin/workspace/:id"
            element={<WebPages.WorkspaceDetail />}
          />
          <Route
            path="/admin/workspaces/:id"
            element={<WebPages.WorkspaceDetail />}
          />
          {getAllAdminMenuItems().map((item) => {
            const PageComponent = ADMIN_ROUTE_COMPONENTS[item.id];
            if (!PageComponent) return null;
            return (
              <Route
                key={item.id}
                path={item.path}
                element={<PageComponent />}
              />
            );
          })}
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export { ADMIN_ROUTE_COMPONENTS };
