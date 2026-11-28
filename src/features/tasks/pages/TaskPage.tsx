import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import {
  ArrowUpDown,
  Calendar,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  Flag,
  FolderKanban,
  GitBranch,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Tag,
  Trash2,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { DropdownSearch } from '@/components/ui/DropdownSearch';
import { Input, Select, Textarea } from '@/components/ui/FormControls';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/PageHeader';
import { useAppDispatch } from '@/store/hooks';
import { pushToast } from '@/store/slices/ui-slice';
import type { In_Task, T_SortOrder } from '@/types/api-type';
import { formatDate, slashed } from '@/shared/libs/helper';
import { ROUTE_PATH_LIST } from '@/shared/constants';
import { taskApi } from '../api';
import { SchemaValidateTask, type FormPayloadTask } from '../schemas';
import { projectApi } from '@/features/projects/api';
import { milestoneApi } from '@/features/milestone/api';
import { taskTypeApi } from '@/features/master-data/task-types/api';
import { taskStatusApi } from '@/features/master-data/task-status/api';
import { userAccessApi } from '@/features/access-control/api/access-control-api';

// ─── Priority Options & Badge ─────────────────────────────────────────────────

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low', dotColor: '#64748B' },
  { value: 'medium', label: 'Medium', dotColor: '#F59E0B' },
  { value: 'high', label: 'High', dotColor: '#F97316' },
  { value: 'urgent', label: 'Urgent', dotColor: '#EF4444' },
];

const PRIORITY_STYLES: Record<string, string> = {
  low: 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300',
  medium:
    'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800/70 dark:bg-amber-950/40 dark:text-amber-300',
  high: 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800/70 dark:bg-orange-950/40 dark:text-orange-300',
  urgent:
    'border-red-200 bg-red-50 text-red-700 dark:border-red-800/70 dark:bg-red-950/40 dark:text-red-300',
};

