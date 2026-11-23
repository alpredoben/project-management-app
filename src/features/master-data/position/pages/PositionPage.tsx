import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  FolderKanban,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { Input } from '@/components/ui/FormControls';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/PageHeader';
import { useAppDispatch } from '@/store/hooks';
import { pushToast } from '@/store/slices/ui-slice';
import type { In_Position, T_SortOrder } from '@/types/api-type';
import { formatDate, slashed } from '@/shared/libs/helper';
import { positionApi } from '../api';
import {
  SchemaValidatePosition,
  type FormPayloadPosition,
} from '../schemas';
import { ROUTE_PATH_LIST } from '@/shared/constants';

export function PositionPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  // ─── Search & Filter State ───────────────────────────────────────────────
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState('name');
  const [orderBy, setOrderBy] = useState<T_SortOrder>('ASC');

  // ─── Action & Form State ─────────────────────────────────────────────────
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<In_Position | null>(null);
  const [deletingItem, setDeletingItem] = useState<In_Position | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  // ─── Query & Mutation ────────────────────────────────────────────────────
  const listQuery = positionApi.query.useFetchPaginationList({
    page,
    limit,
    search: debouncedSearch || undefined,
    sort_by: sortBy,
    order_by: orderBy,
  });

  const createMutation = positionApi.mutation.useCreate();
  const updateMutation = positionApi.mutation.useUpdate();
  const deleteMutation = positionApi.mutation.useDelete();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormPayloadPosition['Position']>({
    resolver: zodResolver(SchemaValidatePosition.position),
    defaultValues: { name: '' },
  });

  // ─── Form Handlers ───────────────────────────────────────────────────────
  const openCreateModal = () => {
    setEditingItem(null);
    reset({ name: '' });
    setIsFormOpen(true);
  };

  const openEditModal = (item: In_Position) => {
    setEditingItem(item);
    reset({
      name: item.name,
    });
    setIsFormOpen(true);
  };

  const onSubmit = async (values: FormPayloadPosition['Position']) => {
    try {
      if (editingItem) {
        const updated = await updateMutation.mutateAsync({
          id: editingItem.id,
          values,
        });
        dispatch(
          pushToast({
            title: 'Position updated',
            description: updated.name,
            variant: 'success',
          }),
        );
      } else {
        const created = await createMutation.mutateAsync(values);
        dispatch(
          pushToast({
            title: 'Position created',
            description: created.name,
            variant: 'success',
          }),
        );
      }
      setIsFormOpen(false);
    } catch (err) {
      dispatch(
        pushToast({
          title: 'Save failed',
          description:
            err instanceof Error ? err.message : 'Unable to save position.',
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
          title: 'Position deleted',
          description: serverMessage ?? deletingItem.name,
          variant: 'info',
        }),
      );
      setDeletingItem(null);
    } catch (err) {
      dispatch(
        pushToast({
          title: 'Delete failed',
          description:
            err instanceof Error
              ? err.message
              : 'Unable to delete position.',
          variant: 'error',
        }),
      );
    }
  };

  // ─── Table ───────────────────────────────────────────────────────────────
  const items = listQuery.data?.items ?? [];
  const pagination = listQuery.data?.pagination ?? null;

  const columns: DataTableColumn<In_Position>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (row) => (
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
            <FolderKanban className="h-4 w-4" />
          </span>
          <p className="font-mono text-sm font-semibold text-gray-900 dark:text-white/90">
            {row.name?.toUpperCase()}
          </p>
        </div>
      ),
    },
    {
      key: 'slug',
      header: 'Slug',
      render: (row) => (
        <p className="max-w-md truncate text-sm text-gray-600 dark:text-gray-400">
          {row.slug}
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
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(slashed(ROUTE_PATH_LIST.MASTER_DATA.POSITION_DETAIL(row.id)))}
            title="View detail"
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openEditModal(row)}
            title="Edit"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeletingItem(row)}
            title="Delete"
          >
            <Trash2 className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
          </Button>
        </div>
      ),
    },
  ];

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <PageHeader
        title="Position"
        description="Manage master data for position classifications."
        actions={
          <Button variant="primary" onClick={openCreateModal}>
            <Plus className="h-4 w-4" />
            Create Position
          </Button>
        }
      />

      <div className="space-y-4">
        <DataTable
          data={items}
          columns={columns}
          getRowKey={(row) => row.id}
          isLoading={listQuery.isLoading}
          error={listQuery.error}
          onRetry={() => void listQuery.refetch()}
          toolbarExtra={
            <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-center lg:justify-start lg:gap-4">
              {/* Search */}
              <div className="relative w-full shrink-0 lg:w-72">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="search"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search position..."
                  aria-label="Search position"
                  className="h-9 w-full rounded-lg border border-gray-200 bg-transparent pl-9 pr-3 text-xs text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                />
              </div>

              {/* Sort & Rows */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <label htmlFor="position-sort-by">Sort</label>
                <select
                  id="position-sort-by"
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    setPage(1);
                  }}
                  className="h-8 rounded-lg border border-gray-200 bg-white px-2 text-xs text-gray-800 focus:border-brand-300 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-white/90"
                >
                  <option value="name">Name</option>
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
                  className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 font-mono text-xs text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  <ArrowUpDown className="h-3 w-3" />
                  {orderBy}
                </button>

                <label htmlFor="position-limit">Rows</label>
                <select
                  id="position-limit"
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
          emptyTitle="No position defined"
          emptyAction={
            <Button variant="primary" size="sm" onClick={openCreateModal}>
              Create Position
            </Button>
          }
        />

        {/* Pagination */}
        {pagination && (
          <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800 dark:bg-white/[0.03]">
            <p className="text-xs tabular-nums text-gray-500 dark:text-gray-400">
              Page{' '}
              <span className="font-semibold text-gray-900 dark:text-white/90">
                {pagination.current_page}
              </span>{' '}
              of{' '}
              <span className="font-semibold text-gray-900 dark:text-white/90">
                {pagination.total_pages}
              </span>{' '}
              ·{' '}
              <span className="font-mono">{pagination.total_items}</span> items
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={
                  !pagination.has_previous_page || listQuery.isFetching
                }
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!pagination.has_next_page || listQuery.isFetching}
                onClick={() => setPage((prev) => prev + 1)}
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingItem ? 'Update Position' : 'Create Position'}
        description={
          editingItem
            ? `Update position "${editingItem.name}"`
            : 'Create a new position classification'
        }
        footer={
          <>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="position-form"
              variant="primary"
              isLoading={createMutation.isPending || updateMutation.isPending}
            >
              {editingItem ? 'Save Changes' : 'Create Position'}
            </Button>
          </>
        }
      >
        <form
          id="position-form"
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
        >
          <Input
            label="Name"
            placeholder="e.g. CLIENT"
            error={errors.name?.message}
            required
            {...register('name')}
          />
        </form>
      </Modal>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingItem)}
        onClose={() => setDeletingItem(null)}
        onConfirm={() => void handleConfirmDelete()}
        title="Delete Position"
        description={`Are you sure you want to delete the position "${deletingItem?.name ?? ''}"? This action cannot be undone.`}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
