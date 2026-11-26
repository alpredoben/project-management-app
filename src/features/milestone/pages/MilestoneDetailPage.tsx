import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  CircleAlert,
  Clock,
  Flag,
  FolderKanban,
  Pencil,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DropdownSearch } from '@/components/ui/DropdownSearch';
import { Input } from '@/components/ui/FormControls';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/PageHeader';
import { useAppDispatch } from '@/store/hooks';
import { pushToast } from '@/store/slices/ui-slice';
import { formatDate, slashed } from '@/shared/libs/helper';
import { cn } from '@/shared/libs/cn';
import { ROUTE_PATH_LIST } from '@/shared/constants';
import { milestoneApi } from '../api';
import {
  SchemaValidateMilestone,
  type FormPayloadMilestone,
} from '../schemas';
import { projectApi } from '@/features/projects/api';
import { MilestoneStatusBadge } from './MilestonePage';

const MILESTONE_STATUS_OPTIONS = [
  { value: 'open', label: 'Open', subLabel: 'Active milestone target', dotColor: '#0ea5e9' },
  { value: 'finish', label: 'Finished', subLabel: 'Milestone target achieved', dotColor: '#10b981' },
] as const;

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
          className={`mt-1 text-sm font-medium text-gray-900 dark:text-white/90 break-words ${mono ? 'font-mono' : ''}`}
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

// ─── Main MilestoneDetailPage Component ───────────────────────────────────────

