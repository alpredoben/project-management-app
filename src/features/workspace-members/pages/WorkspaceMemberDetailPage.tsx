import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  ArrowLeft,
  Briefcase,
  CircleAlert,
  KeyRound,
  Layers,
  Mail,
  Pencil,
  Trash2,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Select } from '@/components/ui/FormControls';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/PageHeader';
import { useAppDispatch } from '@/store/hooks';
import { pushToast } from '@/store/slices/ui-slice';
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

// ─── DetailField Component (matching ProjectTypeDetailPage "Record Information") ───

function DetailField({
  icon,
  label,
  value,
  mono = false,
  className = '',
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`flex items-start gap-4 rounded-xl border border-gray-100 bg-gray-50/70 p-4 dark:border-gray-800 dark:bg-white/2.5 ${className}`}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
          {label}
        </p>
        <div
          className={`mt-1 text-sm font-medium text-gray-900 dark:text-white/90 ${
            mono ? 'font-mono' : ''
          }`}
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
    <div className="flex items-start gap-4 rounded-xl border border-gray-100 bg-gray-50/70 p-4 dark:border-gray-800 dark:bg-white/[0.025]">
      <div className="h-9 w-9 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
        <div className="h-4 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
      </div>
    </div>
  );
}

// ─── Main WorkspaceMemberDetailPage Component ─────────────────────────────────

