import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { useAppDispatch } from '@/store/hooks';
import { pushToast } from '@/store/slices/ui-slice';
import type { T_SortOrder } from '@/types/api-type';
import { formatDate } from '@/shared/libs/helper';
import { projectStatusApi, type In_ProjectStatus } from '../api';
import {
  SchemaValidateProjectStatus,
  type FormPayloadProjectStatus,
} from '../schemas';

// Quick color presets for user convenience
const PRESET_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#EC4899', // Pink
  '#64748B', // Slate
];

export function ProjectStatusPage() {
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
  const [editingItem, setEditingItem] = useState<In_ProjectStatus | null>(null);
  const [deletingItem, setDeletingItem] = useState<In_ProjectStatus | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  // ─── Query & Mutation ────────────────────────────────────────────────────
  const listQuery = projectStatusApi.query.useProjectStatusList({
    page,
    limit,
    search: debouncedSearch || undefined,
    sort_by: sortBy,
    order_by: orderBy,
  });

  const createMutation = projectStatusApi.mutation.useCreateProjectStatus();
  const updateMutation = projectStatusApi.mutation.useUpdateProjectStatus();
  const deleteMutation = projectStatusApi.mutation.useDeleteProjectStatus();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormPayloadProjectStatus['ProjectStatus']>({
    resolver: zodResolver(SchemaValidateProjectStatus.projectStatus),
    defaultValues: {
      name: '',
      color_code: '#3B82F6',
      description: '',
      sequence_order: 1,
    },
  });

  const currentColor = watch('color_code') || '#3B82F6';

  // ─── Form Handlers ───────────────────────────────────────────────────────
  const openCreateModal = () => {
    setEditingItem(null);
    reset({
      name: '',
      color_code: '#3B82F6',
      description: '',
      sequence_order: (listQuery.data?.totalRows ?? 0) + 1,
    });
    setIsFormOpen(true);
  };

  const openEditModal = (item: In_ProjectStatus) => {
    setEditingItem(item);
    reset({
      name: item.name,
      color_code: item.color_code || '#3B82F6',
      description: item.description ?? '',
      sequence_order: item.sequence_order,
    });
    setIsFormOpen(true);
  };

  const onSubmit = async (values: FormPayloadProjectStatus['ProjectStatus']) => {
    try {
      if (editingItem) {
        const updated = await updateMutation.mutateAsync({
          id: editingItem.id,
          values,
        });
        dispatch(
          pushToast({
            title: 'Project Status updated',
            description: updated.name,
            variant: 'success',
          }),
        );
      } else {
        const created = await createMutation.mutateAsync(values);
        dispatch(
          pushToast({
            title: 'Project Status created',
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
            err instanceof Error ? err.message : 'Unable to save project status.',
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
          title: 'Project Status deleted',
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
              : 'Unable to delete project status.',
          variant: 'error',
        }),
      );
    }
  };

  // ─── Table Columns ────────────────────────────────────────────────────────
  const items = listQuery.data?.items ?? [];
  const pagination = listQuery.data?.pagination ?? null;

  const columns: DataTableColumn<In_ProjectStatus>[] = [
    {
      key: 'sequence_order',
      header: 'No. Order',
      render: (row) => (
        <span className="inline-flex items-center justify-center h-6 min-w-[28px] px-1.5 rounded-md bg-gray-100 text-gray-700 text-xs font-mono font-bold dark:bg-gray-800 dark:text-gray-300">
          #{row.sequence_order}
        </span>
      ),
    },
    {
      key: 'name',
      header: 'Status Name',
      render: (row) => {
        const hasColor = Boolean(row.color_code && row.color_code.trim());
        return (
          <div className="flex items-center gap-2.5">
            <span
              className="h-3 w-3 rounded-full shrink-0 ring-2 ring-gray-200 dark:ring-gray-700"
              style={{ backgroundColor: hasColor ? row.color_code : '#94A3B8' }}
              title={row.color_code || 'No color specified'}
            />
            <span className="font-mono text-sm font-semibold text-gray-900 dark:text-white/90">
              {row.name}
            </span>
          </div>
        );
      },
    },
    {
      key: 'color_code',
      header: 'Color',
      render: (row) => {
        const hasColor = Boolean(row.color_code && row.color_code.trim());
        if (!hasColor) {
          return <span className="text-xs text-gray-400">—</span>;
        }
        return (
          <div className="flex items-center gap-2 font-mono text-xs">
            <span
              className="h-4 w-4 rounded-md border border-black/10 dark:border-white/20 shadow-xs"
              style={{ backgroundColor: row.color_code }}
            />
            <span className="text-gray-600 dark:text-gray-400">{row.color_code}</span>
          </div>
        );
      },
    },
    {
      key: 'description',
      header: 'Description',
      render: (row) => (
        <p className="max-w-md truncate text-sm text-gray-600 dark:text-gray-400">
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
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/admin/project-status/${row.id}`)}
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
        title="Project Status"
        description="Configure project lifecycle workflow states, colors, and order sequences."
        actions={
          <Button variant="primary" onClick={openCreateModal}>
            <Plus className="h-4 w-4" />
            Create Project Status
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
              {/* Search input */}
              <div className="relative w-full shrink-0 lg:w-72">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="search"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search project status..."
                  aria-label="Search project status"
                  className="h-9 w-full rounded-lg border border-gray-200 bg-transparent pl-9 pr-3 text-xs text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                />
              </div>

              {/* Sort By Dropdown - EXACT specification */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <label htmlFor="project-status-sort-by">Sort</label>
                <select
                  id="project-status-sort-by"
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    setPage(1);
                  }}
                  className="h-8 rounded-lg border border-gray-200 bg-white px-2 text-xs text-gray-800 focus:border-brand-300 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-white/90 cursor-pointer"
                >
                  <option value="name">Name</option>
                  <option value="color_code">Color</option>
                  <option value="description">Description</option>
                  <option value="sequence_order">No. Order</option>
                  <option value="updated_at">Updated At</option>
                </select>

                {/* Sort Order Toggle Button */}
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

                {/* Rows per page */}
                <label htmlFor="project-status-limit">Rows</label>
                <select
                  id="project-status-limit"
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                  className="h-8 rounded-lg border border-gray-200 bg-white px-2 text-xs text-gray-800 focus:border-brand-300 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-white/90 cursor-pointer"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>

              </div>
            </div>
          }
          emptyTitle="No project status defined"
          emptyAction={
            <Button variant="primary" size="sm" onClick={openCreateModal}>
              Create Project Status
            </Button>
          }
        />

        {/* Pagination bar */}
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
                disabled={!pagination.has_previous_page || listQuery.isFetching}
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
        title={editingItem ? 'Update Project Status' : 'Create Project Status'}
        description={
          editingItem
            ? `Update status definition for "${editingItem.name}"`
            : 'Add a new project lifecycle status'
        }
        footer={
          <>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="project-status-form"
              variant="primary"
              isLoading={createMutation.isPending || updateMutation.isPending}
            >
              {editingItem ? 'Save Changes' : 'Create Status'}
            </Button>
          </>
        }
      >
        <form
          id="project-status-form"
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
        >
          <Input
            label="Status Name"
            placeholder="e.g. IN_PROGRESS, COMPLETED"
            error={errors.name?.message}
            required
            {...register('name')}
          />

          {/* Color Code Field with Color Picker & Presets */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
              Color Code
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={currentColor.startsWith('#') ? currentColor : '#3B82F6'}
                onChange={(e) => setValue('color_code', e.target.value.toUpperCase())}
                className="h-10 w-12 cursor-pointer rounded-lg border border-gray-300 p-1 dark:border-gray-700 bg-transparent"
                title="Choose color"
              />
              <input
                type="text"
                placeholder="#3B82F6"
                className="h-10 flex-1 rounded-lg border border-gray-300 bg-white px-3.5 text-sm font-mono text-gray-900 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                {...register('color_code')}
              />
            </div>
            {errors.color_code && (
              <p className="text-xs font-medium text-red-600 dark:text-red-400">
                {errors.color_code.message}
              </p>
            )}

            {/* Quick color preset chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] uppercase font-bold text-gray-400 mr-1">Presets:</span>
              {PRESET_COLORS.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => setValue('color_code', hex)}
                  className="h-5 w-5 rounded-full border border-black/10 dark:border-white/20 transition-transform hover:scale-110 cursor-pointer shadow-xs"
                  style={{ backgroundColor: hex }}
                  title={hex}
                />
              ))}
            </div>
          </div>

          {/* Sequence Order */}
          <Input
            label="Sequence Order (No. Order)"
            type="number"
            min={0}
            placeholder="e.g. 1"
            error={errors.sequence_order?.message}
            required
            hint="Defines the logical sequence of this status in the project workflow pipeline"
            {...register('sequence_order')}
          />

          {/* Description */}
          <Textarea
            label="Description"
            placeholder="Detailed description of what this status represents"
            error={errors.description?.message}
            required
            {...register('description')}
          />
        </form>
      </Modal>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingItem)}
        onClose={() => setDeletingItem(null)}
        onConfirm={() => void handleConfirmDelete()}
        title="Delete Project Status"
        description={`Are you sure you want to delete the status "${deletingItem?.name ?? ''}"? Projects currently using this status may be affected.`}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
