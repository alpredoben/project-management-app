import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  Calendar,
  CalendarClock,
  CheckSquare,
  CircleAlert,
  Clock,
  FileText,
  Flag,
  FolderKanban,
  GitBranch,
  Hash,
  Pencil,
  Tag,
  Trash2,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DropdownSearch } from "@/components/ui/DropdownSearch";
import { Input, Select, Textarea } from "@/components/ui/FormControls";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { useAppDispatch } from "@/store/hooks";
import { pushToast } from "@/store/slices/ui-slice";
import { formatDate, slashed } from "@/shared/libs/helper";
import { ROUTE_PATH_LIST } from "@/shared/constants";
import { taskApi } from "../api";
import { SchemaValidateTask, type FormPayloadTask } from "../schemas";
import { projectApi } from "@/features/projects/api";
import { milestoneApi } from "@/features/milestone/api";
import { taskTypeApi } from "@/features/master-data/task-types/api";
import { taskStatusApi } from "@/features/master-data/task-status/api";
import { userAccessApi } from "@/features/access-control/api/access-control-api";

// ─── Constants & Badges ───────────────────────────────────────────────────────

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

const PRIORITY_STYLES: Record<string, string> = {
  low: "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300",
  medium:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800/70 dark:bg-amber-950/40 dark:text-amber-300",
  high: "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800/70 dark:bg-orange-950/40 dark:text-orange-300",
  urgent:
    "border-red-200 bg-red-50 text-red-700 dark:border-red-800/70 dark:bg-red-950/40 dark:text-red-300",
};

