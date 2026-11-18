import type { In_PublicRouteMenuItem, In_AdminMenuItem, In_AdminMenuGroup } from "@/types/menu-type";


export const PUBLIC_ROUTES: readonly In_PublicRouteMenuItem[] = [
  {
    id: 'login',
    label: 'Sign In',
    path: '/login',
    title: 'Sign in to MILE-DEV',
    description: 'Access your engineering workspaces, projects, and sprint tasks.',
    apiEndpoint: 'POST /api/v1/auth/login',
    showInAuthNav: true,
  },
  {
    id: 'register',
    label: 'Register',
    path: '/register',
    title: 'Create a MILE-DEV account',
    description: 'Register your organization profile and verify your email address.',
    apiEndpoint: 'POST /api/v1/auth/register',
    showInAuthNav: true,
  },
  {
    id: 'forgot-password',
    label: 'Forgot Password',
    path: '/forgot-password',
    title: 'Recover account access',
    description: 'Request a secure password reset token for your registered email.',
    apiEndpoint: 'POST /api/v1/auth/forgot-password',
    showInAuthNav: true,
  },
  {
    id: 'reset-password',
    label: 'Reset Password',
    path: '/reset-password',
    title: 'Set a new password',
    description: 'Complete password recovery with your reset token.',
    apiEndpoint: 'POST /api/v1/auth/reset-password',
    showInAuthNav: false,
  },
  {
    id: 'verified-email',
    label: 'Verify Email',
    path: '/auth/verified-email',
    title: 'Email Verification',
    description: 'Activate your MILE-DEV account from your email verification link.',
    apiEndpoint: 'GET /auth/verified-email',
    showInAuthNav: false,
  },
] as const;

export const ADMIN_MENU_GROUPS: readonly In_AdminMenuGroup[] = [
  {
    id: 'overview',
    label: 'Workspace Console',
    items: [
      {
        id: 'dashboard-overview',
        label: 'Overview',
        path: '/admin',
        title: 'Executive Overview',
        description: 'Live portfolio metrics across workspaces, active projects, milestones, and tasks.',
        icon: 'overview',
        apiPrefix: '/api/v1',
      },
      {
        id: 'auth-session',
        label: 'Auth & Session',
        path: '/admin/auth',
        title: 'Authentication & Session',
        description: 'Inspect current user profile, rotate refresh tokens, or terminate session.',
        icon: 'auth',
        apiPrefix: '/api/v1/auth',
      },
    ],
  },
  {
    id: 'access-control',
    label: 'Access Control',
    items: [
      {
        id: 'users',
        label: 'Users',
        path: '/admin/users',
        title: 'User Directory',
        description: 'Manage engineering user accounts and assign RBAC roles.',
        icon: 'users',
        apiPrefix: '/api/v1/user',
      },
      {
        id: 'roles',
        label: 'Roles',
        path: '/admin/roles',
        title: 'Roles',
        description: 'Define organizational roles and attach granular permissions.',
        icon: 'roles',
        apiPrefix: '/api/v1/role',
      },
      {
        id: 'permissions',
        label: 'Permissions',
        path: '/admin/permissions',
        title: 'Permissions',
        description: 'Configure capability keys and module-level access policies.',
        icon: 'permissions',
        apiPrefix: '/api/v1/permission',
      },
    ],
  }
] as const;

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

export interface In_BreadcrumbItem {
  label: string;
  path?: string;
}

export function getBreadcrumbs(pathname: string): In_BreadcrumbItem[] {
  const { group, item } = findMenuByPath(pathname);
  if (!item) {
    return [{ label: 'MILE-DEV', path: '/admin' }, { label: 'Console' }];
  }
  if (item.path === '/admin') {
    return [{ label: 'MILE-DEV', path: '/admin' }, { label: item.label }];
  }
  return [
    { label: 'MILE-DEV', path: '/admin' },
    ...(group ? [{ label: group.label }] : []),
    { label: item.label, path: item.path },
  ];
}
