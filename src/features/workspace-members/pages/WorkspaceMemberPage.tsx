import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  ArrowUpDown,
  Briefcase,
  CalendarClock,
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
import { Select } from '@/components/ui/FormControls';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/PageHeader';
import { useAppDispatch } from '@/store/hooks';
import { pushToast } from '@/store/slices/ui-slice';
import type { In_WorkspaceMember, T_SortOrder } from '@/types/api-type';
import { formatDate, getPublicUrlExpression, slashed } from '@/shared/libs/helper';
import { ROUTE_PATH_LIST } from '@/shared/constants';
import { workspaceMemberApi } from '../api';
import {
  SchemaValidateWorkspaceMember,
  type FormPayloadWorkspaceMember,
} from '../schemas';
import { workspaceApi } from '@/features/workspace/api';
import { userAccessApi } from '@/features/access-control/api/access-control-api';
import { positionApi } from '@/features/master-data/position/api';

// ─── Workspace Logo Preview Thumbnail ─────────────────────────────────────────

function WorkspaceLogoThumbnail({
  url,
  name,
}: {
  url?: string | null;
  name: string;
}) {
  const [imageError, setImageError] = useState(false);
  const fullUrl = url ? getPublicUrlExpression(url) : null;

  if (fullUrl && !imageError) {
    return (
      <img
        src={fullUrl}
        alt={name}
        onError={() => setImageError(true)}
        className="h-9 w-9 shrink-0 rounded-xl object-cover border border-gray-200/80 dark:border-gray-700/80 shadow-xs"
      />
    );
  }

  const initials =
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0] ?? '')
      .join('')
      .toUpperCase() || 'WS';

  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-linear-to-tr from-brand-600 to-indigo-500 text-xs font-bold text-white shadow-xs">
      {initials}
    </div>
  );
}

// ─── User Avatar Preview ──────────────────────────────────────────────────────

function UserAvatar({
  name,
  avatarUrl,
}: {
  name: string;
  avatarUrl?: string | null;
}) {
  const [imageError, setImageError] = useState(false);
  const fullUrl = avatarUrl ? getPublicUrlExpression(avatarUrl) : null;

  if (fullUrl && !imageError) {
    return (
      <img
        src={fullUrl}
        alt={name}
        onError={() => setImageError(true)}
        className="h-9 w-9 shrink-0 rounded-full object-cover ring-2 ring-brand-500/20"
      />
    );
  }

  const initials =
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0] ?? '')
      .join('')
      .toUpperCase() || 'U';

  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-linear-to-tr from-brand-500 to-purple-600 text-xs font-bold text-white shadow-xs">
      {initials}
    </div>
  );
}

// ─── Main WorkspaceMemberPage Component ───────────────────────────────────────

