import { useEffect } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { ADMIN_ROUTES, findAdminRoute } from "@/config/admin-route-config";
import { PUBLIC_ROUTES } from "@/config/menu-config";
import { NotFoundPage } from "@/features/errors/NotFoundPage";
import type { In_RouteConfig } from "@/types/menu-type";
import { PUBLIC_PAGE_ROUTES, PrivateRoute, PublicRoute } from "./ConfigRoute";

const APP_NAME = "MILE-DEV";
const DEFAULT_TITLE = `${APP_NAME} — Project Management`;

function resolveTitle(pathname: string): string {
  const title =
    findAdminRoute(pathname)?.title ??
    PUBLIC_ROUTES.find((r) => r.path === pathname)?.title;

  return title ? `${title} — ${APP_NAME}` : DEFAULT_TITLE;
}

function DocumentTitleSync() {
  const { pathname } = useLocation();

  useEffect(() => {
    document.title = resolveTitle(pathname);
  }, [pathname]);

  return null;
}

const renderRoutes = (routes: In_RouteConfig[]) =>
  routes.map(({ path, component: Page }) => (
    <Route key={path} path={path} element={<Page />} />
  ));

export function AppRouter() {
  return (
    <BrowserRouter>
      <DocumentTitleSync />
      <Routes>
        <Route path="/" element={<Navigate to="/admin" replace />} />
        <Route element={<PublicRoute />}>{renderRoutes(PUBLIC_PAGE_ROUTES)}</Route>
        <Route element={<PrivateRoute />}>{renderRoutes(ADMIN_ROUTES)}</Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}