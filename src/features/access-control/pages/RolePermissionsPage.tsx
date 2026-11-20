import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronUp,
  CircleAlert,
  KeyRound,
  Layers3,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { useAppDispatch } from '@/store/hooks';
import { pushToast } from '@/store/slices/ui-slice';
import {
  permissionAccessApi,
  roleAccessApi,
} from '../api/access-control-api';

export function RolePermissionsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [search, setSearch] = useState('');
  const [selection, setSelection] = useState<string[] | null>(null);
  const [collapsedModules, setCollapsedModules] = useState<Set<string>>(
    () => new Set(),
  );

  const roleQuery = roleAccessApi.query.useRoleFind(id ?? null);
  const groupsQuery = permissionAccessApi.query.usePermissionGroups();
  const saveMutation = roleAccessApi.mutation.useInsertRolePermissions();

  const existingIds =
    roleQuery.data?.permissions.map((permission) => permission.id) ?? [];
  const selectedIds = selection ?? existingIds;
  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const existingIdSet = useMemo(() => new Set(existingIds), [existingIds]);

  const filteredGroups = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    return (groupsQuery.data ?? [])
      .map((group) => ({
        ...group,
        permission_items: group.permission_items.filter(
          (permission) =>
            !term ||
            group.module_name.toLocaleLowerCase().includes(term) ||
            permission.name.toLocaleLowerCase().includes(term) ||
            permission.description?.toLocaleLowerCase().includes(term),
        ),
      }))
      .filter((group) => group.permission_items.length > 0);
  }, [groupsQuery.data, search]);

  const hasChanges =
    selectedIds.length !== existingIds.length ||
    selectedIds.some((permissionId) => !existingIdSet.has(permissionId));
  const visiblePermissionIds = filteredGroups.flatMap((group) =>
    group.permission_items.map((permission) => permission.id),
  );
  const selectedVisibleCount = visiblePermissionIds.filter((permissionId) =>
    selectedIdSet.has(permissionId),
  ).length;
  const allPermissionIds = (groupsQuery.data ?? []).flatMap((group) =>
    group.permission_items.map((permission) => permission.id),
  );
  const allPermissionIdSet = new Set(allPermissionIds);
  const unavailableIds = existingIds.filter(
    (permissionId) => !allPermissionIdSet.has(permissionId),
  );

  const togglePermission = (permissionId: string) => {
    setSelection((currentSelection) => {
      const currentIds = currentSelection ?? existingIds;
      return currentIds.includes(permissionId)
        ? currentIds.filter((idValue) => idValue !== permissionId)
        : [...currentIds, permissionId];
    });
  };

  const toggleGroup = (
    permissionIds: string[],
    allSelected: boolean,
  ) => {
    setSelection((currentSelection) => {
      const currentIds = new Set(currentSelection ?? existingIds);
      permissionIds.forEach((permissionId) => {
        if (allSelected) currentIds.delete(permissionId);
        else currentIds.add(permissionId);
      });
      return [...currentIds];
    });
  };

  const handleSave = async () => {
    if (!id || !roleQuery.data || !hasChanges) return;
    try {
      const updatedRole = await saveMutation.mutateAsync({
        id,
        permissionIds: selectedIds,
      });
      dispatch(
        pushToast({
          title: existingIds.length
            ? 'Permissions updated'
            : 'Permissions added',
          description: `${updatedRole.permissions.length} permissions assigned to ${updatedRole.name}.`,
          variant: 'success',
        }),
      );
      navigate('/admin/roles');
    } catch (error) {
      dispatch(
        pushToast({
          title: 'Permission update failed',
          description:
            error instanceof Error
              ? error.message
              : 'Unable to save role permissions.',
          variant: 'error',
        }),
      );
    }
  };

  const goBack = () => navigate('/admin/roles');

  if (!id) {
    return (
      <div className="space-y-5">
        <PageHeader
          title="Manage permissions"
          description="Choose the capabilities assigned to this role."
        />
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          The role ID is missing from this page URL.
          <Button variant="outline" size="sm" className="ml-3" onClick={goBack}>
            Back to roles
          </Button>
        </div>
      </div>
    );
  }

  if (roleQuery.isLoading || groupsQuery.isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Manage permissions"
          description="Loading role and permission catalog..."
          actions={
            <Button variant="outline" onClick={goBack}>
              <ArrowLeft className="h-4 w-4" />
              Back to roles
            </Button>
          }
        />
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="space-y-4">
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="h-44 animate-pulse rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-gray-900"
              />
            ))}
          </div>
          <div className="h-56 animate-pulse rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-gray-900" />
        </div>
      </div>
    );
  }

  if (roleQuery.error || groupsQuery.error || !roleQuery.data) {
    const error = roleQuery.error ?? groupsQuery.error;
    return (
      <div className="space-y-5">
        <PageHeader
          title="Manage permissions"
          description="Choose the capabilities assigned to this role."
          actions={
            <Button variant="outline" onClick={goBack}>
              <ArrowLeft className="h-4 w-4" />
              Back to roles
            </Button>
          }
        />
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 dark:border-red-900/50 dark:bg-red-950/30">
          <div className="flex items-start gap-3 text-red-700 dark:text-red-300">
            <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" />
            <div className="min-w-0">
              <p className="font-semibold">Unable to load role permissions</p>
              <p className="mt-1 break-words text-sm">
                {error?.message ?? 'The role could not be found.'}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {roleQuery.error && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void roleQuery.refetch()}
                  >
                    Retry role
                  </Button>
                )}
                {groupsQuery.error && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void groupsQuery.refetch()}
                  >
                    Retry permission catalog
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const role = roleQuery.data;
  const isAdding = role.permissions.length === 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Role permissions"
        description="Select the capabilities this role can use. Changes replace the role's complete permission list."
        actions={
          <Button variant="outline" onClick={goBack}>
            <ArrowLeft className="h-4 w-4" />
            Back to roles
          </Button>
        }
      />

      <section className="relative overflow-hidden rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-50 via-white to-indigo-50 p-5 shadow-sm dark:border-brand-900/50 dark:from-brand-950/40 dark:via-gray-900 dark:to-indigo-950/30 sm:p-6">
        <div className="pointer-events-none absolute -right-10 -top-14 h-44 w-44 rounded-full bg-brand-300/20 blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-500 text-white shadow-lg shadow-brand-500/20">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700 dark:text-brand-300">
                Role access profile
              </p>
              <h2 className="mt-1 break-words text-xl font-semibold text-gray-900 dark:text-white/90">
                {role.name}
              </h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {role.description || 'No description provided.'}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3 self-start rounded-xl border border-white/80 bg-white/80 px-4 py-3 shadow-sm backdrop-blur dark:border-gray-700 dark:bg-gray-900/70 sm:self-auto">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
              <KeyRound className="h-4 w-4" />
            </div>
            <div>
              <p className="font-mono text-lg font-semibold leading-none text-gray-900 dark:text-white/90">
                {selectedIds.length}
              </p>
              <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                selected permissions
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <section className="min-w-0 space-y-4">
          <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search permissions..."
                aria-label="Search permissions"
                className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm text-gray-800 outline-none transition focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-950 dark:text-white/90 dark:focus:bg-gray-900"
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {selectedVisibleCount} of {visiblePermissionIds.length} visible selected
              </span>
              <Button
                variant="ghost"
                size="sm"
                disabled={visiblePermissionIds.length === 0}
                onClick={() =>
                  toggleGroup(
                    visiblePermissionIds,
                    selectedVisibleCount === visiblePermissionIds.length,
                  )
                }
              >
                <CheckCheck className="h-4 w-4" />
                {selectedVisibleCount === visiblePermissionIds.length
                  ? 'Clear visible'
                  : 'Select visible'}
              </Button>
            </div>
          </div>

          {unavailableIds.length > 0 && (
            <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200 sm:flex-row sm:items-center sm:justify-between">
              <p>
                {unavailableIds.length} assigned permission
                {unavailableIds.length === 1 ? ' is' : 's are'} no longer in the catalog.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setSelection((current) =>
                    (current ?? existingIds).filter(
                      (permissionId) => !unavailableIds.includes(permissionId),
                    ),
                  )
                }
              >
                Remove unavailable
              </Button>
            </div>
          )}

          {filteredGroups.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-5 py-12 text-center dark:border-gray-700 dark:bg-gray-900">
              <Search className="mx-auto h-8 w-8 text-gray-400" />
              <p className="mt-3 font-medium text-gray-900 dark:text-white/90">
                No matching permissions
              </p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Try another search term or clear the search field.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredGroups.map((group) => {
                const permissionIds = group.permission_items.map(
                  (permission) => permission.id,
                );
                const selectedCount = permissionIds.filter((permissionId) =>
                  selectedIdSet.has(permissionId),
                ).length;
                const isCollapsed = collapsedModules.has(group.module_name);

                return (
                  <article
                    key={group.module_name}
                    className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition duration-200 hover:border-brand-200 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:border-brand-900"
                  >
                    <div className="flex flex-col gap-3 border-b border-gray-100 bg-gray-50/80 px-4 py-4 dark:border-gray-800 dark:bg-white/[0.02] sm:flex-row sm:items-center sm:justify-between sm:px-5">
                      <button
                        type="button"
                        onClick={() =>
                          setCollapsedModules((current) => {
                            const next = new Set(current);
                            if (next.has(group.module_name)) {
                              next.delete(group.module_name);
                            } else {
                              next.add(group.module_name);
                            }
                            return next;
                          })
                        }
                        aria-expanded={!isCollapsed}
                        className="flex min-w-0 items-center gap-3 text-left"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                          <Layers3 className="h-4 w-4" />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-semibold text-gray-900 dark:text-white/90">
                            {group.module_name}
                          </span>
                          <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">
                            {selectedCount} of {permissionIds.length} selected
                          </span>
                        </span>
                        {isCollapsed ? (
                          <ChevronDown className="ml-auto h-4 w-4 shrink-0 text-gray-400 sm:ml-0" />
                        ) : (
                          <ChevronUp className="ml-auto h-4 w-4 shrink-0 text-gray-400 sm:ml-0" />
                        )}
                      </button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          toggleGroup(
                            permissionIds,
                            selectedCount === permissionIds.length,
                          )
                        }
                      >
                        {selectedCount === permissionIds.length
                          ? 'Clear module'
                          : 'Select module'}
                      </Button>
                    </div>

                    {!isCollapsed && (
                      <div className="divide-y divide-gray-100 dark:divide-gray-800">
                        {group.permission_items.map((permission) => {
                          const checked = selectedIdSet.has(permission.id);
                          return (
                            <label
                              key={permission.id}
                              className={`group flex cursor-pointer items-start gap-3 px-4 py-4 transition-colors duration-150 sm:px-5 ${
                                checked
                                  ? 'bg-brand-50/60 dark:bg-brand-950/20'
                                  : 'hover:bg-gray-50 dark:hover:bg-white/[0.025]'
                              }`}
                            >
                              <span className="relative mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => togglePermission(permission.id)}
                                  aria-label={`Select ${permission.name}`}
                                  className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-gray-300 bg-white transition checked:border-brand-500 checked:bg-brand-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20 dark:border-gray-600 dark:bg-gray-950 dark:checked:border-brand-500 dark:checked:bg-brand-500"
                                />
                                <Check className="pointer-events-none absolute h-3.5 w-3.5 scale-75 text-white opacity-0 transition peer-checked:scale-100 peer-checked:opacity-100" />
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="flex flex-wrap items-center gap-2">
                                  <span className="break-all font-mono text-sm font-medium text-gray-900 dark:text-white/90">
                                    {permission.name}
                                  </span>
                                  {checked && (
                                    <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-700 dark:bg-brand-900/50 dark:text-brand-300">
                                      selected
                                    </span>
                                  )}
                                </span>
                                {permission.description && (
                                  <span className="mt-1 block text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                                    {permission.description}
                                  </span>
                                )}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <aside className="space-y-4 xl:sticky xl:top-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white/90">
                  Access summary
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Review before saving
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-gray-50 p-3 dark:bg-white/[0.035]">
                <p className="font-mono text-xl font-semibold text-gray-900 dark:text-white/90">
                  {selectedIds.length}
                </p>
                <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                  selected
                </p>
              </div>
              <div className="rounded-xl bg-gray-50 p-3 dark:bg-white/[0.035]">
                <p className="font-mono text-xl font-semibold text-gray-900 dark:text-white/90">
                  {groupsQuery.data?.length ?? 0}
                </p>
                <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                  modules
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-2.5 text-xs text-gray-600 dark:text-gray-400">
              <p className="flex items-start gap-2">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                {existingIds.length} currently assigned
              </p>
              <p className="flex items-start gap-2">
                <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                Saving replaces the complete permission list.
              </p>
            </div>

            <Button
              variant="primary"
              className="mt-6 w-full"
              disabled={!hasChanges}
              isLoading={saveMutation.isPending}
              onClick={() => void handleSave()}
            >
              <KeyRound className="h-4 w-4" />
              {isAdding ? 'Add Permissions' : 'Update Permissions'}
            </Button>
            {!hasChanges && (
              <p className="mt-2 text-center text-[11px] text-gray-400">
                No changes to save
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-brand-100 bg-brand-50/70 p-4 text-xs leading-relaxed text-brand-900 dark:border-brand-900/40 dark:bg-brand-950/20 dark:text-brand-200">
            <p className="font-semibold">Least-privilege tip</p>
            <p className="mt-1.5 opacity-80">
              Assign only the permissions required for this role's responsibilities.
              You can return here anytime to adjust access.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}