function PriorityBadge({ priority }: { priority?: string | null }) {
  const normalized = (priority ?? "medium").toLowerCase();
  const style = PRIORITY_STYLES[normalized] ?? PRIORITY_STYLES.medium;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold capitalize ${style}`}
    >
      <Flag className="h-3 w-3" />
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
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold tracking-wide border shadow-2xs"
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
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: customColor || "#6366f1" }}
      />
      <span className={!customColor ? "text-gray-700 dark:text-gray-300" : ""}>
        {name}
      </span>
    </span>
  );
}

// ─── DetailField Component ────────────────────────────────────────────────────

function DetailField({
  icon,
  label,
  value,
  mono = false,
  className = "",
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`flex items-start gap-4 rounded-xl border border-gray-100 bg-gray-50/60 p-4 transition-colors hover:bg-gray-50/90 dark:border-gray-800 dark:bg-white/[0.025] dark:hover:bg-white/[0.04] ${className}`}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
          {label}
        </p>
        <div
          className={`mt-1 text-sm font-medium text-gray-900 dark:text-white/90 break-words ${
            mono ? "font-mono" : ""
          }`}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton Loader ──────────────────────────────────────────────────────────

function SkeletonField() {
  return (
    <div className="flex items-start gap-4 rounded-xl border border-gray-100 bg-gray-50/60 p-4 dark:border-gray-800 dark:bg-white/[0.025]">
      <div className="h-9 w-9 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
        <div className="h-4 w-40 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
      </div>
    </div>
  );
}

// ─── Main TaskDetailPage Component ────────────────────────────────────────────

export function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();

  const fromPath = (location.state as { from?: string } | null)?.from;

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // ─── Queries & Mutations ────────────────────────────────────────────────────
  const findQuery = taskApi.query.useFindById(id ?? null);
  const updateMutation = taskApi.mutation.useUpdate();
  const deleteMutation = taskApi.mutation.useDelete();

  const projectsQuery = projectApi.query.useFetchPaginationList({ limit: 100 });
  const milestonesQuery = milestoneApi.query.useFetchPaginationList({
    limit: 100,
  });
  const taskTypesQuery = taskTypeApi.query.useFetchPaginationList({
    limit: 100,
  });
  const taskStatusesQuery = taskStatusApi.query.useFetchPaginationList({
    limit: 100,
  });
  const usersQuery = userAccessApi.query.useUsersList();

  const task = findQuery.data;

  const picUser = useMemo(() => {
    if (!task?.user_requested_id) return null;
    return (
      usersQuery.data?.find((u) => u.id === task.user_requested_id) ?? null
    );
  }, [task?.user_requested_id, usersQuery.data]);

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
        dotColor: s.color_code || "#6366f1",
      })) ?? [],
    [taskStatusesQuery.data?.items],
  );

  // ─── Edit Form Setup ────────────────────────────────────────────────────────
  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormPayloadTask["Task"]>({
    resolver: zodResolver(SchemaValidateTask.task) as never,
  });

  const watchedProjectId = watch("project_id");

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

  const goBack = () => {
    if (fromPath) {
      navigate(fromPath);
    } else if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(slashed(ROUTE_PATH_LIST.TASK.TASK));
    }
  };

  const openEditModal = () => {
    if (!task) return;
    reset({
      project_id: task.project_id ?? task.project?.id ?? "",
      milestone_id: task.milestone_id ?? task.milestone?.id ?? "",
      task_type_id: task.task_type_id ?? task.task_type?.id ?? "",
      task_status_id: task.task_status_id ?? task.task_status?.id ?? "",
      title: task.title,
      description: task.description ?? "",
      priority: task.priority ?? "medium",
      estimated_hours: task.estimated_hours ? Number(task.estimated_hours) : 0,
      start_date: task.start_date ? task.start_date.slice(0, 10) : "",
      end_date: task.end_date ? task.end_date.slice(0, 10) : "",
      mom_number: task.mom_number ?? "",
      mom_date: task.mom_date ? task.mom_date.slice(0, 10) : "",
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (values: FormPayloadTask["Task"]) => {
    if (!id) return;
    try {
      await updateMutation.mutateAsync({ id, values });
      dispatch(
        pushToast({
          title: "Task updated",
          description: "Task details have been successfully updated.",
          variant: "success",
        }),
      );
      setIsEditOpen(false);
    } catch (err) {
      dispatch(
        pushToast({
          title: "Failed to update task",
          description: err instanceof Error ? err.message : "An error occurred",
          variant: "error",
        }),
      );
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deleteMutation.mutateAsync(id);
      dispatch(
        pushToast({
          title: "Task deleted",
          description: "The task has been removed.",
          variant: "success",
        }),
      );
      goBack();
    } catch (err) {
      dispatch(
        pushToast({
          title: "Failed to delete task",
          description: err instanceof Error ? err.message : "An error occurred",
          variant: "error",
        }),
      );
    }
  };

  // ─── Missing ID Guard ───────────────────────────────────────────────────────
  if (!id) {
    return (
      <div className="space-y-5">
        <PageHeader
          title="Task Detail"
          description="View detailed information about a task."
        />
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          The task ID is missing from the URL.
          <Button variant="outline" size="sm" className="ml-3" onClick={goBack}>
            Back to list
          </Button>
        </div>
      </div>
    );
  }

  // ─── Loading State ──────────────────────────────────────────────────────────
  if (findQuery.isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Task Detail" description="Loading task details..." />
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <div className="grid gap-4 sm:grid-cols-2">
            <SkeletonField />
            <SkeletonField />
            <SkeletonField />
            <SkeletonField />
          </div>
        </div>
      </div>
    );
  }

  // ─── Error State ────────────────────────────────────────────────────────────
  if (findQuery.isError || !task) {
    return (
      <div className="space-y-5">
        <PageHeader
          title="Task Detail"
          description="View detailed information about a task."
        />
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 dark:border-red-900/50 dark:bg-red-950/30">
          <div className="flex items-start gap-3 text-red-700 dark:text-red-300">
            <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-semibold">
                Failed to load task details
              </p>
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                {findQuery.error?.message ?? "Record not found."}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={goBack}
              >
                Back to tasks
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const projectId = task.project_id ?? task.project?.id;
  const milestoneId = task.milestone_id ?? task.milestone?.id;

  return (
    <div className="space-y-6">
      {/* ─── Header & Actions ───────────────────────────────────────────────── */}
      <PageHeader
        title={task?.title ?? ""}
        description={task?.task_key ?? ""}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goBack}
              className="gap-1.5"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={openEditModal}
              className="gap-1.5"
            >
              <Pencil className="h-4 w-4" />
              <span>Edit</span>
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setIsDeleteOpen(true)}
              className="gap-1.5"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete</span>
            </Button>
          </div>
        }
      />

      {/* ─── Hero Overview Card ─────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-xs dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {task.task_status && (
                <StatusBadge
                  name={`Status \u2192 ${task.task_status.name}`}
                  colorCode={task.task_status.color_code}
                />
              )}
              <PriorityBadge priority={`Priority \u2192 ${task.priority}`} />
              {task.task_type && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200/80 bg-indigo-50/80 px-3 py-1 text-xs font-semibold text-indigo-700 dark:border-indigo-800/80 dark:bg-indigo-950/40 dark:text-indigo-300">
                  <Tag className="h-3 w-3" />
                  {`Type \u2192 ${task.task_type.name}`}
                </span>
              )}
            </div>

            {task.description && (
              <div>
                <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">
                  Description
                </h3>
                <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                  {task.description}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Record Information Card ────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs dark:border-gray-800 dark:bg-gray-900">
        <div className="border-b border-gray-100 bg-gray-50/80 px-6 py-4 dark:border-gray-800 dark:bg-white/[0.02]">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">
            Record Information
          </h3>
        </div>

        <div className="grid gap-4 p-6 sm:grid-cols-2">
          <DetailField
            icon={<Hash className="h-4 w-4" />}
            label="Task Key"
            mono
            value={task.task_key ?? "—"}
          />

          <DetailField
            icon={<FolderKanban className="h-4 w-4" />}
            label="Project"
            value={
              task.project ? (
                projectId ? (
                  <Link
                    to={slashed(
                      ROUTE_PATH_LIST.PROJECT.PROJECT_DETAIL(projectId),
                    )}
                    className="text-brand-600 hover:underline dark:text-brand-400"
                  >
                    {task.project.name}
                    {task.project.key ? ` (${task.project.key})` : ""}
                  </Link>
                ) : (
                  task.project.name
                )
              ) : (
                "—"
              )
            }
          />

          <DetailField
            icon={<CheckSquare className="h-4 w-4" />}
            label="Milestone"
            value={
              task.milestone ? (
                milestoneId ? (
                  <Link
                    to={slashed(
                      ROUTE_PATH_LIST.MILESTONE.MILESTONE_DETAIL(milestoneId),
                    )}
                    className="text-brand-600 hover:underline dark:text-brand-400"
                  >
                    {task.milestone.title}
                  </Link>
                ) : (
                  task.milestone.title
                )
              ) : (
                "—"
              )
            }
          />

          <DetailField
            icon={<User className="h-4 w-4" />}
            label="PIC (Requested By)"
            value={
              task.user_requested_id ? (
                picUser ? (
                  <span>
                    {picUser.name}
                    {picUser.email ? ` (${picUser.email})` : ""}
                  </span>
                ) : (
                  <span className="font-mono text-xs">
                    {task.user_requested_id}
                  </span>
                )
              ) : (
                <span className="text-gray-400 font-normal">Unassigned</span>
              )
            }
          />

          <DetailField
            icon={<Tag className="h-4 w-4" />}
            label="Task Type"
            value={
              task.task_type ? (
                <div>
                  <span>{task.task_type.name}</span>
                  {task.task_type.description && (
                    <p className="mt-0.5 text-xs font-normal text-gray-500 dark:text-gray-400">
                      {task.task_type.description}
                    </p>
                  )}
                </div>
              ) : (
                "—"
              )
            }
          />

          <DetailField
            icon={<GitBranch className="h-4 w-4" />}
            label="Task Status"
            value={
              task.task_status ? (
                <StatusBadge
                  name={task.task_status.name}
                  colorCode={task.task_status.color_code}
                />
              ) : (
                "—"
              )
            }
          />

          <DetailField
            icon={<Calendar className="h-4 w-4" />}
            label="Timeline"
            value={
              <span>
                {task.start_date
                  ? formatDate(task.start_date, "D MMM YYYY")
                  : "—"}{" "}
                –{" "}
                {task.end_date ? formatDate(task.end_date, "D MMM YYYY") : "—"}
              </span>
            }
          />

          <DetailField
            icon={<Clock className="h-4 w-4" />}
            label="Estimated Hours"
            value={
              task.estimated_hours !== undefined &&
              task.estimated_hours !== null
                ? `${Number(task.estimated_hours)} hours`
                : "—"
            }
          />

          <DetailField
            icon={<FileText className="h-4 w-4" />}
            label="MoM Number"
            mono
            value={task.mom_number || "—"}
          />

          <DetailField
            icon={<Calendar className="h-4 w-4" />}
            label="MoM Date"
            value={
              task.mom_date ? formatDate(task.mom_date, "D MMM YYYY") : "—"
            }
          />

          <DetailField
            icon={<CalendarClock className="h-4 w-4" />}
            label="Created At"
            value={formatDate(task.created_at)}
          />

          <DetailField
            icon={<CalendarClock className="h-4 w-4" />}
            label="Updated At"
            value={formatDate(task.updated_at)}
          />
        </div>
      </div>

      {/* ─── Edit Task Modal ────────────────────────────────────────────────── */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Task"
        description={`Update task "${task.title}".`}
        size="lg"
        footer={
          <>
            <Button
              variant="outline"
              type="button"
              onClick={() => setIsEditOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="task-detail-edit-form"
              isLoading={updateMutation.isPending}
            >
              Save Changes
            </Button>
          </>
        }
      >
        <form
          id="task-detail-edit-form"
          onSubmit={handleSubmit(handleEditSubmit)}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                    setValue("milestone_id", "");
                  }}
                  placeholder="Select project"
                  searchPlaceholder="Search project..."
                  leadingIcon={<FolderKanban className="h-4 w-4" />}
                  error={errors.project_id?.message}
                />
              )}
            />

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

          <Input
            label="Task Title"
            required
            error={errors.title?.message}
            {...register("title")}
          />

          <Textarea
            label="Description"
            rows={3}
            error={errors.description?.message}
            {...register("description")}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              label="Priority"
              required
              options={PRIORITY_OPTIONS}
              error={errors.priority?.message}
              {...register("priority")}
            />

            <Input
              label="Estimated Hours"
              type="number"
              step="0.5"
              min="0"
              error={errors.estimated_hours?.message}
              {...register("estimated_hours")}
            />

            <Input
              label="Start Date"
              type="date"
              required
              error={errors.start_date?.message}
              {...register("start_date")}
            />

            <Input
              label="End Date"
              type="date"
              required
              error={errors.end_date?.message}
              {...register("end_date")}
            />

            <Input
              label="MoM Number"
              error={errors.mom_number?.message}
              {...register("mom_number")}
            />

            <Input
              label="MoM Date"
              type="date"
              error={errors.mom_date?.message}
              {...register("mom_date")}
            />
          </div>
        </form>
      </Modal>

      {/* ─── Delete Confirmation Dialog ─────────────────────────────────────── */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={() => void handleDelete()}
        title="Delete Task"
        description={`Are you sure you want to delete task "${task.title}"? This action cannot be undone.`}
        confirmLabel="Delete Task"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

export default TaskDetailPage;
