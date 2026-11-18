import { useAppSelector } from "@/store/hooks";
import { Suspense } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { RouteFallback } from "./RouteFallback";
import { PublicLayout } from "@/components/layouts/PublicLayout";

export function PublicRouteGuard() {
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const location = useLocation();
  if (isAuthenticated && location.pathname !== "/auth/verified-email") {
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