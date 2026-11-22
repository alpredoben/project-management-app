import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarClock,
  CircleAlert,
  GitBranch,
  ListOrdered,
  Palette,
  Tag,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { projectStatusApi } from '../api';
import { formatDate, slashed } from '@/shared/libs/helper';
import { ROUTE_PATH_LIST } from '@/shared/constants';

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

export function ProjectStatusDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const findQuery = projectStatusApi.query.useFindById(id ?? null);

  const goBack = () => navigate(slashed(ROUTE_PATH_LIST.MASTER_DATA.PROJECT_STATUS));

  // ── Missing ID guard ──────────────────────────────────────────────────────
  if (!id) {
    return (
      <div className="space-y-5">
        <PageHeader
          title="Project Status Detail"
          description="View detailed specifications of a project lifecycle status."
        />
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          The project status ID is missing from the URL.
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
          title="Project Status Detail"
          description="Loading project status information..."
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
          title="Project Status Detail"
          description="View detailed specifications of a project lifecycle status."
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
              <p className="font-semibold">Unable to load project status</p>
              <p className="mt-1 wrap-break-word text-sm">
                {findQuery.error?.message ?? 'The record could not be found.'}
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
  const hasColor = Boolean(data.color_code && data.color_code.trim());

  return (
    <div className="space-y-6">
      <PageHeader
        title="Project Status Detail"
        description="Detailed view of project status record retrieved via REST API."
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
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg transition-transform duration-200 hover:scale-105"
              style={{
                backgroundColor: hasColor ? data.color_code : '#3B82F6',
                boxShadow: hasColor
                  ? `0 10px 25px -5px ${data.color_code}40`
                  : undefined,
              }}
            >
              <GitBranch className="h-7 w-7" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700 dark:text-brand-300">
                  Project Status
                </span>
                <span className="inline-flex items-center rounded-md bg-white/80 dark:bg-gray-800 px-2 py-0.5 text-xs font-mono font-bold text-gray-700 dark:text-gray-300 shadow-xs border border-gray-200 dark:border-gray-700">
                  Sequence #{data.sequence_order}
                </span>
              </div>
              <h2 className="mt-1 font-mono text-2xl font-bold text-gray-900 dark:text-white/90">
                {data.name}
              </h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {data.description ?? 'No description provided.'}
              </p>
            </div>
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
            icon={<Tag className="h-4 w-4" />}
            label="Status Name"
            value={data.name}
            mono
          />
          <DetailField
            icon={<Palette className="h-4 w-4" />}
            label="Color Code"
            value={
              hasColor ? (
                <div className="flex items-center gap-2">
                  <span
                    className="h-5 w-5 rounded-md border border-black/10 dark:border-white/20 shadow-xs"
                    style={{ backgroundColor: data.color_code }}
                  />
                  <span>{data.color_code}</span>
                </div>
              ) : (
                '—'
              )
            }
            mono
          />
          <DetailField
            icon={<ListOrdered className="h-4 w-4" />}
            label="No. Order (Sequence)"
            value={`#${data.sequence_order}`}
            mono
          />
          <DetailField
            icon={<FileText className="h-4 w-4" />}
            label="Description"
            value={data.description ?? '—'}
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

    </div>
  );
}
