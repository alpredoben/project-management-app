import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
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
import type { In_Permission, T_SortOrder } from '@/types/api-type';
import {
  permissionAccessApi
} from '../api/access-control-api';
import {
  SchemaValidateAccess,
  type FormPayloadAccess
} from '../schemas/access-control-schema';
import { formatDate } from '@/shared/libs/helper';

export function PermissionsPage() {
  const dispatch = useAppDispatch();

  // Search
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Filter
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState('name');
  const [orderBy, setOrderBy] = useState<T_SortOrder>('ASC');


  // Action & Form
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<In_Permission | null>(null);
  const [inspectId, setInspectId] = useState<string | null>(null);
  const [deletingItem, setDeletingItem] = useState<In_Permission | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [searchInput]);


  // Query & Mutation
  const permissionsQuery = permissionAccessApi.query.usePermissionsList({
    page,
    limit,
    search: debouncedSearch || undefined,
    sort_by: sortBy,
    order_by: orderBy,
  });
  const createMutation = permissionAccessApi.mutation.useCreatePermission();
  const updateMutation = permissionAccessApi.mutation.useUpdatePermission();
  const deleteMutation = permissionAccessApi.mutation.useDeletePermission();
  const findQuery = permissionAccessApi.query.usePermissionFind(inspectId);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormPayloadAccess['Permission']>({
    resolver: zodResolver(SchemaValidateAccess.permission),
    defaultValues: { name: '', module: '', description: '' },
  });

  const openCreateModal = () => {
    setEditingItem(null);
    reset({ name: '', module: '', description: '' });
    setIsFormOpen(true);
  };

  const openEditModal = (item: In_Permission) => {
    setEditingItem(item);
    reset({
      name: item.name,
      module: item.module,
      description: item.description ?? '',
    });
    setIsFormOpen(true);
  };

  const onSubmit = async (values: FormPayloadAccess['Permission']) => {
    try {
      if (editingItem) {
        const updated = await updateMutation.mutateAsync({ id: editingItem.id, values });
        dispatch(
          pushToast({
            title: 'Permission updated',
            description: `${updated.module} · ${updated.name}`,
            variant: 'success',
          }),
        );
      } else {
        const created = await createMutation.mutateAsync(values);
        dispatch(
          pushToast({
            title: 'Permission created',
            description: `${created.module} · ${created.name}`,
            variant: 'success',
          }),
        );
      }
      setIsFormOpen(false);
    } catch (err) {
      dispatch(
        pushToast({
          title: 'Save failed',
          description: err instanceof Error ? err.message : 'Unable to save permission.',
          variant: 'error',
        }),
      );
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    try {
      const serverMessage = await deleteMutation.mutateAsync(deletingItem.id);
      dispatch(
        pushToast({
          title: 'Permission deleted',
          description: serverMessage ?? deletingItem.name,
          variant: 'info',
        }),
      );
      setDeletingItem(null);
    } catch (err) {
      dispatch(
        pushToast({
          title: 'Delete failed',
          description: err instanceof Error ? err.message : 'Unable to delete permission.',
          variant: 'error',
        }),
      );
    }
  };

  const permissions = permissionsQuery.data?.items ?? [];
  const pagination = permissionsQuery.data?.pagination ?? null;

  const columns: DataTableColumn<In_Permission>[] = [
    {
      key: 'name',
      header: 'Permission',
      render: (row) => (
        <p className="font-mono text-sm font-medium text-gray-900 dark:text-white/90">
          {row.name}
        </p>
      ),
    },
    {
      key: 'module',
      header: 'Module',
      render: (row) => (
        <p className="font-mono text-sm font-medium text-gray-900 dark:text-white/90">
          {row.module}
        </p>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      render: (row) => (
        <p className="max-w-md truncate text-sm font-medium text-gray-900 dark:text-white/90">
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
          {formatDate(new Date(row.updated_at).toLocaleString())}
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
          <Button variant="ghost" size="sm" onClick={() => openEditModal(row)} title="Edit">
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setDeletingItem(row)} title="Delete">
            <Trash2 className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Permissions"
        description="Authorization permissions at the module level"
        actions={
          <Button variant="primary" onClick={openCreateModal}>
            <Plus className="h-4 w-4" />
            Create Permission
          </Button>
        }
      />

      <div className="space-y">
        <DataTable
          data={permissions}
          columns={columns}
          getRowKey={(row) => row.id}
          isLoading={permissionsQuery.isLoading}
          error={permissionsQuery.error}
          onRetry={() => void permissionsQuery.refetch()}
          toolbarExtra={
            <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-center lg:justify-start lg:gap-4">
              <div className="relative w-full shrink-0 lg:w-72">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="search"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search permissions..."
                  aria-label="Search permissions"
                  className="h-9 w-full rounded-lg border border-gray-200 bg-transparent pl-9 pr-3 text-xs text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <label htmlFor="permissions-sort-by">Sort</label>
                <select
                  id="permissions-sort-by"
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    setPage(1);
                  }}
                  className="h-8 rounded-lg border border-gray-200 bg-white px-2 text-xs text-gray-800 focus:border-brand-300 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-white/90"
                >
                  <option value="name">Name</option>
                  <option value="module">Module</option>
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

                <label htmlFor="permissions-limit">Rows</label>
                <select
                  id="permissions-limit"
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                  className="h-8 rounded-lg border border-gray-200 bg-white px-2 text-xs text-gray-800 focus:border-brand-300 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-white/90"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>
          }
          emptyTitle="No permissions defined"
          emptyAction={
            <Button variant="primary" size="sm" onClick={openCreateModal}>
              Create Permission
            </Button>
          }
        />

        {pagination && (
          <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800 dark:bg-white/[0.03]">
            <p className="text-xs text-gray-500 tabular-nums dark:text-gray-400">
              Page{' '}
              <span className="font-semibold text-gray-900 dark:text-white/90">
                {pagination.current_page}
              </span>{' '}
              of{' '}
              <span className="font-semibold text-gray-900 dark:text-white/90">
                {pagination.total_pages}
              </span>{' '}
              · <span className="font-mono">{pagination.total_items}</span> items
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!pagination.has_previous_page || permissionsQuery.isFetching}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!pagination.has_next_page || permissionsQuery.isFetching}
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
        title={editingItem ? 'Update Permission' : 'Create Permission'}
        description={
          editingItem
            ? `Update permission "${editingItem.name}"`
            : 'Create new permission'
        }
        footer={
          <>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="permission-form"
              variant="primary"
              isLoading={createMutation.isPending || updateMutation.isPending}
            >
              {editingItem ? 'Save Changes' : 'Create Permission'}
            </Button>
          </>
        }
      >
        <form id="permission-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Permission name"
            placeholder="role:created"
            error={errors.name?.message}
            required
            {...register('name')}
          />
          <Input
            label="Module"
            placeholder="Reporting"
            error={errors.module?.message}
            required
            {...register('module')}
          />
          <Textarea
            label="Description"
            placeholder="Create Reporting"
            error={errors.description?.message}
            {...register('description')}
          />
        </form>
      </Modal>

      <RecordInspectorDrawer
        isOpen={Boolean(inspectId)}
        onClose={() => setInspectId(null)}
        title="Permission Detail"
        isLoading={findQuery.isLoading}
        error={findQuery.error}
        record={findQuery.data}
      />

      <ConfirmDialog
        isOpen={Boolean(deletingItem)}
        onClose={() => setDeletingItem(null)}
        onConfirm={() => void handleConfirmDelete()}
        title="Delete Permission"
        description={`Are you sure you want to delete the "${deletingItem?.name ?? ''}" permission?`}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
