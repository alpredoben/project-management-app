/* eslint-disable react-refresh/only-export-components */
import { Suspense } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { PublicLayout } from "@/components/layouts/PublicLayout";
import { lazyPage } from "@/shared/libs/helper";
import { useAppSelector } from "@/store/hooks";
import type { In_RouteConfig } from "@/types/menu-type";
import { RouteFallback } from "./RouteFallback";


export const PUBLIC_PAGE_ROUTES: In_RouteConfig[] = [
  {
    path: "/login",
    component: lazyPage(() => import("@/features/auth/pages/LoginPage"), "LoginPage"),
  },
  {
    path: "/register",
    component: lazyPage(() => import("@/features/auth/pages/RegisterPage"), "RegisterPage"),
  },
  {
    path: "/forgot-password",
    component: lazyPage(() => import("@/features/auth/pages/ForgotPasswordPage"), "ForgotPasswordPage"),
  },
  {
    path: "/reset-password",
    component: lazyPage(() => import("@/features/auth/pages/ResetPasswordPage"), "ResetPasswordPage"),
  },
  {
    path: "/auth/verified-email",
    component: lazyPage(() => import("@/features/auth/pages/VerifiedEmailPage"), "VerifiedEmailPage"),
    allowWhenAuthenticated: true,
  },
];


export function PublicRoute() {
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const { pathname } = useLocation();

  const allowed =
    PUBLIC_PAGE_ROUTES.find((r) => r.path === pathname)?.allowWhenAuthenticated ?? false;

  if (isAuthenticated && !allowed) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <PublicLayout>
      <Suspense fallback={<RouteFallback />}>
        <Outlet />
      </Suspense>
    </PublicLayout>
  );
}

export function PrivateRoute() {
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <AdminLayout>
      <Suspense fallback={<RouteFallback />}>
        <Outlet />
      </Suspense>
    </AdminLayout>
  );
}