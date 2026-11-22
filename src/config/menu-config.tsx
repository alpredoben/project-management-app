import { ADMIN_ROUTE_LIST, findAdminRoute } from "@/config/admin-route-config";
import { ROUTE_PATH_LIST } from "@/shared/constants";
import { slashed } from "@/shared/libs/helper";
import type {
  In_AdminMenuGroup,
  In_AdminMenuItem,
  In_AdminRouteNode,
  In_BreadcrumbItem,
  In_PublicRouteMenuItem,
} from "@/types/menu-type";

export const PUBLIC_ROUTES: readonly In_PublicRouteMenuItem[] = [
  {
    id: 'login',
    label: 'Sign In',
    path: slashed(ROUTE_PATH_LIST.AUTH.LOGIN),
    title: 'Sign in to MILE-DEV',
    description: 'Access your engineering workspaces, projects, and sprint tasks.',
    apiEndpoint: 'POST /api/v1/auth/login',
    showInAuthNav: true,
  },
  {
    id: 'register',
    label: 'Register',
    path:  slashed(ROUTE_PATH_LIST.AUTH.REGISTER),
    title: 'Create a MILE-DEV account',
    description: 'Register your organization profile and verify your email address.',
    apiEndpoint: 'POST /api/v1/auth/register',
    showInAuthNav: true,
  },
  {
    id: 'forgot-password',
    label: 'Forgot Password',
    path:  slashed(ROUTE_PATH_LIST.AUTH.FORGOT_PASSWORD),
    title: 'Recover account access',
    description: 'Request a secure password reset token for your registered email.',
    apiEndpoint: 'POST /api/v1/auth/forgot-password',
    showInAuthNav: true,
  },
  {
    id: 'reset-password',
    label: 'Reset Password',
    path:  slashed(ROUTE_PATH_LIST.AUTH.RESET_PASSWORD),
    title: 'Set a new password',
    description: 'Complete password recovery with your reset token.',
    apiEndpoint: 'POST /api/v1/auth/reset-password',
    showInAuthNav: false,
  },
  {
    id: 'verified-email',
    label: 'Verify Email',
    path:  slashed(ROUTE_PATH_LIST.AUTH.VERIFY_EMAIL),
    title: 'Email Verification',
    description: 'Activate your MILE-DEV account from your email verification link.',
    apiEndpoint: 'GET /auth/verified-email',
    showInAuthNav: false,
  },
] as const;

/* -------------------------------------------------------------------------- */
/*  Sidebar menu — diturunkan dari ADMIN_ROUTE_LIST (level 1 & 2 saja)        */
/* -------------------------------------------------------------------------- */

const toMenuItem = (node: In_AdminRouteNode): In_AdminMenuItem => ({
  id: node.id,
  label: node.label,
  path: node.path ?? '',
  title: node.title ?? node.label,
  description: node.description ?? '',
  icon: node.icon ?? 'overview',
  apiPrefix: node.apiPrefix ?? '',
  requiredRoles: node.requiredRoles,
  hidden: node.hidden,
});

export const ADMIN_MENU_GROUPS: readonly In_AdminMenuGroup[] = ADMIN_ROUTE_LIST.map(
  (group) => ({
    id: group.id,
    label: group.label,
    items: group.items.filter((item) => item.path).map(toMenuItem),
  }),
);

export function getAllAdminMenuItems(): In_AdminMenuItem[] {
  return ADMIN_MENU_GROUPS.flatMap((group) =>
    group.items.filter((item) => !item.hidden),
  );
}

export function findMenuByPath(pathname: string): {
  group: In_AdminMenuGroup | null;
  item: In_AdminMenuItem | null;
} {
  for (const group of ADMIN_MENU_GROUPS) {
    const matched = group.items.find((item) => item.path === pathname);
    if (matched) {
      return { group, item: matched };
    }
  }
  return { group: null, item: null };
}

/* -------------------------------------------------------------------------- */
/*  Breadcrumb — trail sudah dihitung di ADMIN_ROUTES                         */
/* -------------------------------------------------------------------------- */

export type { In_BreadcrumbItem };

const ROOT_CRUMB: In_BreadcrumbItem = { label: 'MILE-DEV', path: '/admin' };

export function getBreadcrumbs(pathname: string): In_BreadcrumbItem[] {
  const route = findAdminRoute(pathname);
  if (!route) return [ROOT_CRUMB, { label: 'Console' }];

  // Halaman Overview: tanpa nama group
  const trail = route.path === '/admin' ? route.trail.slice(-1) : route.trail;
  return [ROOT_CRUMB, ...trail];
}