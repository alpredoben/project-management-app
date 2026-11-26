import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  CalendarDays,
  Check,
  CircleAlert,
  Clock,
  FolderKanban,
  GitBranch,
  Pencil,
  RotateCcw,
  Search,
  Tag,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DropdownSearch } from "@/components/ui/DropdownSearch";
import { Input, Textarea } from "@/components/ui/FormControls";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { useAppDispatch } from "@/store/hooks";
import { pushToast } from "@/store/slices/ui-slice";
import {
  formatDate,
  getPublicUrlExpression,
  slashed,
} from "@/shared/libs/helper";
import { cn } from "@/shared/libs/cn";
import { ROUTE_PATH_LIST } from "@/shared/constants";
import { projectApi } from "../api";
import { SchemaValidateProject, type FormPayloadProject } from "../schemas";
import { workspaceApi } from "@/features/workspace/api";
import { projectStatusApi } from "@/features/master-data/project-status/api";
import { projectTypeApi } from "@/features/master-data/project-types/api";

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
        className="h-10 w-10 shrink-0 rounded-xl object-cover border border-gray-200/80 dark:border-gray-700/80 shadow-xs"
      />
    );
  }

  const initials =
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0] ?? "")
      .join("")
      .toUpperCase() || "WS";

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-tr from-brand-600 to-indigo-500 text-xs font-bold text-white shadow-xs">
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

// ─── Detail Field Component (NO IDs DISPLAYED) ────────────────────────────────

