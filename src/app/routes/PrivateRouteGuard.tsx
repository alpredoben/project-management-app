import { AdminLayout } from "@/components/layouts/AdminLayout";
import { useAppSelector } from "@/store/hooks";
import { Suspense } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { RouteFallback } from "./RouteFallback";

export function PrivateRouteGuard() {
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