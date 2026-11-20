import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  ImageIcon,
  Pencil,
  Plus,
  Search,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { Input } from '@/components/ui/FormControls';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/PageHeader';
import { useAppDispatch } from '@/store/hooks';
import { pushToast } from '@/store/slices/ui-slice';
import type { T_SortOrder } from '@/types/api-type';
import { formatDate, getStorageUrl } from '@/shared/libs/helper';
import { workspaceApi, type In_Workspace } from '../api';
import {
  ALLOWED_EXTENSIONS,
  ALLOWED_IMAGE_TYPES,
  MAX_FILE_SIZE,
  SchemaValidateWorkspace,
  type FormPayloadWorkspace,
} from '../schemas';

// ─── Workspace Logo Preview Thumbnail ─────────────────────────────────────────

function WorkspaceLogo({
  url,
  name,
  size = 'md',
}: {
  url?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const [imageError, setImageError] = useState(false);
  const sizeClasses = {
    sm: 'h-8 w-8 text-xs rounded-lg',
    md: 'h-10 w-10 text-sm rounded-xl',
    lg: 'h-14 w-14 text-base rounded-2xl',
  }[size];

  const fullUrl = url ? getStorageUrl(url) : null;

  if (fullUrl && !imageError) {
    return (
      <img
        src={fullUrl}
        alt={name}
        onError={() => setImageError(true)}
        className={`${sizeClasses} shrink-0 object-cover border border-gray-200/80 dark:border-gray-700/80 shadow-xs`}
      />
    );
  }

  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase() || 'WS';

  return (
    <div
      className={`${sizeClasses} shrink-0 flex items-center justify-center font-bold text-white bg-gradient-to-tr from-brand-600 to-indigo-500 shadow-xs shadow-brand-500/20`}
    >
      {initials}
    </div>
  );
}

// ─── Drag & Drop Image Uploader Component ─────────────────────────────────────

interface LogoUploaderProps {
  selectedFile: File | null;
  currentLogoUrl?: string | null;
  onFileSelect: (file: File | null) => void;
  error?: string;
}

function LogoUploader({
  selectedFile,
  currentLogoUrl,
  onFileSelect,
  error,
}: LogoUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (selectedFile) {
      const objectUrl = URL.createObjectURL(selectedFile);
      setPreviewUrl(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    } else {
      setPreviewUrl(null);
    }
  }, [selectedFile]);

  const validateAndSetFile = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    const isExtensionAllowed = ext ? (ALLOWED_EXTENSIONS as readonly string[]).includes(ext) : false;
    const isTypeAllowed = (ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type);

    if (!isExtensionAllowed && !isTypeAllowed) {
      alert(`Invalid file extension. Only ${ALLOWED_EXTENSIONS.join(', ')} are allowed.`);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      alert('File size exceeds 5MB limit.');
      return;
    }

    onFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      validateAndSetFile(file);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      validateAndSetFile(file);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFileSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
        Workspace Logo <span className="text-gray-400 font-normal">(PNG, JPG, or JPEG)</span>
      </label>

      {/* Hidden native input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".png,.jpg,.jpeg,image/png,image/jpeg"
        onChange={handleInputChange}
        className="hidden"
      />

      {/* Drag & Drop Dropzone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-5 text-center cursor-pointer transition-all duration-200 ${
          isDragging
            ? 'border-brand-500 bg-brand-50/50 dark:border-brand-500 dark:bg-brand-950/20'
            : 'border-gray-300 hover:border-brand-400 hover:bg-gray-50/80 dark:border-gray-700 dark:hover:border-brand-600 dark:hover:bg-white/[0.02]'
        }`}
      >
        {previewUrl ? (
          /* Live preview of new file */
          <div className="flex flex-col items-center gap-2">
            <div className="relative">
              <img
                src={previewUrl}
                alt="Logo preview"
                className="h-20 w-20 rounded-xl object-cover border border-gray-200 dark:border-gray-700 shadow-md"
              />
              <button
                type="button"
                onClick={handleRemove}
                title="Remove selected logo"
                className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-white shadow-md hover:bg-red-700 transition-colors cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="text-center">
              <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate max-w-[200px]">
                {selectedFile?.name}
              </p>
              <p className="text-[10px] text-gray-400">
                {selectedFile ? (selectedFile.size / 1024).toFixed(1) + ' KB' : ''} · Click or drop to replace
              </p>
            </div>
          </div>
        ) : currentLogoUrl ? (
          /* Existing logo preview when editing */
          <div className="flex flex-col items-center gap-2">
            <div className="relative">
              <img
                src={getStorageUrl(currentLogoUrl)}
                alt="Current logo"
                className="h-20 w-20 rounded-xl object-cover border border-gray-200 dark:border-gray-700 shadow-sm"
              />
            </div>
            <div className="text-center">
              <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 dark:text-brand-400">
                <UploadCloud className="h-3.5 w-3.5" />
                Click or drag & drop to replace logo
              </span>
              <p className="text-[10px] text-gray-400">PNG, JPG, or JPEG up to 5MB</p>
            </div>
          </div>
        ) : (
          /* Empty state */
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400 group-hover:scale-105 transition-transform">
              <UploadCloud className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-800 dark:text-white/90">
                <span className="text-brand-600 dark:text-brand-400">Click to upload</span> or drag and drop
              </p>
              <p className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">
                PNG, JPG or JPEG (max. 5MB)
              </p>
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-xs font-medium text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}

// ─── Main Workspace Page ──────────────────────────────────────────────────────

export function WorkspacePage() {
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
  const [editingItem, setEditingItem] = useState<In_Workspace | null>(null);
  const [deletingItem, setDeletingItem] = useState<In_Workspace | null>(null);
  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  // ─── Query & Mutation ────────────────────────────────────────────────────
  const listQuery = workspaceApi.query.useWorkspaceList({
    page,
    limit,
    search: debouncedSearch || undefined,
    sort_by: sortBy,
    order_by: orderBy,
  });

  const createMutation = workspaceApi.mutation.useCreateWorkspace();
  const updateMutation = workspaceApi.mutation.useUpdateWorkspace();
  const deleteMutation = workspaceApi.mutation.useDeleteWorkspace();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormPayloadWorkspace['Workspace']>({
    resolver: zodResolver(SchemaValidateWorkspace.workspace),
    defaultValues: {
      name: '',
    },
  });

  // ─── Form Handlers ───────────────────────────────────────────────────────
  const openCreateModal = () => {
    setEditingItem(null);
    setSelectedLogoFile(null);
    reset({ name: '' });
    setIsFormOpen(true);
  };

  const openEditModal = (item: In_Workspace) => {
    setEditingItem(item);
    setSelectedLogoFile(null);
    reset({ name: item.name });
    setIsFormOpen(true);
  };

  const onSubmit = async (values: FormPayloadWorkspace['Workspace']) => {
    try {
      if (editingItem) {
        const updated = await updateMutation.mutateAsync({
          id: editingItem.id,
          payload: {
            name: values.name,
            file_logo: selectedLogoFile,
          },
        });
        dispatch(
          pushToast({
            title: 'Workspace updated',
            description: updated.name,
            variant: 'success',
          }),
        );
      } else {
        const created = await createMutation.mutateAsync({
          name: values.name,
          file_logo: selectedLogoFile,
        });
        dispatch(
          pushToast({
            title: 'Workspace created',
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
            err instanceof Error ? err.message : 'Unable to save workspace.',
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
          title: 'Workspace deleted',
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
            err instanceof Error ? err.message : 'Unable to delete workspace.',
          variant: 'error',
        }),
      );
    }
  };

  // ─── Table Columns ────────────────────────────────────────────────────────
  const items = listQuery.data?.items ?? [];
  const pagination = listQuery.data?.pagination ?? null;

  const columns: DataTableColumn<In_Workspace>[] = [
    {
      key: 'name',
      header: 'Workspace',
      render: (row) => (
        <div className="flex items-center gap-3">
          <WorkspaceLogo url={row.logo_url} name={row.name} size="md" />
          <div className="min-w-0">
            <p className="font-semibold text-sm text-gray-900 dark:text-white/90 truncate">
              {row.name}
            </p>
            <p className="font-mono text-xs text-gray-400 dark:text-gray-500 truncate">
              {row.slug}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'slug',
      header: 'Slug',
      render: (row) => (
        <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs font-mono font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
          {row.slug}
        </span>
      ),
    },
    {
      key: 'logo_url',
      header: 'Logo Status',
      render: (row) => (
        <div className="flex items-center gap-1.5 text-xs">
          {row.logo_url ? (
            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
              <ImageIcon className="h-3.5 w-3.5" />
              Uploaded
            </span>
          ) : (
            <span className="text-gray-400">Default Avatar</span>
          )}
        </div>
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
            onClick={() => navigate(`/admin/workspace/${row.id}`)}
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
        title="Workspaces"
        description="Manage organizational workspaces, project partitions, and brand logos."
        actions={
          <Button variant="primary" onClick={openCreateModal}>
            <Plus className="h-4 w-4" />
            Create Workspace
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
                  placeholder="Search workspaces..."
                  aria-label="Search workspaces"
                  className="h-9 w-full rounded-lg border border-gray-200 bg-transparent pl-9 pr-3 text-xs text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                />
              </div>

              {/* Sort By Dropdown - EXACT specification */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <label htmlFor="workspace-sort-by">Sort</label>
                <select
                  id="workspace-sort-by"
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    setPage(1);
                  }}
                  className="h-8 rounded-lg border border-gray-200 bg-white px-2 text-xs text-gray-800 focus:border-brand-300 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-white/90 cursor-pointer"
                >
                  <option value="name">Name</option>
                  <option value="slug">Slug</option>
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
                <label htmlFor="workspace-limit">Rows</label>
                <select
                  id="workspace-limit"
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

                <span className="font-mono tabular-nums">
                  {listQuery.data?.totalRows ?? items.length} total
                </span>
              </div>
            </div>
          }
          emptyTitle="No workspaces found"
          emptyAction={
            <Button variant="primary" size="sm" onClick={openCreateModal}>
              Create Workspace
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

      {/* Create / Edit Modal with Drag & Drop Logo Upload */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingItem ? 'Update Workspace' : 'Create Workspace'}
        description={
          editingItem
            ? `Update workspace "${editingItem.name}"`
            : 'Configure a new project workspace partition'
        }
        footer={
          <>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="workspace-form"
              variant="primary"
              isLoading={createMutation.isPending || updateMutation.isPending}
            >
              {editingItem ? 'Save Changes' : 'Create Workspace'}
            </Button>
          </>
        }
      >
        <form
          id="workspace-form"
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
        >
          {/* Workspace Name */}
          <Input
            label="Workspace Name"
            placeholder="e.g. Pengembangan Aplikasi Web"
            error={errors.name?.message}
            required
            hint={
              editingItem
                ? `Current slug: ${editingItem.slug} (slug will update automatically)`
                : 'Slug will be generated automatically by the server'
            }
            {...register('name')}
          />

          {/* Drag & Drop Logo Upload */}
          <LogoUploader
            selectedFile={selectedLogoFile}
            currentLogoUrl={editingItem?.logo_url}
            onFileSelect={setSelectedLogoFile}
          />
        </form>
      </Modal>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingItem)}
        onClose={() => setDeletingItem(null)}
        onConfirm={() => void handleConfirmDelete()}
        title="Delete Workspace"
        description={`Are you sure you want to delete workspace "${deletingItem?.name ?? ''}"? Projects, milestones, and tasks within this workspace will be removed.`}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
export default WorkspacePage;