function DetailField({
  icon,
  label,
  value,
  mono = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-4 rounded-xl border border-gray-100 bg-gray-50/60 p-4 transition-colors hover:bg-gray-50/90 dark:border-gray-800 dark:bg-white/2.5 dark:hover:bg-white/[0.04]">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
          {label}
        </p>
        <div
          className={`mt-1 text-sm font-medium text-gray-900 dark:text-white/90 break-words ${mono ? "font-mono" : ""}`}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton Loader Component ───────────────────────────────────────────────

function SkeletonField() {
  return (
    <div className="flex items-start gap-4 rounded-xl border border-gray-100 bg-gray-50/60 p-4 dark:border-gray-800 dark:bg-white/2.5">
      <div className="h-9 w-9 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
        <div className="h-4 w-40 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
      </div>
    </div>
  );
}

// ─── Main ProjectDetailPage Component ─────────────────────────────────────────

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  // ─── Modals State ───────────────────────────────────────────────────────────
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isChangeStatusOpen, setIsChangeStatusOpen] = useState(false);
  const [selectedStatusId, setSelectedStatusId] = useState("");
  const [statusSearch, setStatusSearch] = useState("");
  const [isChangeTypeOpen, setIsChangeTypeOpen] = useState(false);
  const [selectedTypeId, setSelectedTypeId] = useState("");
  const [typeSearch, setTypeSearch] = useState("");

  // ─── Queries & Mutations ────────────────────────────────────────────────────
  const findQuery = projectApi.query.useFindById(id ?? null);
  const updateMutation = projectApi.mutation.useUpdate();
  const deleteMutation = projectApi.mutation.useDelete();
  const changeStatusMutation = projectApi.mutation.useChangeStatus();
  const changeTypeMutation = projectApi.mutation.useChangeType();

  // Reference queries
  const workspacesQuery = workspaceApi.query.useFetchPaginationList({
    limit: 100,
  });
  const statusesQuery = projectStatusApi.query.useFetchPaginationList({
    limit: 100,
  });
  const typesQuery = projectTypeApi.query.useFetchPaginationList({
    limit: 100,
  });

  const project = findQuery.data;
  const currentStatusId =
    project?.project_status_id ?? project?.project_status?.id ?? "";
  const currentTypeId =
    project?.project_type_id ?? project?.project_type?.id ?? "";

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
        dotColor: s.color_code || "#6366f1",
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

  const filteredStatuses = useMemo(() => {
    const items = statusesQuery.data?.items ?? [];
    const q = statusSearch.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.description && s.description.toLowerCase().includes(q)),
    );
  }, [statusesQuery.data?.items, statusSearch]);

  const filteredTypes = useMemo(() => {
    const items = typesQuery.data?.items ?? [];
    const q = typeSearch.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q)),
    );
  }, [typesQuery.data?.items, typeSearch]);

  const selectedStatusItem = useMemo(
    () => statusesQuery.data?.items.find((s) => s.id === selectedStatusId),
    [statusesQuery.data?.items, selectedStatusId],
  );

  const selectedTypeItem = useMemo(
    () => typesQuery.data?.items.find((t) => t.id === selectedTypeId),
    [typesQuery.data?.items, selectedTypeId],
  );

  // ─── Edit Form Setup ────────────────────────────────────────────────────────
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormPayloadProject["Project"]>({
    resolver: zodResolver(SchemaValidateProject.project) as never,
  });

  const openEditModal = () => {
    if (!project) return;
    reset({
      workspace_id: project.workspace_id ?? project.workspace?.id ?? "",
      project_type_id:
        project.project_type_id ?? project.project_type?.id ?? "",
      project_status_id:
        project.project_status_id ?? project.project_status?.id ?? "",
      name: project.name,
      description: project.description ?? "",
      start_date: project.start_date ? project.start_date.slice(0, 10) : "",
      end_date: project.end_date ? project.end_date.slice(0, 10) : "",
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (values: FormPayloadProject["Project"]) => {
    if (!id) return;
    try {
      await updateMutation.mutateAsync({
        id,
        payload: values,
      });
      dispatch(
        pushToast({
          title: "Project updated",
          description: "Project details have been successfully updated.",
          variant: "success",
        }),
      );
      setIsEditOpen(false);
    } catch (err) {
      dispatch(
        pushToast({
          title: "Failed to update project",
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
          title: "Project deleted",
          description: "The project record has been deleted.",
          variant: "success",
        }),
      );
      navigate(slashed(ROUTE_PATH_LIST.PROJECT.PROJECT));
    } catch (err) {
      dispatch(
        pushToast({
          title: "Failed to delete project",
          description: err instanceof Error ? err.message : "An error occurred",
          variant: "error",
        }),
      );
    }
  };

  const handleQuickStatusSubmit = async () => {
    if (!id || !selectedStatusId) return;
    try {
      await changeStatusMutation.mutateAsync({
        id,
        payload: { project_status_id: selectedStatusId },
      });
      dispatch(
        pushToast({
          title: "Status updated",
          description: "Project lifecycle status has been updated.",
          variant: "success",
        }),
      );
      setIsChangeStatusOpen(false);
    } catch (err) {
      dispatch(
        pushToast({
          title: "Failed to update status",
          description: err instanceof Error ? err.message : "An error occurred",
          variant: "error",
        }),
      );
    }
  };

  const handleQuickTypeSubmit = async () => {
    if (!id || !selectedTypeId) return;
    try {
      await changeTypeMutation.mutateAsync({
        id,
        payload: { project_type_id: selectedTypeId },
      });
      dispatch(
        pushToast({
          title: "Project type updated",
          description: "Project classification type has been updated.",
          variant: "success",
        }),
      );
      setIsChangeTypeOpen(false);
    } catch (err) {
      dispatch(
        pushToast({
          title: "Failed to update type",
          description: err instanceof Error ? err.message : "An error occurred",
          variant: "error",
        }),
      );
    }
  };

  const goBack = () => navigate(slashed(ROUTE_PATH_LIST.PROJECT.PROJECT));

  // ── Missing ID Guard ────────────────────────────────────────────────────────
  if (!id) {
    return (
      <div className="space-y-5">
        <PageHeader
          title="Project Detail"
          description="View detailed project attributes and schedule."
        />
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          The project ID is missing from the URL.
          <Button variant="outline" size="sm" className="ml-3" onClick={goBack}>
            Back to projects
          </Button>
        </div>
      </div>
    );
  }

  // ── Loading State ───────────────────────────────────────────────────────────
  if (findQuery.isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Project Detail"
          description="Loading project specifications..."
          actions={
            <Button variant="outline" onClick={goBack}>
              <ArrowLeft className="h-4 w-4" />
              Back to projects
            </Button>
          }
        />
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="border-b border-gray-100 bg-gray-50/80 px-6 py-4 dark:border-gray-800 dark:bg-white/[0.02]">
            <div className="h-5 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
          </div>
          <div className="grid gap-4 p-6 sm:grid-cols-2">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <SkeletonField key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Error State ─────────────────────────────────────────────────────────────
  if (findQuery.error || !project) {
    return (
      <div className="space-y-5">
        <PageHeader
          title="Project Detail"
          description="View detailed project attributes and schedule."
          actions={
            <Button variant="outline" onClick={goBack}>
              <ArrowLeft className="h-4 w-4" />
              Back to projects
            </Button>
          }
        />
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-900/50 dark:bg-red-950/30">
          <div className="flex items-start gap-3 text-red-700 dark:text-red-300">
            <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" />
            <div className="min-w-0">
              <p className="font-semibold text-base">Unable to load project</p>
              <p className="mt-1 break-words text-sm text-red-600 dark:text-red-400">
                {findQuery.error?.message ??
                  "The requested project could not be found."}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void findQuery.refetch()}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Retry
                </Button>
                <Button variant="outline" size="sm" onClick={goBack}>
                  Back to list
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ─── Page Title & Action Bar (Actions Below Title) ───────────────────── */}
      <div className="space-y-4">
        <div>
          <h1 className="font-display text-xl font-semibold tracking-tight text-gray-900 sm:text-2xl dark:text-white/90">
            {project.workspace?.name}
          </h1>
        </div>

        {/* Action Buttons Row (Turun ke bawah judul) */}
        <div className="flex flex-wrap items-center gap-2 pt-0.5">
          <Button variant="outline" onClick={goBack} className="gap-1.5">
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setSelectedStatusId(currentStatusId);
              setStatusSearch("");
              setIsChangeStatusOpen(true);
            }}
            className="gap-1.5"
          >
            <GitBranch className="h-4 w-4 text-brand-600 dark:text-brand-400" />
            <span>Change Status</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setSelectedTypeId(currentTypeId);
              setTypeSearch("");
              setIsChangeTypeOpen(true);
            }}
            className="gap-1.5"
          >
            <Tag className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <span>Change Type</span>
          </Button>
          <Button onClick={openEditModal} className="gap-1.5">
            <Pencil className="h-4 w-4" />
            <span>Edit Project</span>
          </Button>
          <Button
            variant="danger"
            onClick={() => setIsDeleteOpen(true)}
            className="gap-1.5"
          >
            <Trash2 className="h-4 w-4" />
            <span>Delete</span>
          </Button>
        </div>
      </div>

      {/* ─── Hero Overview Card ──────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs dark:border-gray-800 dark:bg-white/[0.02]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-linear-to-tr from-brand-500 to-indigo-600 text-white shadow-md shadow-brand-500/20">
              <FolderKanban className="h-6 w-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="font-display text-xl font-bold text-gray-900 dark:text-white">
                  {project.name}
                </h2>
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Active in{" "}
                <span className="font-semibold text-gray-800 dark:text-gray-200">
                  {project.workspace?.name ?? "Assigned Workspace"}
                </span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Clickable Status Badge to trigger Change Status */}
            <button
              type="button"
              onClick={() => {
                setSelectedStatusId(currentStatusId);
                setStatusSearch("");
                setIsChangeStatusOpen(true);
              }}
              className="cursor-pointer transition-transform hover:scale-105 active:scale-95"
              title="Click to change status"
            >
              <StatusBadge
                name={project.project_status?.name ?? "Unknown Status"}
                colorCode={project.project_status?.color_code}
              />
            </button>

            <div className="cursor-pointer transition-transform hover:scale-105 active:scale-95">
              <StatusBadge name={project.key ?? ""} colorCode="#73027D" />
            </div>

            {/* Clickable Type Badge to trigger Change Type */}
            {project.project_type?.name && (
              <button
                type="button"
                onClick={() => {
                  setSelectedTypeId(currentTypeId);
                  setTypeSearch("");
                  setIsChangeTypeOpen(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200/80 bg-indigo-50/80 px-3 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100/80 transition-all cursor-pointer hover:scale-105 active:scale-95 dark:border-indigo-800/80 dark:bg-indigo-950/40 dark:text-indigo-300"
                title="Click to change project type"
              >
                <Tag className="h-3 w-3" />
                <span>{project.project_type.name}</span>
              </button>
            )}
          </div>
        </div>

        {project.description && (
          <div className="mt-5 rounded-xl border border-gray-100 bg-gray-50/70 p-4 text-xs text-gray-600 dark:border-gray-800/60 dark:bg-white/[0.015] dark:text-gray-300">
            <p className="font-semibold uppercase tracking-wider text-[10px] text-gray-400 dark:text-gray-500 mb-1">
              Project Description & Scope
            </p>
            <p className="leading-relaxed">{project.description}</p>
          </div>
        )}
      </div>

      {/* ─── Grid Information Cards (NO IDs DISPLAYED) ───────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Card 1: Workspace & Classification Context */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs dark:border-gray-800 dark:bg-white/[0.02]">
          <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4 dark:border-gray-800 dark:bg-white/[0.01]">
            <h3 className="font-display text-sm font-semibold text-gray-900 dark:text-white/90">
              Workspace & Classification
            </h3>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Contextual assignments and categorization.
            </p>
          </div>
          <div className="space-y-4 p-6">
            {/* Workspace detail item */}
            <div className="flex items-center gap-4 rounded-xl border border-gray-100 bg-gray-50/60 p-4 dark:border-gray-800 dark:bg-white/2.5">
              <WorkspaceLogoThumbnail
                url={project.workspace?.logo_url}
                name={project.workspace?.name ?? "Workspace"}
              />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  Workspace
                </p>
                <p className="mt-0.5 text-sm font-bold text-gray-900 dark:text-white">
                  {project.workspace?.name ?? "—"}
                </p>
                {project.workspace?.slug && (
                  <p className="font-mono text-xs text-gray-400 dark:text-gray-500">
                    {project.workspace.slug}
                  </p>
                )}
              </div>
            </div>

            <DetailField
              icon={<Tag className="h-4 w-4" />}
              label="Project Type"
              value={
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span>
                      {project.project_type?.name ?? "Not classified"}
                    </span>
                    {project.project_type?.description && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 font-normal">
                        {project.project_type.description}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedTypeId(currentTypeId);
                      setTypeSearch("");
                      setIsChangeTypeOpen(true);
                    }}
                    className="h-7 text-xs text-indigo-600 dark:text-indigo-400"
                  >
                    Change
                  </Button>
                </div>
              }
            />

            <DetailField
              icon={<GitBranch className="h-4 w-4" />}
              label="Lifecycle Status"
              value={
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {project.project_status?.name ?? "Not set"}
                    </span>
                    {project.project_status?.sequence_order !== undefined && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 font-normal">
                        Lifecycle Step #{project.project_status.sequence_order}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedStatusId(currentStatusId);
                      setStatusSearch("");
                      setIsChangeStatusOpen(true);
                    }}
                    className="h-7 text-xs text-brand-600 dark:text-brand-400"
                  >
                    Change
                  </Button>
                </div>
              }
            />
          </div>
        </div>

        {/* Card 2: Timeline & Audit Trail */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs dark:border-gray-800 dark:bg-white/[0.02]">
          <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4 dark:border-gray-800 dark:bg-white/[0.01]">
            <h3 className="font-display text-sm font-semibold text-gray-900 dark:text-white/90">
              Timeline & Schedule
            </h3>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Project lifespan, planned milestones, and audit timestamps.
            </p>
          </div>
          <div className="grid gap-4 p-6 sm:grid-cols-2">
            <DetailField
              icon={<Calendar className="h-4 w-4" />}
              label="Start Date"
              value={formatDate(project.start_date, "D MMMM YYYY")}
            />

            <DetailField
              icon={<CalendarDays className="h-4 w-4" />}
              label="Target End Date"
              value={formatDate(project.end_date, "D MMMM YYYY")}
            />

            <DetailField
              icon={<Clock className="h-4 w-4" />}
              label="Record Created At"
              value={formatDate(project.created_at)}
            />

            <DetailField
              icon={<Clock className="h-4 w-4" />}
              label="Last Updated At"
              value={formatDate(project.updated_at)}
            />
          </div>
        </div>
      </div>

      {/* ─── Edit Project Modal ──────────────────────────────────────────────── */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => !isSubmitting && setIsEditOpen(false)}
        title="Edit Project"
        description="Update project details, scope, and target timeframe."
        size="lg"
      >
        <form onSubmit={handleSubmit(handleEditSubmit)} className="space-y-4">
          <Input
            label="Project Name"
            placeholder="e.g. Develop Project Monitoring IT"
            required
            error={errors.name?.message}
            {...register("name")}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

            <div className="sm:col-span-1">
              <Input
                label="Start Date"
                type="date"
                required
                error={errors.start_date?.message}
                {...register("start_date")}
              />
            </div>

            <div className="sm:col-span-1">
              <Input
                label="End Date"
                type="date"
                required
                error={errors.end_date?.message}
                {...register("end_date")}
              />
            </div>
          </div>

          <Textarea
            label="Description"
            rows={3}
            placeholder="Provide context or sprint deliverables..."
            error={errors.description?.message}
            {...register("description")}
          />

          <div className="flex items-center justify-end gap-2.5 pt-3">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => setIsEditOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* ─── Change Status Modal (REFINED DESIGN) ───────────────────────────── */}
      <Modal
        isOpen={isChangeStatusOpen}
        onClose={() =>
          !changeStatusMutation.isPending && setIsChangeStatusOpen(false)
        }
        title="Change Project Status"
        description="Select the new lifecycle status for this project."
        size="md"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setIsChangeStatusOpen(false)}
              disabled={changeStatusMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleQuickStatusSubmit}
              disabled={
                !selectedStatusId || selectedStatusId === currentStatusId
              }
              isLoading={changeStatusMutation.isPending}
            >
              Update Status
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Transition Comparison Banner */}
          <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50/70 p-3.5 dark:border-gray-800 dark:bg-white/[0.02]">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Current Status
              </p>
              <div className="mt-1">
                <StatusBadge
                  name={project.project_status?.name ?? "Unknown"}
                  colorCode={project.project_status?.color_code}
                />
              </div>
            </div>

            <ArrowRight className="h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500" />

            <div className="min-w-0 text-right">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Target Status
              </p>
              <div className="mt-1 flex justify-end">
                {selectedStatusItem ? (
                  <StatusBadge
                    name={selectedStatusItem.name}
                    colorCode={selectedStatusItem.color_code}
                  />
                ) : (
                  <span className="text-xs italic text-gray-400 dark:text-gray-500">
                    None selected
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Search Box if list is long */}
          {(statusesQuery.data?.items?.length ?? 0) > 4 && (
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={statusSearch}
                onChange={(e) => setStatusSearch(e.target.value)}
                placeholder="Search status..."
                className="h-9 w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 text-xs text-gray-800 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-500"
              />
            </div>
          )}

          {/* Selectable Status Cards */}
          <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
            {filteredStatuses.length === 0 ? (
              <div className="p-6 text-center text-xs text-gray-400 dark:text-gray-500">
                No status matching "{statusSearch}"
              </div>
            ) : (
              filteredStatuses.map((st) => {
                const isSelected = selectedStatusId === st.id;
                const isCurrent = currentStatusId === st.id;
                const color = st.color_code || "#6366f1";

                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setSelectedStatusId(st.id)}
                    className={cn(
                      "group flex w-full items-center justify-between gap-3 rounded-xl border p-3 text-left transition-all duration-150 cursor-pointer",
                      isSelected
                        ? "border-brand-500 bg-brand-50/70 ring-2 ring-brand-500/20 dark:border-brand-500 dark:bg-brand-950/40"
                        : "border-gray-200/80 bg-white hover:border-gray-300 hover:bg-gray-50/60 dark:border-gray-800 dark:bg-gray-900/60 dark:hover:border-gray-700 dark:hover:bg-white/[0.03]",
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
                        {st.description ? (
                          <p className="mt-0.5 line-clamp-1 text-[11px] text-gray-500 dark:text-gray-400">
                            {st.description}
                          </p>
                        ) : (
                          st.sequence_order !== undefined && (
                            <p className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">
                              Lifecycle Step #{st.sequence_order}
                            </p>
                          )
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 pl-2">
                      <span
                        className={cn(
                          "flex h-5 w-5 items-center justify-center rounded-full border transition-all",
                          isSelected
                            ? "border-brand-600 bg-brand-600 text-white dark:border-brand-500 dark:bg-brand-500"
                            : "border-gray-300 bg-transparent text-transparent group-hover:border-gray-400 dark:border-gray-700",
                        )}
                      >
                        <Check className="h-3 w-3 stroke-[3]" />
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </Modal>

      {/* ─── Change Type Modal (REFINED DESIGN) ─────────────────────────────── */}
      <Modal
        isOpen={isChangeTypeOpen}
        onClose={() =>
          !changeTypeMutation.isPending && setIsChangeTypeOpen(false)
        }
        title="Change Project Type"
        description="Select the classification type for this project."
        size="md"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setIsChangeTypeOpen(false)}
              disabled={changeTypeMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleQuickTypeSubmit}
              disabled={!selectedTypeId || selectedTypeId === currentTypeId}
              isLoading={changeTypeMutation.isPending}
            >
              Update Type
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Transition Comparison Banner */}
          <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50/70 p-3.5 dark:border-gray-800 dark:bg-white/[0.02]">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Current Type
              </p>
              <div className="mt-1">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200/80 bg-indigo-50/80 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 dark:border-indigo-800/80 dark:bg-indigo-950/40 dark:text-indigo-300">
                  <Tag className="h-3 w-3" />
                  <span>{project.project_type?.name ?? "Not classified"}</span>
                </span>
              </div>
            </div>

            <ArrowRight className="h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500" />

            <div className="min-w-0 text-right">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Target Type
              </p>
              <div className="mt-1 flex justify-end">
                {selectedTypeItem ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200/80 bg-indigo-50/80 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 dark:border-indigo-800/80 dark:bg-indigo-950/40 dark:text-indigo-300">
                    <Tag className="h-3 w-3" />
                    <span>{selectedTypeItem.name}</span>
                  </span>
                ) : (
                  <span className="text-xs italic text-gray-400 dark:text-gray-500">
                    None selected
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Search Box if list is long */}
          {(typesQuery.data?.items?.length ?? 0) > 4 && (
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={typeSearch}
                onChange={(e) => setTypeSearch(e.target.value)}
                placeholder="Search type..."
                className="h-9 w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 text-xs text-gray-800 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-500"
              />
            </div>
          )}

          {/* Selectable Type Cards */}
          <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
            {filteredTypes.length === 0 ? (
              <div className="p-6 text-center text-xs text-gray-400 dark:text-gray-500">
                No type matching "{typeSearch}"
              </div>
            ) : (
              filteredTypes.map((t) => {
                const isSelected = selectedTypeId === t.id;
                const isCurrent = currentTypeId === t.id;

                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedTypeId(t.id)}
                    className={cn(
                      "group flex w-full items-center justify-between gap-3 rounded-xl border p-3 text-left transition-all duration-150 cursor-pointer",
                      isSelected
                        ? "border-indigo-500 bg-indigo-50/70 ring-2 ring-indigo-500/20 dark:border-indigo-500 dark:bg-indigo-950/40"
                        : "border-gray-200/80 bg-white hover:border-gray-300 hover:bg-gray-50/60 dark:border-gray-800 dark:bg-gray-900/60 dark:hover:border-gray-700 dark:hover:bg-white/[0.03]",
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
                          "flex h-5 w-5 items-center justify-center rounded-full border transition-all",
                          isSelected
                            ? "border-indigo-600 bg-indigo-600 text-white dark:border-indigo-500 dark:bg-indigo-500"
                            : "border-gray-300 bg-transparent text-transparent group-hover:border-gray-400 dark:border-gray-700",
                        )}
                      >
                        <Check className="h-3 w-3 stroke-[3]" />
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </Modal>

      {/* ─── Delete Confirmation Dialog (NO ID IN DIALOG) ───────────────────── */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Project"
        description={`Are you sure you want to permanently delete "${project.name}"? This action cannot be undone.`}
        confirmLabel="Delete Project"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
