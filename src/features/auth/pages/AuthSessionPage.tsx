import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, RefreshCw, Search, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { ENV } from '@/config/env-config';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { clearSession, setCurrentUser, setTokens } from '@/store/slices/auth-slice';
import { pushToast } from '@/store/slices/ui-slice';
import {
  authApi
} from '../api/auth-api';

export function AuthSessionPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const authState = useAppSelector((s) => s.auth);
  const [permissionSearch, setPermissionSearch] = useState('');

  const meQuery = authApi.query.useGetProfile(true);
  const refreshMutation = authApi.mutation.useRefreshToken();
  const logoutMutation = authApi.mutation.useLogout();

  const handleSyncProfile = async () => {
    const result = await meQuery.refetch();
    if (result.data) {
      dispatch(setCurrentUser(result.data));
      dispatch(
        pushToast({
          title: 'Profile refreshed',
          description: 'Fetched latest session identity via GET /api/v1/auth/me.',
          variant: 'success',
        }),
      );
    }
  };

  const handleRotateToken = async () => {
    if (!authState.refreshToken) {
      dispatch(
        pushToast({
          title: 'No refresh token',
          description: 'Sign in again to obtain a refresh token.',
          variant: 'error',
        }),
      );
      return;
    }
    try {
      const nextTokens = await refreshMutation.mutateAsync(authState.refreshToken);
      dispatch(setTokens(nextTokens));
      const refreshedMe = await meQuery.refetch();
      if (refreshedMe.data) {
        dispatch(setCurrentUser(refreshedMe.data));
      }
      dispatch(
        pushToast({
          title: 'Token rotated',
          description: 'Issued fresh tokens via POST /api/v1/auth/refersh-token.',
          variant: 'success',
        }),
      );
    } catch (err) {
      dispatch(
        pushToast({
          title: 'Refresh failed',
          description: err instanceof Error ? err.message : 'Could not rotate token.',
          variant: 'error',
        }),
      );
    }
  };

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    dispatch(clearSession());
    dispatch(
      pushToast({
        title: 'Logged out',
        description: 'Session revoked via POST /api/v1/auth/logout.',
        variant: 'info',
      }),
    );
    navigate('/login', { replace: true });
  };

  const activeUser = meQuery.data ?? authState.user;

  const filteredPermissions = useMemo(() => {
    const permissions = activeUser?.permissions ?? [];
    const q = permissionSearch.trim().toLowerCase();
    if (!q) return permissions;
    return permissions.filter(
      (p) => p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q),
    );
  }, [activeUser?.permissions, permissionSearch]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Authentication & Session"
        description="Inspect the authenticated user profile, assigned roles & permissions, or rotate active Bearer tokens."
        apiPrefix="/api/v1/auth · me · refersh-token · logout"
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void handleSyncProfile()}
              isLoading={meQuery.isFetching}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Verify /auth/me
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => void handleRotateToken()}
              isLoading={refreshMutation.isPending}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Rotate Token
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => void handleLogout()}
              isLoading={logoutMutation.isPending}
            >
              <LogOut className="h-3.5 w-3.5" />
              Logout
            </Button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <h2 className="font-display text-base font-semibold text-gray-900 dark:text-white/90">
            Authenticated Identity
          </h2>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Live payload returned by <span className="font-mono">GET /api/v1/auth/me</span>
          </p>

          {meQuery.isLoading && !activeUser ? (
            <div className="mt-4 space-y-2">
              <div className="h-4 w-48 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
              <div className="h-4 w-64 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
              <div className="h-4 w-56 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
            </div>
          ) : activeUser ? (
            <dl className="mt-5 divide-y divide-gray-100 text-xs dark:divide-gray-800">
              <div className="flex justify-between gap-4 py-2.5">
                <dt className="text-gray-500 dark:text-gray-400">User ID</dt>
                <dd className="truncate font-mono text-gray-900 dark:text-white/90">
                  {activeUser.id}
                </dd>
              </div>
              <div className="flex justify-between gap-4 py-2.5">
                <dt className="text-slate-500 dark:text-slate-400">Name</dt>
                <dd className="font-medium text-slate-900 dark:text-slate-100">
                  {activeUser.name}
                </dd>
              </div>
              <div className="flex justify-between gap-4 py-2.5">
                <dt className="text-slate-500 dark:text-slate-400">Email</dt>
                <dd className="text-slate-900 dark:text-slate-100">{activeUser.email}</dd>
              </div>
              <div className="flex justify-between gap-4 py-2.5">
                <dt className="text-slate-500 dark:text-slate-400">NIP</dt>
                <dd className="font-mono text-slate-900 dark:text-slate-100">
                  {activeUser.nip ?? '—'}
                </dd>
              </div>
              <div className="flex justify-between gap-4 py-2.5">
                <dt className="text-slate-500 dark:text-slate-400">Account Status</dt>
                <dd className="font-medium text-slate-900 dark:text-slate-100">
                  {activeUser.is_active ? 'Active' : 'Inactive'} ·{' '}
                  {activeUser.is_email_verified ? 'Email Verified' : 'Pending Verification'} ·{' '}
                  {activeUser.is_login ? 'Online' : 'Offline'}
                </dd>
              </div>
              <div className="flex justify-between gap-4 py-2.5">
                <dt className="text-slate-500 dark:text-slate-400">Last Login</dt>
                <dd className="font-mono tabular-nums text-slate-900 dark:text-slate-100">
                  {activeUser.last_login_at
                    ? new Date(activeUser.last_login_at).toLocaleString()
                    : '—'}
                </dd>
              </div>
              <div className="flex justify-between gap-4 py-2.5">
                <dt className="text-slate-500 dark:text-slate-400">Assigned Roles</dt>
                <dd className="text-right font-medium text-slate-900 dark:text-slate-100">
                  {activeUser.roles.length > 0
                    ? activeUser.roles
                        .map((r) => `${r.name} (${r.permissions.length} perms)`)
                        .join(' · ')
                    : 'None'}
                </dd>
              </div>
            </dl>
          ) : null}
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <h2 className="font-display text-base font-semibold text-gray-900 dark:text-white/90">
            Session Credentials
          </h2>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Active <span className="font-mono">{authState.tokenType ?? 'Bearer'}</span> token
            metadata returned by <span className="font-mono">POST /api/v1/auth/login</span>
          </p>

          <dl className="mt-5 divide-y divide-gray-100 text-xs dark:divide-gray-800">
            <div className="flex justify-between py-2.5">
              <dt className="text-slate-500 dark:text-slate-400">Token Type</dt>
              <dd className="font-mono text-slate-800 dark:text-slate-200">
                {authState.tokenType ?? 'Bearer'}
              </dd>
            </div>
            <div className="py-2.5 space-y-1">
              <dt className="text-slate-500 dark:text-slate-400">Access Token</dt>
              <dd className="max-h-24 overflow-y-auto break-all font-mono text-[11px] text-slate-800 dark:text-slate-200">
                {authState.accessToken ?? '—'}
              </dd>
            </div>
            <div className="py-2.5 space-y-1">
              <dt className="text-slate-500 dark:text-slate-400">Refresh Token</dt>
              <dd className="max-h-24 overflow-y-auto break-all font-mono text-[11px] text-slate-800 dark:text-slate-200">
                {authState.refreshToken ?? '—'}
              </dd>
            </div>
            <div className="flex justify-between py-2.5">
              <dt className="text-slate-500 dark:text-slate-400">Token Expires At (JWT exp)</dt>
              <dd className="font-mono tabular-nums text-slate-800 dark:text-slate-200">
                {authState.expiresAt ? new Date(authState.expiresAt).toLocaleString() : '—'}
              </dd>
            </div>
            <div className="flex justify-between py-2.5">
              <dt className="text-slate-500 dark:text-slate-400">Active Environment</dt>
              <dd className="font-mono text-slate-800 dark:text-slate-200">
                {ENV.ENVIRONMENT} ({ENV.ENV_FILE})
              </dd>
            </div>
          </dl>
        </section>
      </div>

      {activeUser && (
        <section className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-base font-semibold text-gray-900 dark:text-white/90">
                Effective Permissions ({activeUser.permissions.length})
              </h2>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                Aggregated permission grants resolved from assigned roles in{' '}
                <span className="font-mono">/auth/me</span>
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                value={permissionSearch}
                onChange={(e) => setPermissionSearch(e.target.value)}
                placeholder="Filter permissions..."
                aria-label="Filter permissions"
                className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 pl-8 pr-3 text-xs text-gray-900 placeholder:text-gray-400 focus:border-brand-300 focus:bg-white focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-700"
              />
            </div>
          </div>

          {filteredPermissions.length === 0 ? (
            <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
              No permissions match &ldquo;{permissionSearch}&rdquo;.
            </p>
          ) : (
            <div className="mt-4 max-h-64 overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-800">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 border-b border-gray-200 bg-gray-50 text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Permission Name</th>
                    <th className="px-4 py-2.5 font-medium">Permission ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filteredPermissions.map((perm) => (
                    <tr key={perm.id} className="hover:bg-gray-50/80 dark:hover:bg-white/[0.02]">
                      <td className="px-4 py-2.5 font-mono text-gray-900 dark:text-white/90">
                        {perm.name}
                      </td>
                      <td className="px-3 py-2 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                        {perm.id}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
