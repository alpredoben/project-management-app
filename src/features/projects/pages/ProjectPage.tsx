import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import {
  ArrowRight,
  ArrowUpDown,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  GitBranch,
  Layers,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Tag,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { DropdownSearch } from '@/components/ui/DropdownSearch';
import { Input, Textarea } from '@/components/ui/FormControls';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/PageHeader';
import { useAppDispatch } from '@/store/hooks';
import { pushToast } from '@/store/slices/ui-slice';
import type { In_Project, T_SortOrder } from '@/types/api-type';
import { formatDate, getPublicUrlExpression, slashed } from '@/shared/libs/helper';
import { cn } from '@/shared/libs/cn';
import { ROUTE_PATH_LIST } from '@/shared/constants';
import { projectApi } from '../api';
import {
  SchemaValidateProject,
  type FormPayloadProject,
} from '../schemas';
import { workspaceApi } from '@/features/workspace/api';
import { projectStatusApi } from '@/features/master-data/project-status/api';
import { projectTypeApi } from '@/features/master-data/project-types/api';

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
        className="h-8 w-8 shrink-0 rounded-lg object-cover border border-gray-200/80 dark:border-gray-700/80 shadow-xs"
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
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-linear-to-tr from-brand-600 to-indigo-500 text-xs font-bold text-white shadow-xs">
      {initials}
    </div>
  );
}

// ─── Status Badge Component ───────────────────────────────────────────────────