export function WorkspaceMemberPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  // ─── Search & Pagination State ──────────────────────────────────────────────
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState('user_id');
  const [orderBy, setOrderBy] = useState<T_SortOrder>('ASC');

  // ─── Modals State ───────────────────────────────────────────────────────────
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<In_WorkspaceMember | null>(null);
  const [deletingItem, setDeletingItem] = useState<In_WorkspaceMember | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  // ─── Queries & Mutations ────────────────────────────────────────────────────
  const listQuery = workspaceMemberApi.query.useFetchPaginationList({
    page,
    limit,
    search: debouncedSearch || undefined,
    sort_by: sortBy,
    order_by: orderBy,
  });

  const createMutation = workspaceMemberApi.mutation.useCreate();
  const updateMutation = workspaceMemberApi.mutation.useUpdate();
  const deleteMutation = workspaceMemberApi.mutation.useDelete();

  const totalPages = Math.max(1, listQuery.data?.pagination?.total_pages ?? 1);
  const totalRows = listQuery.data?.totalRows ?? 0;

  // Dropdown reference data
  const workspacesQuery = workspaceApi.query.useFetchPaginationList({ limit: 100 });
  const usersQuery = userAccessApi.query.useUsersList();
  const positionsQuery = positionApi.query.useFetchPaginationList({ limit: 100 });

  const workspaceOptions =
    workspacesQuery.data?.items.map((w) => ({
      value: w.id,
      label: w.name,
    })) ?? [];

  const userOptions =
    usersQuery.data?.map((u) => ({
      value: u.id,
      label: `${u.name}${u.email ? ` (${u.email})` : ''}`,
    })) ?? [];

  const positionOptions =
    positionsQuery.data?.items.map((p) => ({
      value: p.id,
      label: p.name,
    })) ?? [];

  // Form setup
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormPayloadWorkspaceMember['Member']>({
    resolver: zodResolver(SchemaValidateWorkspaceMember.member) as never,
    defaultValues: {
      workspace_id: '',
      user_id: '',
      position_id: '',
    },
  });

  const openCreateModal = () => {
    setEditingItem(null);
    reset({
      workspace_id: '',
      user_id: '',
      position_id: '',
    });
    setIsFormOpen(true);
  };

  const openEditModal = (item: In_WorkspaceMember) => {
    setEditingItem(item);
    reset({
      workspace_id: item.workspace_id ?? item.workspace?.id ?? '',
      user_id: item.user_id ?? item.user?.id ?? '',
      position_id: item.position_id ?? item.position?.id ?? '',
    });
    setIsFormOpen(true);
  };

  const onSubmit = async (values: FormPayloadWorkspaceMember['Member']) => {
    try {
      if (editingItem) {
        await updateMutation.mutateAsync({
          id: editingItem.id,
          values,
        });
        dispatch(
          pushToast({
            title: 'Workspace Member updated',
            description: 'Member assignment has been successfully updated.',
            variant: 'success',
          }),
        );
      } else {
        await createMutation.mutateAsync(values);
        dispatch(
          pushToast({
            title: 'Workspace Member created',
            description: 'New member has been assigned to the workspace.',
            variant: 'success',
          }),
        );
      }
      setIsFormOpen(false);
    } catch (err) {
      dispatch(
        pushToast({
          title: editingItem ? 'Failed to update member' : 'Failed to create member',
          description: err instanceof Error ? err.message : 'An error occurred',
          variant: 'error',
        }),
      );
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    try {
      await deleteMutation.mutateAsync(deletingItem.id);
      dispatch(
        pushToast({
          title: 'Member removed',
          description: 'The member has been removed from the workspace.',
          variant: 'success',
        }),
      );
      setDeletingItem(null);
    } catch (err) {
      dispatch(
        pushToast({
          title: 'Failed to delete member',
          description: err instanceof Error ? err.message : 'An error occurred',
          variant: 'error',
        }),
      );
    }
  };

  // ─── Table Columns ──────────────────────────────────────────────────────────
  const columns: DataTableColumn<In_WorkspaceMember>[] = [
    {
      key: 'workspace',
      header: 'Workspace',
      render: (item) => (
        <div className="flex items-center gap-3">
          <WorkspaceLogoThumbnail
            url={item.workspace?.logo_url}
            name={item.workspace?.name ?? 'Workspace'}
          />
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 dark:text-white truncate">
              {item.workspace?.name ?? '—'}
            </p>
            <p className="font-mono text-xs text-gray-400 dark:text-gray-500 truncate">
              {item.workspace?.slug ?? '—'}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'member',
      header: 'Member / User',
      render: (item) => (
        <div className="flex items-center gap-3">
          <UserAvatar
            name={item.user?.name ?? 'User'}
            avatarUrl={item.user?.avatar_url}
          />
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 dark:text-white truncate">
              {item.user?.name ?? '—'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {item.user?.email ?? item.user?.nip ?? 'No email'}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'position',
      header: 'Position',
      render: (item) => (
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-brand-200/80 bg-brand-50/80 px-2.5 py-1 text-xs font-semibold text-brand-700 dark:border-brand-800/80 dark:bg-brand-950/40 dark:text-brand-300">
          <Briefcase className="h-3 w-3" />
          {item.position?.name ?? 'Member'}
        </span>
      ),
    },
    {
      key: 'joined_at',
      header: 'Joined Date',
      render: (item) => (
        <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
          <CalendarClock className="h-3.5 w-3.5 text-gray-400" />
          <span>{formatDate(item.joined_at || item.created_at)}</span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (item) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() =>
              navigate(
                slashed(ROUTE_PATH_LIST.WORKSPACE.WORKSPACE_MEMBERS_DETAIL(item.id)),
              )
            }
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200 transition-colors cursor-pointer"
            title="View details"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => openEditModal(item)}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-900/30 dark:hover:text-brand-400 transition-colors cursor-pointer"
            title="Edit member"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setDeletingItem(item)}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400 transition-colors cursor-pointer"
            title="Remove member"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Workspace Members"
        description="Manage member assignments, workspace access, and organizational roles."
        actions={
          <Button onClick={openCreateModal} className="gap-2">
            <Plus className="h-4 w-4" />
            <span>Assign Member</span>
          </Button>
        }
      />

      {/* ─── Search, Filter, and Sort Bar ───────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search member or workspace..."
            aria-label="Search member or workspace"
            className="h-10 w-full rounded-xl border border-gray-200 bg-white pl-9.5 pr-4 text-xs font-medium text-gray-800 placeholder:text-gray-400 shadow-xs focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-gray-500"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Sort By Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setPage(1);
            }}
            aria-label="Sort by"
            className="h-10 rounded-xl border border-gray-200 bg-white px-3 text-xs font-medium text-gray-700 shadow-xs focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
          >
            <option value="user_id">Sort: User</option>
            <option value="workspace_id">Sort: Workspace</option>
            <option value="position_id">Sort: Position</option>
            <option value="joined_at">Sort: Joined Date</option>
            <option value="created_at">Sort: Created At</option>
            <option value="updated_at">Sort: Updated At</option>
          </select>

          {/* Order By Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOrderBy((prev) => (prev === 'ASC' ? 'DESC' : 'ASC'))}
            className="h-10 gap-1.5 px-3"
            title={`Order: ${orderBy}`}
          >
            <ArrowUpDown className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-xs font-semibold">{orderBy}</span>
          </Button>

          {/* Limit selector */}
          <select
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setPage(1);
            }}
            aria-label="Items per page"
            className="h-10 rounded-xl border border-gray-200 bg-white px-3 text-xs font-medium text-gray-700 shadow-xs focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
          >
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
          </select>
        </div>
      </div>

      {/* ─── DataTable + Pagination ─────────────────────────────────────────── */}
      <div className="space-y-3">
        <DataTable<In_WorkspaceMember>
          columns={columns}
          data={listQuery.data?.items ?? []}
          getRowKey={(item) => item.id}
          isLoading={listQuery.isLoading}
          error={(listQuery.error as Error | null) ?? null}
          onRetry={() => void listQuery.refetch()}
          emptyTitle="No workspace members found"
          emptyDescription="Click 'Assign Member' to add one."
        />

        {/* Pagination Bar */}
        <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white px-6 py-4 shadow-xs sm:flex-row sm:items-center sm:justify-between dark:border-gray-800 dark:bg-gray-900">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Showing Page{' '}
            <span className="font-semibold text-gray-900 dark:text-white">{page}</span> of{' '}
            <span className="font-semibold text-gray-900 dark:text-white">{totalPages}</span>{' '}
            ({totalRows} total items)
          </p>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || listQuery.isLoading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="h-8 gap-1 px-2.5"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Previous</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages || listQuery.isLoading}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="h-8 gap-1 px-2.5"
            >
              <span>Next</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* ─── Create / Edit Member Modal ─────────────────────────────────────── */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingItem ? 'Edit Workspace Member' : 'Assign Workspace Member'}
        description={
          editingItem
            ? 'Update workspace member position or association.'
            : 'Select a user, workspace, and their designated position.'
        }
        size="md"
        footer={
          <>
            <Button
              variant="outline"
              type="button"
              onClick={() => setIsFormOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="workspace-member-form"
              isLoading={createMutation.isPending || updateMutation.isPending}
            >
              {editingItem ? 'Save Changes' : 'Assign Member'}
            </Button>
          </>
        }
      >
        <form
          id="workspace-member-form"
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
        >
          <Select
            label="Workspace"
            placeholder="Select a workspace"
            required
            options={workspaceOptions}
            error={errors.workspace_id?.message}
            {...register('workspace_id')}
          />

          <Select
            label="User (Member)"
            placeholder="Select a user"
            required
            options={userOptions}
            error={errors.user_id?.message}
            {...register('user_id')}
          />

          <Select
            label="Position / Role"
            placeholder="Select a position"
            required
            options={positionOptions}
            error={errors.position_id?.message}
            {...register('position_id')}
          />
        </form>
      </Modal>

      {/* ─── Delete Confirmation Dialog ─────────────────────────────────────── */}
      <ConfirmDialog
        isOpen={Boolean(deletingItem)}
        onClose={() => setDeletingItem(null)}
        onConfirm={() => void handleDelete()}
        title="Remove Member from Workspace"
        description={`Are you sure you want to remove ${
          deletingItem?.user?.name ?? 'this user'
        } from "${deletingItem?.workspace?.name ?? 'this workspace'}"?`}
        confirmLabel="Remove Member"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

export default WorkspaceMemberPage;