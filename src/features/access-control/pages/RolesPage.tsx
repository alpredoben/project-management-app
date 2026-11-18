import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  KeyRound,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { Input, Textarea } from '@/components/ui/FormControls';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/PageHeader';
import { RecordInspectorDrawer } from '@/components/ui/RecordInspectorDrawer';
import { useAppDispatch } from '@/store/hooks';
import { pushToast } from '@/store/slices/ui-slice';
import type { In_Role, T_SortOrder } from '@/types/api-type';
import {roleAccessApi, permissionAccessApi} from '../api/access-control-api';
import { SchemaValidateAccess, type FormPayloadAccess } from '../schemas/access-control-schema';

export function RolesPage() {
  const dispatch = useAppDispatch();

  // Search
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [sortBy, setSortBy] = useState('name');
  const [orderBy, setOrderBy] = useState<T_SortOrder>('ASC');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<In_Role | null>(null);
  const [inspectId, setInspectId] = useState<string | null>(null);
  const [deletingRole, setDeletingRole] = useState<In_Role | null>(null);
  const [permTargetRole, setPermTargetRole] = useState<In_Role | null>(null);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const rolesQuery = roleAccessApi.query.useRolesList({
    page,
    limit: perPage,
    search: debouncedSearch || undefined,
    sort_by: sortBy,
    order_by: orderBy,
  });

  const permissionsQuery = permissionAccessApi.query.usePermissionsList({
    page: 1,
    limit: 200,
    sort_by: 'name',
    order_by: 'ASC',
  });

  // Query and Mutation
  const createMutation = roleAccessApi.mutation.useCreateRole();
  const updateMutation = roleAccessApi.mutation.useUpdateRole();
  const deleteMutation = roleAccessApi.mutation.useDeleteRole();
  const insertPermsMutation = roleAccessApi.mutation.useInsertRolePermissions();

  const findQuery = roleAccessApi.query.useRoleFind(inspectId);
  const permRoleDetailQuery = roleAccessApi.query.useRoleFind(permTargetRole?.id ?? null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormPayloadAccess['Role']>({
    resolver: zodResolver(SchemaValidateAccess.role),
    defaultValues: { name: '', description: '' },
  });

  const openCreateModal = () => {
    setEditingRole(null);
    reset({ name: '', description: '' });
    setIsFormOpen(true);
  };

  const openEditModal = (role: In_Role) => {
    setEditingRole(role);
    reset({
      name: role.name,
      description: role.description ?? '',
    });
    setIsFormOpen(true);
  };

  const openPermsModal = (role: In_Role) => {
    setSelectedPermissionIds([]);
    setPermTargetRole(role);
  };

  const onSubmit = async (values: FormPayloadAccess['Role']) => {
    try {
      if (editingRole) {
        const updated = await updateMutation.mutateAsync({ id: editingRole.id, values });
        dispatch(
          pushToast({
            title: 'Role updated',
            description: `${updated.name} (${updated.slug})`,
            variant: 'success',
          }),
        );
      } else {
        const created = await createMutation.mutateAsync(values);
        dispatch(
          pushToast({
            title: 'Role created',
            description: `${created.name} (${created.slug})`,
            variant: 'success',
          }),
        );
      }
      setIsFormOpen(false);
    } catch (err) {
      dispatch(
        pushToast({
          title: 'Save failed',
          description: err instanceof Error ? err.message : 'Unable to save role.',
          variant: 'error',
        }),
      );
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingRole) return;
    try {
      const serverMessage = await deleteMutation.mutateAsync(deletingRole.id);
      dispatch(
        pushToast({
          title: 'Role deleted',
          description: serverMessage ?? deletingRole.name,
          variant: 'info',
        }),
      );
      setDeletingRole(null);
    } catch (err) {
      dispatch(
        pushToast({
          title: 'Delete failed',
          description: err instanceof Error ? err.message : 'Unable to delete role.',
          variant: 'error',
        }),
      );
    }
  };

  const handleSavePermissions = async () => {
    if (!permTargetRole) return;
    try {
      const updated = await insertPermsMutation.mutateAsync({
        id: permTargetRole.id,
        permissionIds: selectedPermissionIds,
      });
      dispatch(
        pushToast({
          title: 'Permissions updated',
          description: `Mapped ${updated.permissions.length} permissions to ${updated.name}.`,
          variant: 'success',
        }),
      );
      setPermTargetRole(null);
    } catch (err) {
      dispatch(
        pushToast({
          title: 'Permission update failed',
          description: err instanceof Error ? err.message : 'Unable to assign permissions.',
          variant: 'error',
        }),
      );
    }
  };

  const togglePermission = (id: string) => {
    setSelectedPermissionIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const roles = rolesQuery.data?.items ?? [];
  const pagination = rolesQuery.data?.pagination ?? null;

  const columns: DataTableColumn<In_Role>[] = [
    {
      key: 'name',
      header: 'Role',
      render: (row) => (
        <div>
          <p className="font-mono text-gray-900 dark:text-white/90">
          {row.name}
          </p>
        </div>
      ),
    },
    {
      key: 'slug',
      header: 'Role',
      render: (row) => (
        <div>
          <p className="font-mono text-xs text-gray-500 dark:text-gray-400">
            {row.slug}
          </p>
        </div>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      render: (row) => (
        <p className="max-w-md truncate text-xs text-gray-600 dark:text-gray-300">
          {row.description ?? '—'}
        </p>
      ),
    },
    {
      key: 'updated_at',
      header: 'Updated At',
      align: 'right',
      render: (row) => (
        <span className="font-mono text-xs tabular-nums text-gray-500 dark:text-gray-400">
          {new Date(row.updated_at).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="inline-flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => setInspectId(row.id)} title="Find by ID">
            <Eye className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openPermsModal(row)}
            title="Insert permissions"
          >
            <KeyRound className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => openEditModal(row)} title="Edit role">
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setDeletingRole(row)} title="Delete role">
            <Trash2 className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Roles"
        description="Configure RBAC role definitions and assign granular capability permissions."
        apiPrefix="/api/v1/role · list · create · find/:id · update/:id · delete/:id · :id/insert-permissions"
        actions={
          <Button variant="primary" onClick={openCreateModal}>
            <Plus className="h-4 w-4" />
            Create Role
          </Button>
        }
      />

      <div className="space-y-4">
        <DataTable
          data={roles}
          columns={columns}
          getRowKey={(row) => row.id}
          isLoading={rolesQuery.isLoading}
          error={rolesQuery.error}
          onRetry={() => void rolesQuery.refetch()}
          toolbarExtra={
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full sm:w-64">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="search"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search roles..."
                  aria-label="Search roles"
                  className="h-9 w-full rounded-lg border border-gray-200 bg-transparent pl-9 pr-3 text-xs text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                />
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <label htmlFor="roles-sort-by">Sort</label>
                <select
                  id="roles-sort-by"
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    setPage(1);
                  }}
                  className="h-8 rounded-lg border border-gray-200 bg-white px-2 text-xs text-gray-800 focus:border-brand-300 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-white/90"
                >
                  <option value="name">Name</option>
                  <option value="slug">Description</option>
                  <option value="description">Description</option>
                  <option value="created_at">Created</option>
                  <option value="updated_at">Updated</option>
                </select>

                <button
                  type="button"
                  onClick={() => {
                    setOrderBy((prev) => (prev === 'ASC' ? 'DESC' : 'ASC'));
                    setPage(1);
                  }}
                  aria-label={`Sort order ${orderBy}`}
                  className="inline-flex h-8 items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 text-xs font-mono text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 cursor-pointer"
                >
                  <ArrowUpDown className="h-3 w-3" />
                  {orderBy}
                </button>


                <label htmlFor="roles-per-page">Rows</label>
                <select
                  id="roles-per-page"
                  value={perPage}
                  onChange={(e) => {
                    setPerPage(Number(e.target.value));
                    setPage(1);
                  }}
                  className="h-8 rounded-lg border border-gray-200 bg-white px-2 text-xs text-gray-800 focus:border-brand-300 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-white/90"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
                <span className="font-mono tabular-nums">
                  {rolesQuery.data?.totalRows ?? roles.length} total
                </span>
              </div>
            </div>
          }
          emptyTitle="No roles configured"
          emptyAction={
            <Button variant="primary" size="sm" onClick={openCreateModal}>
              Create Role
            </Button>
          }
        />

        {pagination && (
          <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800 dark:bg-white/[0.03]">
            <p className="text-xs text-gray-500 tabular-nums dark:text-gray-400">
              Page <span className="font-semibold text-gray-900 dark:text-white/90">{pagination.current_page}</span> of{' '}
              <span className="font-semibold text-gray-900 dark:text-white/90">{pagination.total_pages}</span> ·{' '}
              <span className="font-mono">{pagination.total_items}</span> items
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!pagination.has_previous_page || rolesQuery.isFetching}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!pagination.has_next_page || rolesQuery.isFetching}
                onClick={() => setPage((prev) => prev + 1)}
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingRole ? 'Update Role' : 'Create Role'}
        description={
          editingRole
            ? `PUT /api/v1/role/update/${editingRole.id}`
            : 'POST /api/v1/role/create'
        }
        footer={
          <>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="role-form"
              variant="primary"
              isLoading={createMutation.isPending || updateMutation.isPending}
            >
              {editingRole ? 'Save Changes' : 'Create Role'}
            </Button>
          </>
        }
      >
        <form id="role-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Role name"
            placeholder="Viewer"
            error={errors.name?.message}
            hint={
              editingRole
                ? `Current slug: ${editingRole.slug} (automatically regenerated by API on name change)`
                : 'Slug is automatically generated by the backend from role name'
            }
            required
            {...register('name')}
          />
          <Textarea
            label="Description"
            placeholder="This is a viewer"
            error={errors.description?.message}
            {...register('description')}
          />
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(permTargetRole)}
        onClose={() => setPermTargetRole(null)}
        title={`Insert Permissions — ${permTargetRole?.name ?? ''}`}
        description={
          permTargetRole ? `PUT /api/v1/role/${permTargetRole.id}/insert-permissions` : ''
        }
        footer={
          <>
            <Button variant="outline" onClick={() => setPermTargetRole(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => void handleSavePermissions()}
              disabled={permRoleDetailQuery.isLoading}
              isLoading={insertPermsMutation.isPending}
            >
              Save Permissions ({selectedPermissionIds.length})
            </Button>
          </>
        }
      >
        {permRoleDetailQuery.isLoading ? (
          <div className="space-y-2.5">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="h-14 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
            ))}
          </div>
        ) : permRoleDetailQuery.error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
            <p className="font-medium">Failed to load current role permissions</p>
            <p className="mt-1">{permRoleDetailQuery.error.message}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => void permRoleDetailQuery.refetch()}
            >
              Retry
            </Button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {(permissionsQuery.data?.items ?? []).map((perm) => (
              <label
                key={perm.id}
                className="flex items-start gap-3 rounded-xl border border-gray-200 p-3 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/[0.03] cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedPermissionIds.includes(perm.id)}
                  onChange={() => togglePermission(perm.id)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                />
                <div>
                  <p className="font-mono text-sm font-medium text-gray-900 dark:text-white/90">
                    {perm.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {perm.module} · {perm.description ?? '—'}
                  </p>
                </div>
              </label>
            ))}
          </div>
        )}
      </Modal>

      <RecordInspectorDrawer
        isOpen={Boolean(inspectId)}
        onClose={() => setInspectId(null)}
        title="Role Record Detail"
        endpoint={inspectId ? `GET /api/v1/role/find/${inspectId}` : ''}
        isLoading={findQuery.isLoading}
        error={findQuery.error}
        record={findQuery.data}
      />

      <ConfirmDialog
        isOpen={Boolean(deletingRole)}
        onClose={() => setDeletingRole(null)}
        onConfirm={() => void handleConfirmDelete()}
        title="Delete Role"
        description={`Delete role "${deletingRole?.name ?? ''}" via DELETE /api/v1/role/delete/${deletingRole?.id ?? ''}?`}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