export function WorkspaceMemberDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  // ─── Queries & Mutations ────────────────────────────────────────────────────
  const findQuery = workspaceMemberApi.query.useFindById(id ?? null);
  const updateMutation = workspaceMemberApi.mutation.useUpdate();
  const deleteMutation = workspaceMemberApi.mutation.useDelete();

  // Dropdown reference data for edit modal
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

  // Local state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const goBack = () =>
    navigate(slashed(ROUTE_PATH_LIST.WORKSPACE.WORKSPACE_MEMBERS));

  // Edit form
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormPayloadWorkspaceMember['Member']>({
    resolver: zodResolver(SchemaValidateWorkspaceMember.member) as never,
  });

  const openEditModal = () => {
    if (!findQuery.data) return;
    const data = findQuery.data;
    reset({
      workspace_id: data.workspace_id ?? data.workspace?.id ?? '',
      user_id: data.user_id ?? data.user?.id ?? '',
      position_id: data.position_id ?? data.position?.id ?? '',
    });
    setIsEditOpen(true);
  };

  const onUpdateSubmit = async (values: FormPayloadWorkspaceMember['Member']) => {
    if (!id) return;
    try {
      await updateMutation.mutateAsync({ id, values });
      dispatch(
        pushToast({
          title: 'Member updated',
          description: 'Workspace member assignment updated successfully.',
          variant: 'success',
        }),
      );
      setIsEditOpen(false);
      void findQuery.refetch();
    } catch (err) {
      dispatch(
        pushToast({
          title: 'Failed to update member',
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
          title: 'Member removed',
          description: 'The member has been removed from the workspace.',
          variant: 'success',
        }),
      );
      goBack();
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

  // ─── Missing ID guard ───────────────────────────────────────────────────────
  if (!id) {
    return (
      <div className="space-y-5">
        <PageHeader
          title="Workspace Member Detail"
          description="View detailed information about a workspace member."
        />
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          The workspace member ID is missing from the URL.
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
        <PageHeader
          title="Workspace Member Detail"
          description="Loading member details..."
        />
        <div className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
            <div className="grid gap-4 sm:grid-cols-2">
              <SkeletonField />
              <SkeletonField />
              <SkeletonField />
              <SkeletonField />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Error State ────────────────────────────────────────────────────────────
  if (findQuery.isError || !findQuery.data) {
    return (
      <div className="space-y-5">
        <PageHeader
          title="Workspace Member Detail"
          description="View detailed information about a workspace member."
        />
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 dark:border-red-900/50 dark:bg-red-950/30">
          <div className="flex items-start gap-3 text-red-700 dark:text-red-300">
            <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" />
            <div className="min-w-0">
              <p className="font-semibold text-sm">Failed to load member details</p>
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                {findQuery.error?.message ?? 'Record not found.'}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={goBack}
              >
                Back to members
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const member = findQuery.data;
  const workspaceLogoUrl = member.workspace?.logo_url
    ? getPublicUrlExpression(member.workspace.logo_url)
    : null;

  const memberInitials =
    member.user?.name
      ?.trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0] ?? '')
      .join('')
      .toUpperCase() || 'MB';

  return (
    <div className="space-y-6">
      {/* ─── Page Header with Actions ───────────────────────────────────────── */}
      <PageHeader
        title="Workspace Member Detail"
        description="Inspect member assignments, workspace organization, and capabilities."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goBack} className="gap-1.5">
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
              <span>Remove</span>
            </Button>
          </div>
        }
      />

      {/* ─── Hero Overview Card ─────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-xs dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          {/* Member Profile */}
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-linear-to-tr from-brand-600 to-indigo-600 text-lg font-bold text-white shadow-md shadow-brand-500/20">
              {memberInitials}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <h2 className="font-display text-lg font-bold text-gray-900 dark:text-white truncate">
                  {member.user?.name ?? 'Member'}
                </h2>
                <span className="inline-flex items-center gap-1 rounded-md bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700 dark:bg-brand-950/40 dark:text-brand-300 border border-brand-200/80 dark:border-brand-800/80">
                  <Briefcase className="h-3 w-3" />
                  {member.position?.name ?? 'Member'}
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Join At {formatDate(member.joined_at || member.created_at)}
              </p>
            </div>
          </div>

          {/* Workspace Association Banner */}
          <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/80 p-3.5 sm:px-5 sm:py-3.5 dark:border-gray-800 dark:bg-white/2">
            {workspaceLogoUrl ? (
              <img
                src={workspaceLogoUrl}
                alt={member.workspace?.name}
                className="h-10 w-10 shrink-0 rounded-xl object-cover border border-gray-200 dark:border-gray-700 shadow-xs"
              />
            ) : (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-tr from-brand-600 to-indigo-500 text-xs font-bold text-white shadow-xs">
                WS
              </div>
            )}
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Assigned Workspace
              </p>
              <p className="font-semibold text-xs text-gray-800 dark:text-gray-200 truncate">
                {member.workspace?.name ?? '—'}
              </p>
              <p className="font-mono text-[11px] text-gray-400 dark:text-gray-500 truncate">
                {member.workspace?.slug ?? '—'}
              </p>
            </div>
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
          {/* Member Name */}
          <DetailField
            icon={<User className="h-4 w-4" />}
            label="User Name"
            value={member.user?.name ?? '—'}
          />

          {/* Email */}
          <DetailField
            icon={<Mail className="h-4 w-4" />}
            label="Email Address"
            value={member.user?.email ?? '—'}
          />

          {/* NIP */}
          <DetailField
            icon={<KeyRound className="h-4 w-4" />}
            label="NIP"
            value={member.user?.nip ?? '—'}
          />

          {/* Position Name */}
          <DetailField
            icon={<Briefcase className="h-4 w-4" />}
            label="Position"
            value={
              <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 font-mono text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                {member.position?.name ?? '—'}
              </span>
            }
          />

          {/* Workspace Name */}
          <DetailField
            icon={<Layers className="h-4 w-4" />}
            label="Workspace Name"
            value={member.workspace?.name ?? '—'}
          />

          {/* Workspace Slug */}
          <DetailField
            icon={<Layers className="h-4 w-4" />}
            label="Workspace Slug"
            value={
              <span className="font-mono text-xs text-gray-600 dark:text-gray-400">
                {member.workspace?.slug ?? '—'}
              </span>
            }
          />

         

        </div>
      </div>


      {/* ─── Edit Member Modal ──────────────────────────────────────────────── */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Workspace Member"
        description="Update workspace association or member position."
        size="md"
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
              form="workspace-member-edit-form"
              isLoading={updateMutation.isPending}
            >
              Save Changes
            </Button>
          </>
        }
      >
        <form
          id="workspace-member-edit-form"
          onSubmit={handleSubmit(onUpdateSubmit)}
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
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={() => void handleDelete()}
        title="Remove Member from Workspace"
        description={`Are you sure you want to remove ${
          member.user?.name ?? 'this user'
        } from "${member.workspace?.name ?? 'this workspace'}"?`}
        confirmLabel="Remove Member"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

export default WorkspaceMemberDetailPage;
