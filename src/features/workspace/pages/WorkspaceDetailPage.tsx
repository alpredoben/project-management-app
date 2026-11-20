import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarClock,
  CircleAlert,
  ExternalLink,
  Globe,
  Hash,
  ImageIcon,
  Tag,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { workspaceApi } from '../api';
import { formatDate, getStorageUrl } from '@/shared/libs/helper';

// ─── Detail Field Component ──────────────────────────────────────────────────

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
    <div className="flex items-start gap-4 rounded-xl border border-gray-100 bg-gray-50/60 p-4 dark:border-gray-800 dark:bg-white/2.5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
          {label}
        </p>
        <div
          className={`mt-1 break-all text-sm font-medium text-gray-900 dark:text-white/90 ${mono ? 'font-mono' : ''}`}
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
        <div className="h-3 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
        <div className="h-4 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
      </div>
    </div>
  );
}

// ─── Page Component ──────────────────────────────────────────────────────────

export function WorkspaceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [logoError, setLogoError] = useState(false);

  const findQuery = workspaceApi.query.useWorkspaceFind(id ?? null);

  const goBack = () => navigate('/admin/workspace');

  // ── Missing ID guard ──────────────────────────────────────────────────────
  if (!id) {
    return (
      <div className="space-y-5">
        <PageHeader
          title="Workspace Detail"
          description="View detailed workspace parameters and configuration."
        />
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          The workspace ID is missing from the URL.
          <Button
            variant="outline"
            size="sm"
            className="ml-3"
            onClick={goBack}
          >
            Back to list
          </Button>
        </div>
      </div>
    );
  }

  // ── Loading state ─────────────────────────────────────────────────────────
  if (findQuery.isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Workspace Detail"
          description="Loading workspace information..."
          actions={
            <Button variant="outline" onClick={goBack}>
              <ArrowLeft className="h-4 w-4" />
              Back to list
            </Button>
          }
        />
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="border-b border-gray-100 bg-gray-50/80 px-6 py-4 dark:border-gray-800 dark:bg-white/[0.02]">
            <div className="h-5 w-36 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
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

  // ── Error state ───────────────────────────────────────────────────────────
  if (findQuery.error || !findQuery.data) {
    return (
      <div className="space-y-5">
        <PageHeader
          title="Workspace Detail"
          description="View detailed workspace parameters and configuration."
          actions={
            <Button variant="outline" onClick={goBack}>
              <ArrowLeft className="h-4 w-4" />
              Back to list
            </Button>
          }
        />
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 dark:border-red-900/50 dark:bg-red-950/30">
          <div className="flex items-start gap-3 text-red-700 dark:text-red-300">
            <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" />
            <div className="min-w-0">
              <p className="font-semibold">Unable to load workspace</p>
              <p className="mt-1 break-words text-sm">
                {findQuery.error?.message ?? 'The workspace record could not be found.'}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void findQuery.refetch()}
                >
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

  // ── Data Loaded ───────────────────────────────────────────────────────────
  const data = findQuery.data;
  const fullLogoUrl = data.logo_url ? getStorageUrl(data.logo_url) : null;

  const initials = data.name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase() || 'WS';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Workspace Detail"
        description="Detailed specification of workspace record retrieved via REST API."
        actions={
          <Button variant="outline" onClick={goBack}>
            <ArrowLeft className="h-4 w-4" />
            Back to list
          </Button>
        }
      />

      {/* Hero Showcase Card */}
      <section className="relative overflow-hidden rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-50 via-white to-indigo-50 p-6 shadow-sm dark:border-brand-900/50 dark:from-brand-950/40 dark:via-gray-900 dark:to-indigo-950/30">
        <div className="pointer-events-none absolute -right-10 -top-14 h-44 w-44 rounded-full bg-brand-300/20 blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            {/* Logo or Gradient Initials */}
            {fullLogoUrl && !logoError ? (
              <img
                src={fullLogoUrl}
                alt={data.name}
                onError={() => setLogoError(true)}
                className="h-16 w-16 shrink-0 rounded-2xl object-cover border-2 border-white dark:border-gray-800 shadow-lg shadow-brand-500/10"
              />
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-xl font-bold text-white shadow-lg shadow-brand-500/25">
                {initials}
              </div>
            )}

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700 dark:text-brand-300">
                  Workspace
                </span>
                <span className="inline-flex items-center rounded-md bg-white/80 dark:bg-gray-800 px-2 py-0.5 text-xs font-mono font-medium text-gray-700 dark:text-gray-300 shadow-xs border border-gray-200 dark:border-gray-700">
                  /{data.slug}
                </span>
              </div>
              <h2 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white/90 truncate">
                {data.name}
              </h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Created on {formatDate(new Date(data.created_at).toLocaleString())}
              </p>
            </div>
          </div>

          {/* API endpoint badge */}
          <div className="shrink-0 self-start rounded-xl border border-white/80 bg-white/80 px-4 py-2.5 shadow-sm backdrop-blur dark:border-gray-700 dark:bg-gray-900/70 sm:self-auto">
            <p className="font-mono text-[10px] uppercase tracking-widest text-gray-400">
              Endpoint
            </p>
            <p className="mt-0.5 font-mono text-xs font-semibold text-gray-700 dark:text-gray-200">
              GET /api/v1/workspace/find/{id}
            </p>
          </div>
        </div>
      </section>

      {/* Detail Fields Card */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="border-b border-gray-100 bg-gray-50/80 px-6 py-4 dark:border-gray-800 dark:bg-white/[0.02]">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-white/80">
            Record Information
          </h3>
        </div>
        <div className="grid gap-4 p-6 sm:grid-cols-2">
          <DetailField
            icon={<Hash className="h-4 w-4" />}
            label="Workspace ID"
            value={data.id}
            mono
          />
          <DetailField
            icon={<Tag className="h-4 w-4" />}
            label="Name"
            value={data.name}
          />
          <DetailField
            icon={<Globe className="h-4 w-4" />}
            label="Slug"
            value={data.slug}
            mono
          />
          <DetailField
            icon={<ImageIcon className="h-4 w-4" />}
            label="Logo URL"
            value={
              data.logo_url ? (
                <div className="flex items-center gap-2">
                  <span className="truncate">{data.logo_url}</span>
                  {fullLogoUrl && (
                    <a
                      href={fullLogoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-brand-600 hover:text-brand-700 dark:text-brand-400"
                      title="Open full logo"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              ) : (
                '— (Default system avatar)'
              )
            }
            mono={Boolean(data.logo_url)}
          />
          <DetailField
            icon={<CalendarClock className="h-4 w-4" />}
            label="Created At"
            value={formatDate(new Date(data.created_at).toLocaleString())}
            mono
          />
          <DetailField
            icon={<CalendarClock className="h-4 w-4" />}
            label="Updated At"
            value={formatDate(new Date(data.updated_at).toLocaleString())}
            mono
          />
        </div>
      </div>

      {/* Raw JSON Preview */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="border-b border-gray-100 bg-gray-50/80 px-6 py-4 dark:border-gray-800 dark:bg-white/[0.02]">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-white/80">
            Raw API Response
          </h3>
          <p className="mt-0.5 text-xs text-gray-400">
            GET /api/v1/workspace/find/{id}
          </p>
        </div>
        <div className="p-6">
          <pre className="overflow-x-auto rounded-xl border border-gray-100 bg-gray-50 p-4 font-mono text-xs leading-relaxed text-gray-700 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-300">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
