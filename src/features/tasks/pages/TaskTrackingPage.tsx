import { useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowLeft,
  CalendarRange,
  CheckSquare,
  CircleAlert,
  FolderKanban,
  GitBranch,
  Kanban,
  ListChecks,
  Plus,
  Search,
  Tag,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { DropdownSearch } from '@/components/ui/DropdownSearch';
import { Input, Select, Textarea } from '@/components/ui/FormControls';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/PageHeader';
import { useAppDispatch } from '@/store/hooks';
import { pushToast } from '@/store/slices/ui-slice';
import { slashed } from '@/shared/libs/helper';
import { cn } from '@/shared/libs/cn';
import { ROUTE_PATH_LIST } from '@/shared/constants';
import { taskApi } from '../api';
import { SchemaValidateTask, type FormPayloadTask } from '../schemas';
import { projectApi } from '@/features/projects/api';
import { milestoneApi } from '@/features/milestone/api';
import { taskTypeApi } from '@/features/master-data/task-types/api';
import { taskStatusApi } from '@/features/master-data/task-status/api';
import { ListTaskScreen } from './task-tracking/ListTaskScreen';
import { BoardScreen } from './BoardScreen';
import { TimelineScreen } from './TimelineScreen';

// ─── Helpers ──────────────────────────────────────────────────────────────────

type BoardViewTab = 'boards' | 'list' | 'timeline';

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

// ─── Main TaskTrackingPage Component ──────────────────────────────────────────

export function TaskTrackingPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();

  const goToTaskDetail = (taskId: string) => {
    navigate(slashed(ROUTE_PATH_LIST.TASK.TASK_DETAIL(taskId)), {
      state: { from: `${location.pathname}${location.search}` },
    });
  };

  const [activeTab, setActiveTab] = useState<BoardViewTab>('boards');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // ─── Queries & Mutations ────────────────────────────────────────────────────
  const projectQuery = projectApi.query.useFindById(projectId ?? null);
  const statusesQuery = taskStatusApi.query.useFetchAll();
  const trackingQuery = taskApi.query.useFetchTaskTracking(projectId ?? null);

  // Reference data for Create Task Modal
  const milestonesQuery = milestoneApi.query.useFetchPaginationList({
    limit: 100,
    project_id: projectId || undefined,
  });
  const taskTypesQuery = taskTypeApi.query.useFetchPaginationList({
    limit: 100,
  });
  const createMutation = taskApi.mutation.useCreate();

  // ─── Filtered Tasks ─────────────────────────────────────────────────────────
  const filteredTasks = useMemo(() => {
    const items = trackingQuery.data ?? [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q)) ||
        (t.task_type?.name && t.task_type.name.toLowerCase().includes(q)),
    );
  }, [trackingQuery.data, searchQuery]);

  const milestoneOptions = useMemo(
    () =>
      milestonesQuery.data?.items.map((m) => ({
        value: m.id,
        label: m.title,
        subLabel: m.project?.name || undefined,
      })) ?? [],
    [milestonesQuery.data?.items],
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
      statusesQuery.data?.map((s) => ({
        value: s.id,
        label: s.name,
        dotColor: s.color_code || '#6366f1',
      })) ?? [],
    [statusesQuery.data],
  );

  // ─── Create Task Form ───────────────────────────────────────────────────────
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormPayloadTask['Task']>({
    resolver: zodResolver(SchemaValidateTask.task) as never,
    defaultValues: {
      project_id: projectId ?? '',
      milestone_id: '',
      task_type_id: '',
      task_status_id: '',
      title: '',
      description: '',
      priority: 'medium',
      estimated_hours: 4,
      start_date: '',
      end_date: '',
      mom_number: '',
      mom_date: '',
    },
  });

  const openNewTaskModal = (defaultStatusId?: string) => {
    reset({
      project_id: projectId ?? '',
      milestone_id: milestoneOptions[0]?.value ?? '',
      task_type_id: taskTypeOptions[0]?.value ?? '',
      task_status_id:
        defaultStatusId || taskStatusOptions[0]?.value || '',
      title: '',
      description: '',
      priority: 'medium',
      estimated_hours: 4,
      start_date: '',
      end_date: '',
      mom_number: '',
      mom_date: '',
    });
    setIsCreateOpen(true);
  };

  const onCreateSubmit = async (values: FormPayloadTask['Task']) => {
    try {
      await createMutation.mutateAsync({
        ...values,
        project_id: projectId ?? values.project_id,
      });
      dispatch(
        pushToast({
          title: 'Task created',
          description: 'New task has been added to the board.',
          variant: 'success',
        }),
      );
      setIsCreateOpen(false);
    } catch (err) {
      dispatch(
        pushToast({
          title: 'Failed to create task',
          description: err instanceof Error ? err.message : 'An error occurred',
          variant: 'error',
        }),
      );
    }
  };

  const goBackToProject = () => {
    if (projectId) {
      navigate(slashed(ROUTE_PATH_LIST.PROJECT.PROJECT_DETAIL(projectId)));
    } else {
      navigate(slashed(ROUTE_PATH_LIST.PROJECT.PROJECT));
    }
  };

  if (!projectId) {
    return (
      <div className="space-y-5">
        <PageHeader
          title="Task Tracking"
          description="Project task tracking board."
        />
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          Project ID is missing from the URL.
          <Button
            variant="outline"
            size="sm"
            className="ml-3"
            onClick={goBackToProject}
          >
            Back to projects
          </Button>
        </div>
      </div>
    );
  }

  const isLoading = statusesQuery.isLoading || trackingQuery.isLoading;
  const error = statusesQuery.error || trackingQuery.error;

  return (
    <div className="space-y-6">
      {/* ─── Header ─────────────────────────────────────────────────────────── */}
      <PageHeader
        title={
          projectQuery.data?.name
            ? `Task Tracking — ${projectQuery.data.name}`
            : 'Task Tracking'
        }
        description="Visualize task workflow across status boards, assigners, and deadlines."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goBackToProject}
              className="gap-1.5"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Project</span>
            </Button>
            <Button
              size="sm"
              onClick={() => openNewTaskModal()}
              className="gap-1.5"
            >
              <Plus className="h-4 w-4" />
              <span>New Task</span>
            </Button>
          </div>
        }
      />

      {/* ─── Main Board Container ───────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-50/50 shadow-xs dark:border-gray-800 dark:bg-white/[0.02]">
        {/* Top Bar: View Tabs + Search */}
        <div className="flex flex-col gap-3 border-b border-gray-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800 dark:bg-gray-900">
          {/* Tabs */}
          <div className="flex flex-wrap items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('list')}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer',
                activeTab === 'list'
                  ? 'border border-gray-200 bg-gray-50 font-semibold text-gray-900 shadow-2xs dark:border-gray-700 dark:bg-gray-800 dark:text-white'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200',
              )}
            >
              <ListChecks className="h-3.5 w-3.5" />
              <span>Lists Task</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('boards')}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer',
                activeTab === 'boards'
                  ? 'border border-gray-200 bg-gray-50 font-semibold text-gray-900 shadow-2xs dark:border-gray-700 dark:bg-gray-800 dark:text-white'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200',
              )}
            >
              <Kanban className="h-3.5 w-3.5" />
              <span>Board</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('timeline')}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer',
                activeTab === 'timeline'
                  ? 'border border-gray-200 bg-gray-50 font-semibold text-gray-900 shadow-2xs dark:border-gray-700 dark:bg-gray-800 dark:text-white'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200',
              )}
            >
              <CalendarRange className="h-3.5 w-3.5" />
              <span>Timeline</span>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Tasks"
              aria-label="Search Tasks"
              className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50/70 pl-8.5 pr-8 text-xs font-medium text-gray-800 placeholder:text-gray-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800/70 dark:text-white dark:placeholder:text-gray-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-5">
          {isLoading ? (
            <div className="flex gap-4 overflow-x-auto pb-2">
              {[0, 1, 2, 3, 4].map((col) => (
                <div
                  key={col}
                  className="w-[290px] shrink-0 space-y-3 rounded-xl border border-gray-200/70 bg-white/60 p-3 dark:border-gray-800 dark:bg-gray-900/40"
                >
                  <div className="h-9 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />
                  <div className="h-28 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800/60" />
                  <div className="h-28 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800/60" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-5 dark:border-red-900/50 dark:bg-red-950/30">
              <div className="flex items-start gap-3 text-red-700 dark:text-red-300">
                <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold">
                    Unable to load task tracking board
                  </p>
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    {error instanceof Error ? error.message : 'An error occurred'}
                  </p>
                </div>
              </div>
            </div>
          ) : activeTab === 'list' ? (
            <ListTaskScreen tasks={filteredTasks} onTaskClick={goToTaskDetail} />
          ) : activeTab === 'boards' ? (
            <BoardScreen
              tasks={filteredTasks}
              statuses={statusesQuery.data ?? []}
              onTaskClick={goToTaskDetail}
              onCreateTask={openNewTaskModal}
            />
          ) : (
            <TimelineScreen tasks={filteredTasks} onTaskClick={goToTaskDetail} />
          )}
        </div>
      </div>
      {/* ─── Create New Task Modal ──────────────────────────────────────────── */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="New Task"
        description={
          projectQuery.data?.name
            ? `Create a new task for project "${projectQuery.data.name}".`
            : 'Create a new task in this project.'
        }
        size="lg"
        footer={
          <>
            <Button
              variant="outline"
              type="button"
              onClick={() => setIsCreateOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="task-tracking-create-form"
              isLoading={createMutation.isPending}
            >
              Create Task
            </Button>
          </>
        }
      >
        <form
          id="task-tracking-create-form"
          onSubmit={handleSubmit(onCreateSubmit)}
          className="space-y-4"
        >
          {/* Project (locked display) */}
          <div className="rounded-xl border border-gray-200/80 bg-gray-50/70 px-3.5 py-2.5 dark:border-gray-800 dark:bg-white/[0.02]">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              Project
            </p>
            <div className="mt-0.5 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
              <FolderKanban className="h-4 w-4 text-brand-500" />
              <span>{projectQuery.data?.name ?? projectId}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                  placeholder="Select milestone"
                  searchPlaceholder="Search milestone..."
                  leadingIcon={<CheckSquare className="h-4 w-4" />}
                  error={errors.milestone_id?.message}
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
                  placeholder="Select status"
                  searchPlaceholder="Search status..."
                  leadingIcon={<GitBranch className="h-4 w-4" />}
                  error={errors.task_status_id?.message}
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

            {/* Priority */}
            <Select
              label="Priority"
              required
              options={PRIORITY_OPTIONS}
              error={errors.priority?.message}
              {...register('priority')}
            />
          </div>

          <Input
            label="Task Title"
            placeholder="e.g. Create Layout Login Web Page"
            required
            error={errors.title?.message}
            {...register('title')}
          />

          <Textarea
            label="Description"
            placeholder="Describe task deliverables or notes..."
            rows={3}
            error={errors.description?.message}
            {...register('description')}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Estimated Hours"
              type="number"
              step="0.5"
              min="0"
              error={errors.estimated_hours?.message}
              {...register('estimated_hours')}
            />

            <Input
              label="MoM Number"
              placeholder="e.g. DIR/001/002/2026"
              error={errors.mom_number?.message}
              {...register('mom_number')}
            />

            <Input
              label="Start Date"
              type="date"
              required
              error={errors.start_date?.message}
              {...register('start_date')}
            />

            <Input
              label="End Date"
              type="date"
              required
              error={errors.end_date?.message}
              {...register('end_date')}
            />

            <Input
              label="MoM Date"
              type="date"
              error={errors.mom_date?.message}
              {...register('mom_date')}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default TaskTrackingPage;
