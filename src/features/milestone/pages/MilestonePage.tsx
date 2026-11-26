import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import {
  ArrowRight,
  ArrowUpDown,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Flag,
  FolderKanban,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { DropdownSearch } from '@/components/ui/DropdownSearch';
import { Input } from '@/components/ui/FormControls';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/PageHeader';
import { useAppDispatch } from '@/store/hooks';
import { pushToast } from '@/store/slices/ui-slice';
import type { In_Milestone, T_SortOrder } from '@/types/api-type';
import {slashed } from '@/shared/libs/helper';
import { cn } from '@/shared/libs/cn';
import { ROUTE_PATH_LIST } from '@/shared/constants';
import { milestoneApi } from '../api';
import {
  SchemaValidateMilestone,
  type FormPayloadMilestone,
} from '../schemas';
import { projectApi } from '@/features/projects/api';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function stripHtml(html?: string | null): string {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

// ─── Milestone Status Badge ───────────────────────────────────────────────────

export function MilestoneStatusBadge({ status }: { status?: string | null }) {
  const norm = (status ?? 'open').toLowerCase();

  if (norm === 'finish' || norm === 'completed' || norm === 'closed') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50/80 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 shadow-2xs dark:border-emerald-800/80 dark:bg-emerald-950/40 dark:text-emerald-300">
        <CheckCircle2 className="h-3.5 w-3.5" />
        <span className="capitalize">Finished</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200/80 bg-sky-50/80 px-2.5 py-0.5 text-xs font-semibold text-sky-700 shadow-2xs dark:border-sky-800/80 dark:bg-sky-950/40 dark:text-sky-300">
      <span className="h-1.5 w-1.5 rounded-full bg-sky-500 animate-pulse" />
      <span className="capitalize">Open</span>
    </span>
  );
}

const MILESTONE_STATUS_OPTIONS = [
  { value: 'open', label: 'Open', subLabel: 'Active milestone target', dotColor: '#0ea5e9' },
  { value: 'finish', label: 'Finished', subLabel: 'Milestone target achieved', dotColor: '#10b981' },
] as const;

// ─── Main MilestonePage Component ─────────────────────────────────────────────

export function MilestonePage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  // ─── Search & Pagination State ──────────────────────────────────────────────
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState('title');
  const [orderBy, setOrderBy] = useState<T_SortOrder>('ASC');

  // ─── Filter States ──────────────────────────────────────────────────────────
  const [projectFilter, setProjectFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // ─── Modals State ───────────────────────────────────────────────────────────
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<In_Milestone | null>(null);
  const [deletingItem, setDeletingItem] = useState<In_Milestone | null>(null);
  const [statusChangeItem, setStatusChangeItem] = useState<In_Milestone | null>(null);
  const [selectedNewStatus, setSelectedNewStatus] = useState<'open' | 'finish' | string>('open');

  // Debounce search
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  // ─── Projects Query (for project_id dropdown-search) ────────────────────────
  const projectsQuery = projectApi.query.useFetchPaginationList({ limit: 100 });

  const projectOptions = useMemo(
    () =>
      projectsQuery.data?.items.map((p) => ({
        value: p.id,
        label: p.name,
        subLabel: p.key || (p.workspace?.name ? `Workspace: ${p.workspace.name}` : undefined),
      })) ?? [],
    [projectsQuery.data?.items],
  );

  // ─── Milestone Query & Mutations ────────────────────────────────────────────
  const listQuery = milestoneApi.query.useFetchPaginationList({
    page,
    limit,
    search: debouncedSearch || undefined,
    sort_by: sortBy,
    order_by: orderBy,
    project_id: projectFilter || undefined,
    status: statusFilter || undefined,
  });

  const createMutation = milestoneApi.mutation.useCreate();
  const updateMutation = milestoneApi.mutation.useUpdate();
  const deleteMutation = milestoneApi.mutation.useDelete();

  const totalPages = Math.max(1, listQuery.data?.pagination?.total_pages ?? 1);
  const totalRows = listQuery.data?.totalRows ?? 0;

  // ─── Form Setup ─────────────────────────────────────────────────────────────
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormPayloadMilestone['Milestone']>({
    resolver: zodResolver(SchemaValidateMilestone.milestone) as never,
    defaultValues: {
      project_id: '',
      title: '',
      description: '',
      status: 'open',
    },
  });

  const openCreateModal = () => {
    setEditingItem(null);
    reset({
      project_id: projectFilter || '',
      title: '',
      description: '',
      status: 'open',
    });
    setIsFormOpen(true);
  };

  const openEditModal = (item: In_Milestone) => {
    setEditingItem(item);
    reset({
      project_id: item.project_id ?? item.project?.id ?? '',
      title: item.title,
      description: item.description ?? '',
      status: item.status ?? 'open',
    });
    setIsFormOpen(true);
  };

  const onSubmit = async (values: FormPayloadMilestone['Milestone']) => {
    try {
      if (editingItem) {
        await updateMutation.mutateAsync({
          id: editingItem.id,
          payload: values,
        });
        dispatch(
          pushToast({
            title: 'Milestone updated',
            description: 'Milestone details have been successfully updated.',
            variant: 'success',
          }),
        );
      } else {
        await createMutation.mutateAsync(values);
        dispatch(
          pushToast({
            title: 'Milestone created',
            description: 'New milestone has been successfully established.',
            variant: 'success',
          }),
        );
      }
      setIsFormOpen(false);
    } catch (err) {
      dispatch(
        pushToast({
          title: editingItem ? 'Failed to update milestone' : 'Failed to create milestone',
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
          title: 'Milestone deleted',
          description: 'The milestone record has been removed.',
          variant: 'success',
        }),
      );
      setDeletingItem(null);
    } catch (err) {
      dispatch(
        pushToast({
          title: 'Failed to delete milestone',
          description: err instanceof Error ? err.message : 'An error occurred',
          variant: 'error',
        }),
      );
    }
  };

  const handleQuickStatusSubmit = async () => {
    if (!statusChangeItem) return;
    try {
      await updateMutation.mutateAsync({
        id: statusChangeItem.id,
        payload: {
          project_id: statusChangeItem.project_id ?? statusChangeItem.project?.id ?? '',
          title: statusChangeItem.title,
          description: statusChangeItem.description,
          status: selectedNewStatus,
        },
      });
      dispatch(
        pushToast({
          title: 'Status updated',
          description: 'Milestone status has been updated.',
          variant: 'success',
        }),
      );
      setStatusChangeItem(null);
    } catch (err) {
      dispatch(
        pushToast({
          title: 'Failed to update status',
          description: err instanceof Error ? err.message : 'An error occurred',
          variant: 'error',
        }),
      );
    }
  };

  const resetAllFilters = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setProjectFilter('');
    setStatusFilter('');
    setPage(1);
  };

  const hasActiveFilters = Boolean(debouncedSearch || projectFilter || statusFilter);

  // ─── Table Columns (NO IDs DISPLAYED) ───────────────────────────────────────
  const columns: DataTableColumn<In_Milestone>[] = [
    {
      key: 'title',
      header: 'Milestone Title & Scope',
      render: (item) => {
        const cleanDescription = stripHtml(item.description);
        return (
          <div className="space-y-1">
            <span className="font-semibold text-gray-900 dark:text-white hover:text-brand-600 transition-colors">
              {item.title}
            </span>
            {cleanDescription && (
              <p className="line-clamp-1 max-w-md text-xs text-gray-500 dark:text-gray-400">
                {cleanDescription}
              </p>
            )}
          </div>
        );
      },
    },
    {
      key: 'project',
      header: 'Assigned Project',
      render: (item) => (
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
            <FolderKanban className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="font-medium text-gray-900 dark:text-white truncate">
              {item.project?.name ?? '—'}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => (
        <button
          type="button"
          onClick={() => {
            setStatusChangeItem(item);
            setSelectedNewStatus(item.status ?? 'open');
          }}
          className="cursor-pointer transition-transform hover:scale-105 active:scale-95"
          title="Click to toggle status"
        >
          <MilestoneStatusBadge status={item.status} />
        </button>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (item) => (
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() =>
              navigate(slashed(ROUTE_PATH_LIST.PROJECT.MILESTONE_DETAIL(item.id)))
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
            title="Edit milestone"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setDeletingItem(item)}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400 transition-colors cursor-pointer"
            title="Delete milestone"
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
        title="Milestones"
        description="Plan and deliver key project deliverables, target deadlines, and sprint milestones."
        actions={
          <Button onClick={openCreateModal} className="gap-2">
            <Plus className="h-4 w-4" />
            <span>Create Milestone</span>
          </Button>
        }
      />

      {/* ─── Search, Filters & Controls Bar ─────────────────────────────────── */}
      <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-xs dark:border-gray-800 dark:bg-white/[0.02]">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {/* 1. Global Search */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search milestone title..."
              aria-label="Search milestone title"
              className="h-10 w-full rounded-xl border border-gray-200 bg-white pl-9.5 pr-4 text-xs font-medium text-gray-800 placeholder:text-gray-400 shadow-xs focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-gray-500"
            />
          </div>

          {/* 2. Project Dropdown-Search Filter */}
          <DropdownSearch
            options={projectOptions}
            value={projectFilter}
            onChange={(val) => {
              setProjectFilter(val);
              setPage(1);
            }}
            placeholder="All Projects"
            searchPlaceholder="Search project..."
            leadingIcon={<FolderKanban className="h-4 w-4" />}
            clearable
          />

          {/* 3. Status Dropdown Filter */}
          <DropdownSearch
            options={MILESTONE_STATUS_OPTIONS}
            value={statusFilter}
            onChange={(val) => {
              setStatusFilter(val);
              setPage(1);
            }}
            placeholder="All Statuses"
            searchPlaceholder="Filter status..."
            leadingIcon={<Flag className="h-4 w-4" />}
            clearable
          />
        </div>

        {/* Row 2: Sort, Order, Limit, Reset */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-3 dark:border-gray-800/80">
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetAllFilters}
                className="h-9 gap-1.5 text-xs text-gray-600 hover:text-gray-900 dark:text-gray-400"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset Filters</span>
              </Button>
            )}
            <span className="font-mono text-xs text-gray-500 dark:text-gray-400">
              {totalRows} {totalRows === 1 ? 'milestone' : 'milestones'} found
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
              aria-label="Sort by field"
              className="h-9 rounded-xl border border-gray-200 bg-white px-3 text-xs font-medium text-gray-700 shadow-xs focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
            >
              <option value="title">Sort: Title</option>
              <option value="status">Sort: Status</option>
              <option value="created_at">Sort: Created Date</option>
              <option value="updated_at">Sort: Updated Date</option>
            </select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setOrderBy((prev) => (prev === 'ASC' ? 'DESC' : 'ASC'))}
              className="h-9 gap-1.5 px-3"
              title={`Order: ${orderBy}`}
            >
              <ArrowUpDown className="h-3.5 w-3.5 text-gray-400" />
              <span className="text-xs font-semibold">{orderBy}</span>
            </Button>

            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              aria-label="Items per page"
              className="h-9 rounded-xl border border-gray-200 bg-white px-3 text-xs font-medium text-gray-700 shadow-xs focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
            >
              <option value={10}>10 / page</option>
              <option value={25}>25 / page</option>
              <option value={50}>50 / page</option>
            </select>
          </div>
        </div>
      </div>

      {/* ─── DataTable + Pagination ─────────────────────────────────────────── */}
      <div className="space-y-3">
        <DataTable<In_Milestone>
          columns={columns}
          data={listQuery.data?.items ?? []}
          getRowKey={(item) => item.id}
          isLoading={listQuery.isLoading}
          error={(listQuery.error as Error | null) ?? null}
          onRetry={() => void listQuery.refetch()}
          emptyTitle="No milestones found"
          emptyDescription={
            hasActiveFilters
              ? 'Try adjusting or clearing your filters to see more milestones.'
              : 'Create a milestone to plan deliverable phases and track deadlines.'
          }
          emptyAction={
            hasActiveFilters ? (
              <Button variant="outline" size="sm" onClick={resetAllFilters}>
                Clear all filters
              </Button>
            ) : (
              <Button size="sm" onClick={openCreateModal}>
                <Plus className="h-3.5 w-3.5" />
                <span>Create Milestone</span>
              </Button>
            )
          }
        />

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="flex flex-col items-center justify-between gap-3 border-t border-gray-200/80 px-2 py-4 sm:flex-row dark:border-gray-800">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Page <span className="font-semibold text-gray-900 dark:text-white">{page}</span> of{' '}
              <span className="font-semibold text-gray-900 dark:text-white">{totalPages}</span>
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || listQuery.isLoading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Previous</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages || listQuery.isLoading}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="gap-1"
              >
                <span>Next</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ─── Create / Edit Milestone Modal ──────────────────────────────────── */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => !isSubmitting && setIsFormOpen(false)}
        title={editingItem ? 'Edit Milestone' : 'Create New Milestone'}
        description={
          editingItem
            ? 'Update milestone targets, due dates, and deliverables.'
            : 'Establish a new milestone phase under a designated project.'
        }
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Controller
            name="project_id"
            control={control}
            render={({ field }) => (
              <DropdownSearch
                label="Associated Project"
                required
                placeholder="Select project..."
                searchPlaceholder="Search project..."
                options={projectOptions}
                value={field.value}
                onChange={field.onChange}
                error={errors.project_id?.message}
                clearable={false}
              />
            )}
          />

          <Input
            label="Milestone Title"
            placeholder="e.g. Authentication and Role Access Permission"
            required
            error={errors.title?.message}
            {...register('title')}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
           

            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <DropdownSearch
                  label="Milestone Status"
                  placeholder="Select status..."
                  options={MILESTONE_STATUS_OPTIONS}
                  value={field.value || 'open'}
                  onChange={field.onChange}
                  error={errors.status?.message}
                  clearable={false}
                />
              )}
            />
          </div>

          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <RichTextEditor
                label="Description & Task Breakdown"
                placeholder="Document scope, acceptance criteria, or task checklists (e.g. <div>...</div>)..."
                hint="Supports rich text formatting (bold, headings, bullet/numbered lists, links). File upload disabled."
                value={field.value || ''}
                onChange={field.onChange}
                error={errors.description?.message}
                allowFileUpload={false}
              />
            )}
          />

          <div className="flex items-center justify-end gap-2.5 pt-3">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => setIsFormOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {editingItem ? 'Save Changes' : 'Create Milestone'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ─── Quick Change Status Modal ──────────────────────────────────────── */}
      <Modal
        isOpen={Boolean(statusChangeItem)}
        onClose={() => !updateMutation.isPending && setStatusChangeItem(null)}
        title="Change Milestone Status"
        description={
          statusChangeItem
            ? `Update delivery status for "${statusChangeItem.title}"`
            : 'Select new milestone status'
        }
        size="md"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setStatusChangeItem(null)}
              disabled={updateMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleQuickStatusSubmit}
              disabled={!selectedNewStatus}
              isLoading={updateMutation.isPending}
            >
              Update Status
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {statusChangeItem && (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50/70 p-3.5 dark:border-gray-800 dark:bg-white/[0.02]">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  Current Status
                </p>
                <div className="mt-1">
                  <MilestoneStatusBadge status={statusChangeItem.status} />
                </div>
              </div>

              <ArrowRight className="h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500" />

              <div className="min-w-0 text-right">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  Target Status
                </p>
                <div className="mt-1 flex justify-end">
                  <MilestoneStatusBadge status={selectedNewStatus} />
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {MILESTONE_STATUS_OPTIONS.map((opt) => {
              const isSelected = selectedNewStatus === opt.value;
              const isCurrent = (statusChangeItem?.status ?? 'open') === opt.value;

              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSelectedNewStatus(opt.value)}
                  className={cn(
                    'group flex w-full items-center justify-between gap-3 rounded-xl border p-3.5 text-left transition-all duration-150 cursor-pointer',
                    isSelected
                      ? 'border-brand-500 bg-brand-50/70 ring-2 ring-brand-500/20 dark:border-brand-500 dark:bg-brand-950/40'
                      : 'border-gray-200/80 bg-white hover:border-gray-300 hover:bg-gray-50/60 dark:border-gray-800 dark:bg-gray-900/60 dark:hover:border-gray-700 dark:hover:bg-white/[0.03]',
                  )}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: opt.dotColor }}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-gray-900 dark:text-white">
                          {opt.label}
                        </span>
                        {isCurrent && (
                          <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                            Current
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                        {opt.subLabel}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 pl-2">
                    <span
                      className={cn(
                        'flex h-5 w-5 items-center justify-center rounded-full border transition-all',
                        isSelected
                          ? 'border-brand-600 bg-brand-600 text-white dark:border-brand-500 dark:bg-brand-500'
                          : 'border-gray-300 bg-transparent text-transparent group-hover:border-gray-400 dark:border-gray-700',
                      )}
                    >
                      <Check className="h-3 w-3 stroke-[3]" />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </Modal>

      {/* ─── Delete Confirmation Dialog (NO ID IN DIALOG) ───────────────────── */}
      <ConfirmDialog
        isOpen={Boolean(deletingItem)}
        onClose={() => setDeletingItem(null)}
        onConfirm={handleDelete}
        title="Delete Milestone"
        description={
          deletingItem
            ? `Are you sure you want to permanently delete "${deletingItem.title}"? This action cannot be undone.`
            : 'Are you sure you want to delete this milestone?'
        }
        confirmLabel="Delete Milestone"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