function PriorityBadge({ priority }: { priority?: string | null }) {
  const normalized = (priority ?? 'medium').toLowerCase();
  const style = PRIORITY_STYLES[normalized] ?? PRIORITY_STYLES.medium;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize ${style}`}
    >
      <Flag className="h-2.5 w-2.5" />
      <span>{normalized}</span>
    </span>
  );
}

function StatusBadge({
  name,
  colorCode,
}: {
  name: string;
  colorCode?: string | null;
}) {
  const customColor =
    colorCode && colorCode.trim().length > 0 ? colorCode : undefined;

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide border shadow-2xs"
      style={
        customColor
          ? {
              backgroundColor: `${customColor}18`,
              borderColor: `${customColor}40`,
              color: customColor,
            }
          : undefined
      }
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: customColor || '#6366f1' }}
      />
      <span className={!customColor ? 'text-gray-700 dark:text-gray-300' : ''}>
        {name}
      </span>
    </span>
  );
}

// ─── Main TaskPage Component ──────────────────────────────────────────────────

export function TaskPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // ─── Search, Filter & Pagination State ──────────────────────────────────────
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState('title');
  const [orderBy, setOrderBy] = useState<T_SortOrder>('ASC');

  const [projectFilter, setProjectFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // ─── Modals State ───────────────────────────────────────────────────────────
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<In_Task | null>(null);
  const [deletingItem, setDeletingItem] = useState<In_Task | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  // ─── Reference Data Queries ─────────────────────────────────────────────────
  const projectsQuery = projectApi.query.useFetchPaginationList({ limit: 100 });
  const milestonesQuery = milestoneApi.query.useFetchPaginationList({ limit: 100 });
  const taskTypesQuery = taskTypeApi.query.useFetchPaginationList({ limit: 100 });
  const taskStatusesQuery = taskStatusApi.query.useFetchPaginationList({
    limit: 100,
  });
  const usersQuery = userAccessApi.query.useUsersList();

  const userMap = useMemo(() => {
    const map = new Map<string, { name: string; email?: string | null }>();
    for (const u of usersQuery.data ?? []) {
      map.set(u.id, { name: u.name, email: u.email });
    }
    return map;
  }, [usersQuery.data]);

  const projectOptions = useMemo(
    () =>
      projectsQuery.data?.items.map((p) => ({
        value: p.id,
        label: p.name,
        subLabel: p.key || undefined,
      })) ?? [],
    [projectsQuery.data?.items],
  );

  const taskTypeOptions = useMemo(
    () =>
      taskTypesQuery.data?.items.map((t) => ({
        value: t.id,
        label: t.name,
        subLabel: t.description || undefined,
      })) ?? [],
    [taskTypesQuery.data?.items],
  );

  const taskStatusOptions = useMemo(
    () =>
      taskStatusesQuery.data?.items.map((s) => ({
        value: s.id,
        label: s.name,
        dotColor: s.color_code || '#6366f1',
      })) ?? [],
    [taskStatusesQuery.data?.items],
  );

  // ─── Tasks Query & Mutations ────────────────────────────────────────────────
  const listQuery = taskApi.query.useFetchPaginationList({
    page,
    limit,
    search: debouncedSearch || undefined,
    sort_by: sortBy,
    order_by: orderBy,
    project_id: projectFilter || undefined,
    priority: priorityFilter || undefined,
    task_status_id: statusFilter || undefined,
  });

  const createMutation = taskApi.mutation.useCreate();
  const updateMutation = taskApi.mutation.useUpdate();
  const deleteMutation = taskApi.mutation.useDelete();

  const totalPages = Math.max(1, listQuery.data?.pagination?.total_pages ?? 1);
  const totalRows = listQuery.data?.totalRows ?? 0;

  // ─── Form Setup ─────────────────────────────────────────────────────────────
  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormPayloadTask['Task']>({
    resolver: zodResolver(SchemaValidateTask.task) as never,
    defaultValues: {
      project_id: '',
      milestone_id: '',
      task_type_id: '',
      task_status_id: '',
      title: '',
      description: '',
      priority: 'medium',
      estimated_hours: 0,
      start_date: '',
      end_date: '',
      mom_number: '',
      mom_date: '',
    },
  });

  const watchedProjectId = watch('project_id');

  const milestoneOptions = useMemo(() => {
    const items = milestonesQuery.data?.items ?? [];
    const filtered = watchedProjectId
      ? items.filter(
          (m) => (m.project_id ?? m.project?.id) === watchedProjectId,
        )
      : items;
    return filtered.map((m) => ({
      value: m.id,
      label: m.title,
      subLabel: m.project?.name || undefined,
    }));
  }, [milestonesQuery.data?.items, watchedProjectId]);

  const openCreateModal = () => {
    setEditingItem(null);
    reset({
      project_id: projectFilter || '',
      milestone_id: '',
      task_type_id: '',
      task_status_id: statusFilter || '',
      title: '',
      description: '',
      priority: priorityFilter || 'medium',
      estimated_hours: 4,
      start_date: '',
      end_date: '',
      mom_number: '',
      mom_date: '',
    });
    setIsFormOpen(true);
  };

  const openEditModal = (item: In_Task) => {
    setEditingItem(item);
    reset({
      project_id: item.project_id ?? item.project?.id ?? '',
      milestone_id: item.milestone_id ?? item.milestone?.id ?? '',
      task_type_id: item.task_type_id ?? item.task_type?.id ?? '',
      task_status_id: item.task_status_id ?? item.task_status?.id ?? '',
      title: item.title,
      description: item.description ?? '',
      priority: item.priority ?? 'medium',
      estimated_hours: item.estimated_hours ? Number(item.estimated_hours) : 0,
      start_date: item.start_date ? item.start_date.slice(0, 10) : '',
      end_date: item.end_date ? item.end_date.slice(0, 10) : '',
      mom_number: item.mom_number ?? '',
      mom_date: item.mom_date ? item.mom_date.slice(0, 10) : '',
    });
    setIsFormOpen(true);
  };

  const onSubmit = async (values: FormPayloadTask['Task']) => {
    try {
      if (editingItem) {
        await updateMutation.mutateAsync({
          id: editingItem.id,
          values,
        });
        dispatch(
          pushToast({
            title: 'Task updated',
            description: 'Task details have been successfully updated.',
            variant: 'success',
          }),
        );
      } else {
        await createMutation.mutateAsync(values);
        dispatch(
          pushToast({
            title: 'Task created',
            description: 'New task has been successfully created.',
            variant: 'success',
          }),
        );
      }
      setIsFormOpen(false);
      setEditingItem(null);
    } catch (err) {
      dispatch(
        pushToast({
          title: editingItem ? 'Failed to update task' : 'Failed to create task',
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
          title: 'Task deleted',
          description: `"${deletingItem.title}" has been removed.`,
          variant: 'success',
        }),
      );
      setDeletingItem(null);
    } catch (err) {
      dispatch(
        pushToast({
          title: 'Failed to delete task',
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
    setPriorityFilter('');
    setStatusFilter('');
    setPage(1);
  };

  const hasActiveFilters = Boolean(
    debouncedSearch || projectFilter || priorityFilter || statusFilter,
  );

  // ─── Table Columns ──────────────────────────────────────────────────────────
  const columns: DataTableColumn<In_Task>[] = [
    {
      key: 'title',
      header: 'Title',
      render: (item) => (
        <div className="space-y-1.5 min-w-[220px]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-gray-900 dark:text-white">
              {item.title}
            </span>
            {item.task_key && (
              <span className="inline-flex items-center rounded-md bg-gray-100 px-1.5 py-0.5 font-mono text-[11px] font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                {item.task_key}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {item.task_status && (
              <StatusBadge
                name={item.task_status.name}
                colorCode={item.task_status.color_code}
              />
            )}
            <PriorityBadge priority={item.priority} />
            {item.task_type && (
              <span className="inline-flex items-center gap-1 rounded-md border border-indigo-200/70 bg-indigo-50/70 px-1.5 py-0.5 text-[11px] font-medium text-indigo-700 dark:border-indigo-800/70 dark:bg-indigo-950/40 dark:text-indigo-300">
                <Tag className="h-2.5 w-2.5" />
                {item.task_type.name}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'project',
      header: 'Project Name',
      render: (item) => (
        <div className="space-y-0.5 min-w-[160px]">
          <p className="font-semibold text-gray-900 dark:text-white">
            {item.project?.name ?? '—'}
          </p>
          {item.milestone?.title && (
            <p className="line-clamp-1 text-xs text-gray-500 dark:text-gray-400">
              {item.milestone.title}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'timeline',
      header: 'Timeline',
      render: (item) => (
        <div className="space-y-1 whitespace-nowrap">
          <div className="flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-300">
            <Calendar className="h-3.5 w-3.5 text-gray-400 shrink-0" />
            <span>
              {item.start_date
                ? formatDate(item.start_date, 'D MMM YYYY')
                : '—'}{' '}
              –{' '}
              {item.end_date ? formatDate(item.end_date, 'D MMM YYYY') : '—'}
            </span>
          </div>
          {item.estimated_hours !== undefined &&
            item.estimated_hours !== null && (
              <div className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400">
                <Clock className="h-3 w-3 text-gray-400 shrink-0" />
                <span className="tabular-nums">
                  Est. {Number(item.estimated_hours)} hrs
                </span>
              </div>
            )}
        </div>
      ),
    },
    {
      key: 'pic',
      header: 'PIC',
      render: (item) => {
        const picUser = item.user_requested_id
          ? userMap.get(item.user_requested_id)
          : undefined;
        if (!item.user_requested_id) {
          return (
            <span className="inline-flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
              <User className="h-3.5 w-3.5" />
              <span>Unassigned</span>
            </span>
          );
        }
        return (
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[11px] font-bold text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
              {(picUser?.name ?? 'U').slice(0, 2).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                {picUser?.name ?? item.user_requested_id}
              </p>
              {picUser?.email && (
                <p className="text-[11px] text-gray-400 truncate">
                  {picUser.email}
                </p>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: 'updated_at',
      header: 'Updated At',
      render: (item) => (
        <span className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
          {formatDate(item.updated_at)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Action',
      align: 'right',
      render: (item) => (
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() =>
              navigate(slashed(ROUTE_PATH_LIST.TASK.TASK_DETAIL(item.id)), {
                state: { from: `${location.pathname}${location.search}` },
              })
            }
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200 transition-colors cursor-pointer"
            title="View task details"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => openEditModal(item)}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-900/30 dark:hover:text-brand-400 transition-colors cursor-pointer"
            title="Edit task"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setDeletingItem(item)}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400 transition-colors cursor-pointer"
            title="Delete task"
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
        title="Tasks"
        description="Track engineering tasks, priorities, timelines, and deliverables across projects."
        actions={
          <Button onClick={openCreateModal} className="gap-2">
            <Plus className="h-4 w-4" />
            <span>Create Task</span>
          </Button>
        }
      />

      {/* ─── Search, Filters & Controls Bar ─────────────────────────────────── */}
      <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-xs dark:border-gray-800 dark:bg-white/[0.02]">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* 1. Search */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by task title..."
              aria-label="Search by task title"
              className="h-10 w-full rounded-xl border border-gray-200 bg-white pl-9.5 pr-4 text-xs font-medium text-gray-800 placeholder:text-gray-400 shadow-xs focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-gray-500"
            />
          </div>

          {/* 2. Project Filter */}
          <DropdownSearch
            options={projectOptions}
            value={projectFilter}
            onChange={(val) => {
              setProjectFilter(val);
              setPage(1);
            }}
            placeholder="All Projects"
            searchPlaceholder="Filter project..."
            leadingIcon={<FolderKanban className="h-4 w-4" />}
            clearable
          />

          {/* 3. Priority Filter */}
          <DropdownSearch
            options={PRIORITY_OPTIONS}
            value={priorityFilter}
            onChange={(val) => {
              setPriorityFilter(val);
              setPage(1);
            }}
            placeholder="All Priorities"
            searchPlaceholder="Filter priority..."
            leadingIcon={<Flag className="h-4 w-4" />}
            clearable
          />

          {/* 4. Task Status Filter */}
          <DropdownSearch
            options={taskStatusOptions}
            value={statusFilter}
            onChange={(val) => {
              setStatusFilter(val);
              setPage(1);
            }}
            placeholder="All Task Statuses"
            searchPlaceholder="Filter status..."
            leadingIcon={<GitBranch className="h-4 w-4" />}
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
              {totalRows} {totalRows === 1 ? 'task' : 'tasks'} found
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
              <option value="task_key">Sort: Task Key</option>
              <option value="priority">Sort: Priority</option>
              <option value="start_date">Sort: Start Date</option>
              <option value="end_date">Sort: End Date</option>
              <option value="updated_at">Sort: Updated At</option>
              <option value="created_at">Sort: Created At</option>
            </select>

            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setOrderBy((prev) => (prev === 'ASC' ? 'DESC' : 'ASC'))
              }
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
        <DataTable<In_Task>
          columns={columns}
          data={listQuery.data?.items ?? []}
          getRowKey={(item) => item.id}
          isLoading={listQuery.isLoading}
          error={(listQuery.error as Error | null) ?? null}
          onRetry={() => void listQuery.refetch()}
          emptyTitle="No tasks found"
          emptyDescription={
            hasActiveFilters
              ? 'Try modifying or clearing your filters to see more results.'
              : 'Create your first task to start organizing sprint work.'
          }
          emptyAction={
            hasActiveFilters ? (
              <Button variant="outline" size="sm" onClick={resetAllFilters}>
                Clear all filters
              </Button>
            ) : (
              <Button size="sm" onClick={openCreateModal}>
                <Plus className="h-3.5 w-3.5" />
                <span>Create Task</span>
              </Button>
            )
          }
        />

        {totalPages > 1 && (
          <div className="flex flex-col items-center justify-between gap-3 border-t border-gray-200/80 px-2 py-4 sm:flex-row dark:border-gray-800">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Page{' '}
              <span className="font-semibold text-gray-900 dark:text-white">
                {page}
              </span>{' '}
              of{' '}
              <span className="font-semibold text-gray-900 dark:text-white">
                {totalPages}
              </span>
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

      {/* ─── Create / Edit Task Modal ───────────────────────────────────────── */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingItem ? 'Edit Task' : 'Create New Task'}
        description={
          editingItem
            ? `Update task "${editingItem.title}".`
            : 'Fill in task details, milestone association, timeline, and priority.'
        }
        size="lg"
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
              form="task-form"
              isLoading={createMutation.isPending || updateMutation.isPending}
            >
              {editingItem ? 'Save Changes' : 'Create Task'}
            </Button>
          </>
        }
      >
        <form
          id="task-form"
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Project */}
            <Controller
              name="project_id"
              control={control}
              render={({ field }) => (
                <DropdownSearch
                  label="Project"
                  required
                  options={projectOptions}
                  value={field.value}
                  onChange={(val) => {
                    field.onChange(val);
                    setValue('milestone_id', '');
                  }}
                  placeholder="Select project"
                  searchPlaceholder="Search project..."
                  leadingIcon={<FolderKanban className="h-4 w-4" />}
                  error={errors.project_id?.message}
                />
              )}
            />

            {/* Milestone */}
            <Controller
              name="milestone_id"
              control={control}
              render={({ field }) => (
                <DropdownSearch
                  label="Milestone"
                  required
                  options={milestoneOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder={
                    watchedProjectId
                      ? 'Select milestone'
                      : 'Select project first...'
                  }
                  searchPlaceholder="Search milestone..."
                  leadingIcon={<CheckSquare className="h-4 w-4" />}
                  error={errors.milestone_id?.message}
                />
              )}
            />

            {/* Task Type */}
            <Controller
              name="task_type_id"
              control={control}
              render={({ field }) => (
                <DropdownSearch
                  label="Task Type"
                  required
                  options={taskTypeOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Select task type"
                  searchPlaceholder="Search task type..."
                  leadingIcon={<Tag className="h-4 w-4" />}
                  error={errors.task_type_id?.message}
                />
              )}
            />

            {/* Task Status */}
            <Controller
              name="task_status_id"
              control={control}
              render={({ field }) => (
                <DropdownSearch
                  label="Task Status"
                  required
                  options={taskStatusOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Select task status"
                  searchPlaceholder="Search task status..."
                  leadingIcon={<GitBranch className="h-4 w-4" />}
                  error={errors.task_status_id?.message}
                />
              )}
            />
          </div>

          {/* Title */}
          <Input
            label="Task Title"
            placeholder="e.g. Create Layout Login Web Page"
            required
            error={errors.title?.message}
            {...register('title')}
          />

          {/* Description */}
          <Textarea
            label="Description"
            placeholder="Describe task scope, acceptance criteria, or technical notes..."
            rows={3}
            error={errors.description?.message}
            {...register('description')}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Priority */}
            <Select
              label="Priority"
              required
              options={PRIORITY_OPTIONS.map((p) => ({
                value: p.value,
                label: p.label,
              }))}
              error={errors.priority?.message}
              {...register('priority')}
            />

            {/* Estimated Hours */}
            <Input
              label="Estimated Hours"
              type="number"
              step="0.5"
              min="0"
              placeholder="e.g. 4"
              error={errors.estimated_hours?.message}
              {...register('estimated_hours')}
            />

            {/* Start Date */}
            <Input
              label="Start Date"
              type="date"
              required
              error={errors.start_date?.message}
              {...register('start_date')}
            />

            {/* End Date */}
            <Input
              label="End Date"
              type="date"
              required
              error={errors.end_date?.message}
              {...register('end_date')}
            />

            {/* MoM Number */}
            <Input
              label="MoM Number"
              placeholder="e.g. DIR/001/002/2026"
              error={errors.mom_number?.message}
              {...register('mom_number')}
            />

            {/* MoM Date */}
            <Input
              label="MoM Date"
              type="date"
              error={errors.mom_date?.message}
              {...register('mom_date')}
            />
          </div>
        </form>
      </Modal>

      {/* ─── Delete Confirmation Dialog ─────────────────────────────────────── */}
      <ConfirmDialog
        isOpen={Boolean(deletingItem)}
        onClose={() => setDeletingItem(null)}
        onConfirm={() => void handleDelete()}
        title="Delete Task"
        description={`Are you sure you want to delete task "${
          deletingItem?.title ?? 'this task'
        }"? This action cannot be undone.`}
        confirmLabel="Delete Task"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

export default TaskPage;