function StatusBadge({
  name,
  colorCode,
}: {
  name: string;
  colorCode?: string | null;
}) {
  const customColor = colorCode && colorCode.trim().length > 0 ? colorCode : undefined;

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide border shadow-2xs transition-colors"
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

// ─── Main ProjectPage Component ───────────────────────────────────────────────

export function ProjectPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  // ─── Search & Pagination State ──────────────────────────────────────────────
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState('name');
  const [orderBy, setOrderBy] = useState<T_SortOrder>('ASC');

  // ─── Dropdown-Search Filters ────────────────────────────────────────────────
  const [workspaceFilter, setWorkspaceFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // ─── Modals State ───────────────────────────────────────────────────────────
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<In_Project | null>(null);
  const [deletingItem, setDeletingItem] = useState<In_Project | null>(null);

  // Quick Change Status Modal
  const [statusChangeItem, setStatusChangeItem] = useState<In_Project | null>(null);
  const [selectedNewStatusId, setSelectedNewStatusId] = useState('');

  // Quick Change Type Modal
  const [typeChangeItem, setTypeChangeItem] = useState<In_Project | null>(null);
  const [selectedNewTypeId, setSelectedNewTypeId] = useState('');

  // Debounce search input
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  // ─── Reference Data Queries ─────────────────────────────────────────────────
  const workspacesQuery = workspaceApi.query.useFetchPaginationList({ limit: 100 });
  const statusesQuery = projectStatusApi.query.useFetchPaginationList({ limit: 100 });
  const typesQuery = projectTypeApi.query.useFetchPaginationList({ limit: 100 });

  const workspaceOptions = useMemo(
    () =>
      workspacesQuery.data?.items.map((w) => ({
        value: w.id,
        label: w.name,
        subLabel: w.slug,
      })) ?? [],
    [workspacesQuery.data?.items],
  );

  const statusOptions = useMemo(
    () =>
      statusesQuery.data?.items.map((s) => ({
        value: s.id,
        label: s.name,
        dotColor: s.color_code || '#6366f1',
      })) ?? [],
    [statusesQuery.data?.items],
  );

  const typeOptions = useMemo(
    () =>
      typesQuery.data?.items.map((t) => ({
        value: t.id,
        label: t.name,
        subLabel: t.description || undefined,
      })) ?? [],
    [typesQuery.data?.items],
  );

  // ─── Projects Query & Mutations ─────────────────────────────────────────────
  const listQuery = projectApi.query.useFetchPaginationList({
    page,
    limit,
    search: debouncedSearch || undefined,
    sort_by: sortBy,
    order_by: orderBy,
    workspace_id: workspaceFilter || undefined,
    project_status_id: statusFilter || undefined,
    project_type_id: typeFilter || undefined,
  });

  const createMutation = projectApi.mutation.useCreate();
  const updateMutation = projectApi.mutation.useUpdate();
  const deleteMutation = projectApi.mutation.useDelete();
  const changeStatusMutation = projectApi.mutation.useChangeStatus();
  const changeTypeMutation = projectApi.mutation.useChangeType();

  const totalPages = Math.max(1, listQuery.data?.pagination?.total_pages ?? 1);
  const totalRows = listQuery.data?.totalRows ?? 0;

  // ─── Project Form Setup ─────────────────────────────────────────────────────
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormPayloadProject['Project']>({
    resolver: zodResolver(SchemaValidateProject.project) as never,
    defaultValues: {
      workspace_id: '',
      project_type_id: '',
      project_status_id: '',
      name: '',
      description: '',
      start_date: '',
      end_date: '',
    },
  });

  const openCreateModal = () => {
    setEditingItem(null);
    reset({
      workspace_id: workspaceFilter || '',
      project_type_id: typeFilter || '',
      project_status_id: statusFilter || '',
      name: '',
      description: '',
      start_date: '',
      end_date: '',
    });
    setIsFormOpen(true);
  };

  const openEditModal = (item: In_Project) => {
    setEditingItem(item);
    reset({
      workspace_id: item.workspace_id ?? item.workspace?.id ?? '',
      project_type_id: item.project_type_id ?? item.project_type?.id ?? '',
      project_status_id: item.project_status_id ?? item.project_status?.id ?? '',
      name: item.name,
      description: item.description ?? '',
      start_date: item.start_date ? item.start_date.slice(0, 10) : '',
      end_date: item.end_date ? item.end_date.slice(0, 10) : '',
    });
    setIsFormOpen(true);
  };

  const onSubmit = async (values: FormPayloadProject['Project']) => {
    try {
      if (editingItem) {
        await updateMutation.mutateAsync({
          id: editingItem.id,
          payload: values,
        });
        dispatch(
          pushToast({
            title: 'Project updated',
            description: 'Project details have been successfully updated.',
            variant: 'success',
          }),
        );
      } else {
        await createMutation.mutateAsync(values);
        dispatch(
          pushToast({
            title: 'Project created',
            description: 'New project has been successfully initialized.',
            variant: 'success',
          }),
        );
      }
      setIsFormOpen(false);
    } catch (err) {
      dispatch(
        pushToast({
          title: editingItem ? 'Failed to update project' : 'Failed to create project',
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
          title: 'Project deleted',
          description: 'The project record has been removed.',
          variant: 'success',
        }),
      );
      setDeletingItem(null);
    } catch (err) {
      dispatch(
        pushToast({
          title: 'Failed to delete project',
          description: err instanceof Error ? err.message : 'An error occurred',
          variant: 'error',
        }),
      );
    }
  };

  const handleQuickStatusSubmit = async () => {
    if (!statusChangeItem || !selectedNewStatusId) return;
    try {
      await changeStatusMutation.mutateAsync({
        id: statusChangeItem.id,
        payload: { project_status_id: selectedNewStatusId },
      });
      dispatch(
        pushToast({
          title: 'Project status updated',
          description: 'Project lifecycle status has been updated.',
          variant: 'success',
        }),
      );
      setStatusChangeItem(null);
    } catch (err) {
      dispatch(
        pushToast({
          title: 'Failed to change status',
          description: err instanceof Error ? err.message : 'An error occurred',
          variant: 'error',
        }),
      );
    }
  };

  const handleQuickTypeSubmit = async () => {
    if (!typeChangeItem || !selectedNewTypeId) return;
    try {
      await changeTypeMutation.mutateAsync({
        id: typeChangeItem.id,
        payload: { project_type_id: selectedNewTypeId },
      });
      dispatch(
        pushToast({
          title: 'Project type updated',
          description: 'Project classification type has been updated.',
          variant: 'success',
        }),
      );
      setTypeChangeItem(null);
    } catch (err) {
      dispatch(
        pushToast({
          title: 'Failed to change type',
          description: err instanceof Error ? err.message : 'An error occurred',
          variant: 'error',
        }),
      );
    }
  };

  const resetAllFilters = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setWorkspaceFilter('');
    setStatusFilter('');
    setTypeFilter('');
    setPage(1);
  };

  const hasActiveFilters = Boolean(
    debouncedSearch || workspaceFilter || statusFilter || typeFilter,
  );

  // ─── Table Columns (NO IDs DISPLAYED) ───────────────────────────────────────
  const columns: DataTableColumn<In_Project>[] = [
    {
      key: 'name',
      header: 'Project Name & Key',
      render: (item) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900 dark:text-white hover:text-brand-600 transition-colors">
              {item.name}
            </span>
            {item.key && (
              <span className="inline-flex items-center rounded-md bg-gray-100 px-1.5 py-0.5 font-mono text-[11px] font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                {item.key}
              </span>
            )}
          </div>
          {item.description && (
            <p className="line-clamp-1 max-w-sm text-xs text-gray-500 dark:text-gray-400">
              {item.description}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'workspace',
      header: 'Workspace',
      render: (item) => (
        <div className="flex items-center gap-2.5">
          <WorkspaceLogoThumbnail
            url={item.workspace?.logo_url}
            name={item.workspace?.name ?? 'Workspace'}
          />
          <div className="min-w-0">
            <p className="font-medium text-gray-900 dark:text-white truncate">
              {item.workspace?.name ?? '—'}
            </p>
            {item.workspace?.slug && (
              <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">
                {item.workspace.slug}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Project Type',
      render: (item) => (
        <button
          type="button"
          onClick={() => {
            setTypeChangeItem(item);
            setSelectedNewTypeId(item.project_type_id ?? item.project_type?.id ?? '');
          }}
          className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200/80 bg-indigo-50/80 px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100/80 transition-colors cursor-pointer dark:border-indigo-800/80 dark:bg-indigo-950/40 dark:text-indigo-300"
          title="Click to change project type"
        >
          <Tag className="h-3 w-3" />
          <span>{item.project_type?.name ?? 'Not set'}</span>
        </button>
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
            setSelectedNewStatusId(item.project_status_id ?? item.project_status?.id ?? '');
          }}
          className="cursor-pointer transition-transform hover:scale-105 active:scale-95"
          title="Click to change status"
        >
          <StatusBadge
            name={item.project_status?.name ?? 'Not set'}
            colorCode={item.project_status?.color_code}
          />
        </button>
      ),
    },
    {
      key: 'timeline',
      header: 'Timeline',
      render: (item) => (
        <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
          <Calendar className="h-3.5 w-3.5 text-gray-400 shrink-0" />
          <span>
            {formatDate(item.start_date, 'D MMM YYYY')} – {formatDate(item.end_date, 'D MMM YYYY')}
          </span>
        </div>
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
              navigate(slashed(ROUTE_PATH_LIST.PROJECT.PROJECT_DETAIL(item.id)))
            }
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200 transition-colors cursor-pointer"
            title="View project details"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => openEditModal(item)}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-900/30 dark:hover:text-brand-400 transition-colors cursor-pointer"
            title="Edit project"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setDeletingItem(item)}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400 transition-colors cursor-pointer"
            title="Delete project"
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
        title="Projects"
        description="Monitor portfolio deliverables, milestones, workspace associations, and project statuses."
        actions={
          <Button onClick={openCreateModal} className="gap-2">
            <Plus className="h-4 w-4" />
            <span>Create Project</span>
          </Button>
        }
      />

      {/* ─── Search, Filters & Controls Bar ─────────────────────────────────── */}
      <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-xs dark:border-gray-800 dark:bg-white/[0.02]">
        {/* Row 1: Search + 3 Dropdown-Search Filters */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* 1. Global Search */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by project name..."
              aria-label="Search by project name"
              className="h-10 w-full rounded-xl border border-gray-200 bg-white pl-9.5 pr-4 text-xs font-medium text-gray-800 placeholder:text-gray-400 shadow-xs focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-gray-500"
            />
          </div>

          {/* 2. Workspace Dropdown-Search Filter */}
          <DropdownSearch
            options={workspaceOptions}
            value={workspaceFilter}
            onChange={(val) => {
              setWorkspaceFilter(val);
              setPage(1);
            }}
            placeholder="All Workspaces"
            searchPlaceholder="Filter workspace..."
            leadingIcon={<Layers className="h-4 w-4" />}
            clearable
          />

          {/* 3. Project Status Dropdown-Search Filter */}
          <DropdownSearch
            options={statusOptions}
            value={statusFilter}
            onChange={(val) => {
              setStatusFilter(val);
              setPage(1);
            }}
            placeholder="All Statuses"
            searchPlaceholder="Filter status..."
            leadingIcon={<GitBranch className="h-4 w-4" />}
            clearable
          />

          {/* 4. Project Type Dropdown-Search Filter */}
          <DropdownSearch
            options={typeOptions}
            value={typeFilter}
            onChange={(val) => {
              setTypeFilter(val);
              setPage(1);
            }}
            placeholder="All Project Types"
            searchPlaceholder="Filter type..."
            leadingIcon={<Tag className="h-4 w-4" />}
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
              {totalRows} {totalRows === 1 ? 'project' : 'projects'} found
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Sort Field */}
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
              aria-label="Sort by field"
              className="h-9 rounded-xl border border-gray-200 bg-white px-3 text-xs font-medium text-gray-700 shadow-xs focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
            >
              <option value="name">Sort: Name</option>
              <option value="key">Sort: Key</option>
              <option value="start_date">Sort: Start Date</option>
              <option value="end_date">Sort: End Date</option>
              <option value="created_at">Sort: Created Date</option>
              <option value="updated_at">Sort: Updated Date</option>
            </select>

            {/* Order Direction */}
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

            {/* Limit Selector */}
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
        <DataTable<In_Project>
          columns={columns}
          data={listQuery.data?.items ?? []}
          getRowKey={(item) => item.id}
          isLoading={listQuery.isLoading}
          error={(listQuery.error as Error | null) ?? null}
          onRetry={() => void listQuery.refetch()}
          emptyTitle="No projects found"
          emptyDescription={
            hasActiveFilters
              ? 'Try modifying or clearing your filters to see more results.'
              : 'Create your first project to start tracking milestones and sprints.'
          }
          emptyAction={
            hasActiveFilters ? (
              <Button variant="outline" size="sm" onClick={resetAllFilters}>
                Clear all filters
              </Button>
            ) : (
              <Button size="sm" onClick={openCreateModal}>
                <Plus className="h-3.5 w-3.5" />
                <span>Create Project</span>
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

      {/* ─── Create / Edit Project Modal ────────────────────────────────────── */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => !isSubmitting && setIsFormOpen(false)}
        title={editingItem ? 'Edit Project' : 'Create New Project'}
        description={
          editingItem
            ? 'Update project properties, timeframe, and workspace association.'
            : 'Initialize a new project and assign initial metadata.'
        }
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Project Name"
            placeholder="e.g. Develop Project Monitoring IT"
            required
            error={errors.name?.message}
            {...register('name')}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Workspace Select */}
            <Controller
              name="workspace_id"
              control={control}
              render={({ field }) => (
                <DropdownSearch
                  label="Workspace"
                  required
                  placeholder="Select workspace..."
                  searchPlaceholder="Search workspace..."
                  options={workspaceOptions}
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.workspace_id?.message}
                  clearable={false}
                />
              )}
            />

            {/* Project Type Select */}
            <Controller
              name="project_type_id"
              control={control}
              render={({ field }) => (
                <DropdownSearch
                  label="Project Type"
                  required
                  placeholder="Select project type..."
                  searchPlaceholder="Search project type..."
                  options={typeOptions}
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.project_type_id?.message}
                  clearable={false}
                />
              )}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Project Status Select */}
            <div className="sm:col-span-1">
              <Controller
                name="project_status_id"
                control={control}
                render={({ field }) => (
                  <DropdownSearch
                    label="Project Status"
                    required
                    placeholder="Select status..."
                    searchPlaceholder="Search status..."
                    options={statusOptions}
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.project_status_id?.message}
                    clearable={false}
                  />
                )}
              />
            </div>

            {/* Start Date */}
            <div className="sm:col-span-1">
              <Input
                label="Start Date"
                type="date"
                required
                error={errors.start_date?.message}
                {...register('start_date')}
              />
            </div>

            {/* End Date */}
            <div className="sm:col-span-1">
              <Input
                label="End Date"
                type="date"
                required
                error={errors.end_date?.message}
                {...register('end_date')}
              />
            </div>
          </div>

          <Textarea
            label="Description"
            rows={3}
            placeholder="Provide architectural context or sprint deliverables..."
            error={errors.description?.message}
            {...register('description')}
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
              {editingItem ? 'Save Changes' : 'Create Project'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ─── Quick Change Status Modal ──────────────────────────────────────── */}
      <Modal
        isOpen={Boolean(statusChangeItem)}
        onClose={() => !changeStatusMutation.isPending && setStatusChangeItem(null)}
        title="Change Project Status"
        description={
          statusChangeItem
            ? `Update status for "${statusChangeItem.name}"`
            : 'Select new lifecycle status'
        }
        size="md"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setStatusChangeItem(null)}
              disabled={changeStatusMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleQuickStatusSubmit}
              disabled={!selectedNewStatusId}
              isLoading={changeStatusMutation.isPending}
            >
              Update Status
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Status comparison */}
          {statusChangeItem && (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50/70 p-3.5 dark:border-gray-800 dark:bg-white/[0.02]">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  Current Status
                </p>
                <div className="mt-1">
                  <StatusBadge
                    name={statusChangeItem.project_status?.name ?? 'Unknown'}
                    colorCode={statusChangeItem.project_status?.color_code}
                  />
                </div>
              </div>

              <ArrowRight className="h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500" />

              <div className="min-w-0 text-right">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  Target Status
                </p>
                <div className="mt-1 flex justify-end">
                  {statusesQuery.data?.items.find((s) => s.id === selectedNewStatusId) ? (
                    <StatusBadge
                      name={
                        statusesQuery.data.items.find((s) => s.id === selectedNewStatusId)!
                          .name
                      }
                      colorCode={
                        statusesQuery.data.items.find((s) => s.id === selectedNewStatusId)!
                          .color_code
                      }
                    />
                  ) : (
                    <span className="text-xs italic text-gray-400 dark:text-gray-500">
                      None selected
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Selectable list */}
          <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
            {statusesQuery.data?.items.map((st) => {
              const isSelected = selectedNewStatusId === st.id;
              const isCurrent =
                (statusChangeItem?.project_status_id ??
                  statusChangeItem?.project_status?.id) === st.id;
              const color = st.color_code || '#6366f1';

              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setSelectedNewStatusId(st.id)}
                  className={cn(
                    'group flex w-full items-center justify-between gap-3 rounded-xl border p-3 text-left transition-all duration-150 cursor-pointer',
                    isSelected
                      ? 'border-brand-500 bg-brand-50/70 ring-2 ring-brand-500/20 dark:border-brand-500 dark:bg-brand-950/40'
                      : 'border-gray-200/80 bg-white hover:border-gray-300 hover:bg-gray-50/60 dark:border-gray-800 dark:bg-gray-900/60 dark:hover:border-gray-700 dark:hover:bg-white/[0.03]',
                  )}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border shadow-2xs"
                      style={{
                        backgroundColor: `${color}18`,
                        borderColor: `${color}40`,
                        color: color,
                      }}
                    >
                      <GitBranch className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-gray-900 dark:text-white">
                          {st.name}
                        </span>
                        {isCurrent && (
                          <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                            Current
                          </span>
                        )}
                      </div>
                      {st.description && (
                        <p className="mt-0.5 line-clamp-1 text-[11px] text-gray-500 dark:text-gray-400">
                          {st.description}
                        </p>
                      )}
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

      {/* ─── Quick Change Type Modal ────────────────────────────────────────── */}
      <Modal
        isOpen={Boolean(typeChangeItem)}
        onClose={() => !changeTypeMutation.isPending && setTypeChangeItem(null)}
        title="Change Project Type"
        description={
          typeChangeItem
            ? `Update classification type for "${typeChangeItem.name}"`
            : 'Select new project type'
        }
        size="md"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setTypeChangeItem(null)}
              disabled={changeTypeMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleQuickTypeSubmit}
              disabled={!selectedNewTypeId}
              isLoading={changeTypeMutation.isPending}
            >
              Update Type
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Type comparison */}
          {typeChangeItem && (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50/70 p-3.5 dark:border-gray-800 dark:bg-white/[0.02]">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  Current Type
                </p>
                <div className="mt-1">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200/80 bg-indigo-50/80 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 dark:border-indigo-800/80 dark:bg-indigo-950/40 dark:text-indigo-300">
                    <Tag className="h-3 w-3" />
                    <span>{typeChangeItem.project_type?.name ?? 'Not classified'}</span>
                  </span>
                </div>
              </div>

              <ArrowRight className="h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500" />

              <div className="min-w-0 text-right">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  Target Type
                </p>
                <div className="mt-1 flex justify-end">
                  {typesQuery.data?.items.find((t) => t.id === selectedNewTypeId) ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200/80 bg-indigo-50/80 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 dark:border-indigo-800/80 dark:bg-indigo-950/40 dark:text-indigo-300">
                      <Tag className="h-3 w-3" />
                      <span>
                        {
                          typesQuery.data.items.find((t) => t.id === selectedNewTypeId)!
                            .name
                        }
                      </span>
                    </span>
                  ) : (
                    <span className="text-xs italic text-gray-400 dark:text-gray-500">
                      None selected
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Selectable list */}
          <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
            {typesQuery.data?.items.map((t) => {
              const isSelected = selectedNewTypeId === t.id;
              const isCurrent =
                (typeChangeItem?.project_type_id ??
                  typeChangeItem?.project_type?.id) === t.id;

              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedNewTypeId(t.id)}
                  className={cn(
                    'group flex w-full items-center justify-between gap-3 rounded-xl border p-3 text-left transition-all duration-150 cursor-pointer',
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50/70 ring-2 ring-indigo-500/20 dark:border-indigo-500 dark:bg-indigo-950/40'
                      : 'border-gray-200/80 bg-white hover:border-gray-300 hover:bg-gray-50/60 dark:border-gray-800 dark:bg-gray-900/60 dark:hover:border-gray-700 dark:hover:bg-white/[0.03]',
                  )}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-indigo-200/80 bg-indigo-50/80 text-indigo-700 shadow-2xs dark:border-indigo-800/80 dark:bg-indigo-950/40 dark:text-indigo-300">
                      <Tag className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-gray-900 dark:text-white">
                          {t.name}
                        </span>
                        {isCurrent && (
                          <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                            Current
                          </span>
                        )}
                      </div>
                      {t.description && (
                        <p className="mt-0.5 line-clamp-1 text-[11px] text-gray-500 dark:text-gray-400">
                          {t.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 pl-2">
                    <span
                      className={cn(
                        'flex h-5 w-5 items-center justify-center rounded-full border transition-all',
                        isSelected
                          ? 'border-indigo-600 bg-indigo-600 text-white dark:border-indigo-500 dark:bg-indigo-500'
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

      {/* ─── Delete Confirmation Dialog ─────────────────────────────────────── */}
      <ConfirmDialog
        isOpen={Boolean(deletingItem)}
        onClose={() => setDeletingItem(null)}
        onConfirm={handleDelete}
        title="Delete Project"
        description={
          deletingItem
            ? `Are you sure you want to permanently delete "${deletingItem.name}"? This action cannot be undone.`
            : 'Are you sure you want to delete this project?'
        }
        confirmLabel="Delete Project"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