export function MilestoneDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  // ─── Modals State ───────────────────────────────────────────────────────────
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isChangeStatusOpen, setIsChangeStatusOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('open');

  // ─── Queries & Mutations ────────────────────────────────────────────────────
  const findQuery = milestoneApi.query.useFindById(id ?? null);
  const updateMutation = milestoneApi.mutation.useUpdate();
  const deleteMutation = milestoneApi.mutation.useDelete();

  // Reference queries
  const projectsQuery = projectApi.query.useFetchPaginationList({ limit: 100 });

  const milestone = findQuery.data;
  const currentStatus = milestone?.status ?? 'open';

  const projectOptions = useMemo(
    () =>
      projectsQuery.data?.items.map((p) => ({
        value: p.id,
        label: p.name,
        subLabel: p.key || (p.workspace?.name ? `Workspace: ${p.workspace.name}` : undefined),
      })) ?? [],
    [projectsQuery.data?.items],
  );

  // ─── Edit Form Setup ────────────────────────────────────────────────────────
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormPayloadMilestone['Milestone']>({
    resolver: zodResolver(SchemaValidateMilestone.milestone) as never,
  });

  const openEditModal = () => {
    if (!milestone) return;
    reset({
      project_id: milestone.project_id ?? milestone.project?.id ?? '',
      title: milestone.title,
      description: milestone.description ?? '',
      status: milestone.status ?? 'open',
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (values: FormPayloadMilestone['Milestone']) => {
    if (!id) return;
    try {
      await updateMutation.mutateAsync({
        id,
        payload: values,
      });
      dispatch(
        pushToast({
          title: 'Milestone updated',
          description: 'Milestone details have been successfully updated.',
          variant: 'success',
        }),
      );
      setIsEditOpen(false);
    } catch (err) {
      dispatch(
        pushToast({
          title: 'Failed to update milestone',
          description: err instanceof Error ? err.message : 'An error occurred',
          variant: 'error',
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
          title: 'Milestone deleted',
          description: 'The milestone record has been removed.',
          variant: 'success',
        }),
      );
      navigate(slashed(ROUTE_PATH_LIST.PROJECT.MILESTONE));
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
    if (!id || !milestone) return;
    try {
      await updateMutation.mutateAsync({
        id,
        payload: {
          project_id: milestone.project_id ?? milestone.project?.id ?? '',
          title: milestone.title,
          description: milestone.description,
          status: selectedStatus,
        },
      });
      dispatch(
        pushToast({
          title: 'Status updated',
          description: 'Milestone status has been successfully updated.',
          variant: 'success',
        }),
      );
      setIsChangeStatusOpen(false);
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

  const goBack = () => navigate(slashed(ROUTE_PATH_LIST.PROJECT.MILESTONE));

  // ── Missing ID Guard ────────────────────────────────────────────────────────
  if (!id) {
    return (
      <div className="space-y-5">
        <PageHeader
          title="Milestone Detail"
          description="View detailed milestone targets and deliverable scope."
        />
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          The milestone ID is missing from the URL.
          <Button variant="outline" size="sm" className="ml-3" onClick={goBack}>
            Back to milestones
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
          title="Milestone Detail"
          description="Loading milestone specifications..."
          actions={
            <Button variant="outline" onClick={goBack}>
              <ArrowLeft className="h-4 w-4" />
              Back to milestones
            </Button>
          }
        />
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="border-b border-gray-100 bg-gray-50/80 px-6 py-4 dark:border-gray-800 dark:bg-white/[0.02]">
            <div className="h-5 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
          </div>
          <div className="grid gap-4 p-6 sm:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <SkeletonField key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Error State ─────────────────────────────────────────────────────────────
  if (findQuery.error || !milestone) {
    return (
      <div className="space-y-5">
        <PageHeader
          title="Milestone Detail"
          description="View detailed milestone targets and deliverable scope."
          actions={
            <Button variant="outline" onClick={goBack}>
              <ArrowLeft className="h-4 w-4" />
              Back to milestones
            </Button>
          }
        />
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-900/50 dark:bg-red-950/30">
          <div className="flex items-start gap-3 text-red-700 dark:text-red-300">
            <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" />
            <div className="min-w-0">
              <p className="font-semibold text-base">Unable to load milestone</p>
              <p className="mt-1 break-words text-sm text-red-600 dark:text-red-400">
                {findQuery.error?.message ?? 'The requested milestone could not be found.'}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => void findQuery.refetch()}>
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
      {/* ─── Page Title & Action Bar (Actions Placed Below Title) ───────────── */}
      <div className="space-y-4">
        <div>
          <h1 className="font-display text-xl font-semibold tracking-tight text-gray-900 sm:text-2xl dark:text-white/90">
            {milestone.title}
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-gray-500 dark:text-gray-400">
            Project deliverable phase under{' '}
            <span className="font-semibold text-gray-800 dark:text-gray-200">
              {milestone.project?.name ?? 'Assigned Project'}
            </span>
          </p>
        </div>

        {/* Action Buttons Row (Below Title) */}
        <div className="flex flex-wrap items-center gap-2 pt-0.5">
          <Button variant="outline" onClick={goBack} className="gap-1.5">
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setSelectedStatus(currentStatus);
              setIsChangeStatusOpen(true);
            }}
            className="gap-1.5"
          >
            <CheckCircle2 className="h-4 w-4 text-brand-600 dark:text-brand-400" />
            <span>Change Status</span>
          </Button>
          <Button onClick={openEditModal} className="gap-1.5">
            <Pencil className="h-4 w-4" />
            <span>Edit Milestone</span>
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
              <Flag className="h-6 w-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="font-display text-xl font-bold text-gray-900 dark:text-white">
                  {milestone.title}
                </h2>
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Project:{' '}
                <span className="font-semibold text-gray-800 dark:text-gray-200">
                  {milestone.project?.name ?? '—'}
                </span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                setSelectedStatus(currentStatus);
                setIsChangeStatusOpen(true);
              }}
              className="cursor-pointer transition-transform hover:scale-105 active:scale-95"
              title="Click to change status"
            >
              <MilestoneStatusBadge status={milestone.status} />
            </button>
          </div>
        </div>
      </div>

      {/* ─── Grid Information Cards (NO IDs DISPLAYED) ───────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Card 1: Project & Target Delivery */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs dark:border-gray-800 dark:bg-white/[0.02]">
          <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4 dark:border-gray-800 dark:bg-white/[0.01]">
            <h3 className="font-display text-sm font-semibold text-gray-900 dark:text-white/90">
              Project Context & Schedule
            </h3>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Associated project timeline and target completion date.
            </p>
          </div>
          <div className="space-y-4 p-6">
            <div className="flex items-center gap-4 rounded-xl border border-gray-100 bg-gray-50/60 p-4 dark:border-gray-800 dark:bg-white/2.5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-800/80">
                <FolderKanban className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  Assigned Project
                </p>
                <p className="mt-0.5 text-sm font-bold text-gray-900 dark:text-white">
                  {milestone.project?.name ?? '—'}
                </p>
              </div>

              
            </div>

            <DetailField
              icon={<CheckCircle2 className="h-4 w-4" />}
              label="Status"
              value={
                <div className="flex items-center justify-between gap-2">
                  <MilestoneStatusBadge status={milestone.status} />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedStatus(currentStatus);
                      setIsChangeStatusOpen(true);
                    }}
                    className="h-7 text-xs text-brand-600 dark:text-brand-400"
                  >
                    Change Status
                  </Button>
                </div>
              }
            />
          </div>
        </div>

        {/* Card 2: Timestamps & Audit */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs dark:border-gray-800 dark:bg-white/2">
          <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4 dark:border-gray-800 dark:bg-white/1">
            <h3 className="font-display text-sm font-semibold text-gray-900 dark:text-white/90">
              Audit & Timestamps
            </h3>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              System logging and timestamp history.
            </p>
          </div>
          <div className="grid gap-4 p-6 sm:grid-cols-2">
            <DetailField
              icon={<Clock className="h-4 w-4" />}
              label="Created At"
              value={formatDate(milestone.created_at)}
            />

            <DetailField
              icon={<Clock className="h-4 w-4" />}
              label="Last Updated At"
              value={formatDate(milestone.updated_at)}
            />
          </div>
        </div>
      </div>

      {/* Card 3: Scope & Description Breakdown (HTML Support) */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-xs dark:border-gray-800 dark:bg-white/[0.02]">
        <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4 dark:border-gray-800 dark:bg-white/[0.01]">
          <h3 className="font-display text-sm font-semibold text-gray-900 dark:text-white/90">
            Description & Scope Breakdown
          </h3>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Deliverable specifications, acceptance criteria, and task checklists.
          </p>
        </div>
        <div className="p-6">
          {milestone.description ? (
            <div
              className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 leading-relaxed [&_h3]:font-bold [&_h3]:text-gray-900 dark:[&_h3]:text-white [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mt-1"
              dangerouslySetInnerHTML={{ __html: milestone.description }}
            />
          ) : (
            <p className="text-xs text-gray-400 dark:text-gray-500 italic">
              No detailed task breakdown provided for this milestone.
            </p>
          )}
        </div>
      </div>

      {/* ─── Edit Milestone Modal ───────────────────────────────────────────── */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => !isSubmitting && setIsEditOpen(false)}
        title="Edit Milestone"
        description="Update deliverable scope, target due date, and milestone status."
        size="lg"
      >
        <form onSubmit={handleSubmit(handleEditSubmit)} className="space-y-4">
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
                placeholder="Document scope or HTML list..."
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

      {/* ─── Change Status Modal ────────────────────────────────────────────── */}
      <Modal
        isOpen={isChangeStatusOpen}
        onClose={() => !updateMutation.isPending && setIsChangeStatusOpen(false)}
        title="Change Milestone Status"
        description="Select the delivery status for this milestone."
        size="md"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setIsChangeStatusOpen(false)}
              disabled={updateMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleQuickStatusSubmit}
              disabled={!selectedStatus || selectedStatus === currentStatus}
              isLoading={updateMutation.isPending}
            >
              Update Status
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50/70 p-3.5 dark:border-gray-800 dark:bg-white/[0.02]">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Current Status
              </p>
              <div className="mt-1">
                <MilestoneStatusBadge status={milestone.status} />
              </div>
            </div>

            <ArrowRight className="h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500" />

            <div className="min-w-0 text-right">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Target Status
              </p>
              <div className="mt-1 flex justify-end">
                <MilestoneStatusBadge status={selectedStatus} />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {MILESTONE_STATUS_OPTIONS.map((opt) => {
              const isSelected = selectedStatus === opt.value;
              const isCurrent = currentStatus === opt.value;

              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSelectedStatus(opt.value)}
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
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Milestone"
        description={`Are you sure you want to permanently delete "${milestone.title}"? This action cannot be undone.`}
        confirmLabel="Delete Milestone"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
