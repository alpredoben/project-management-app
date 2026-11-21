import { useState, type ReactNode } from 'react';
import {
  CalendarClock,
  Check,
  CheckCircle2,
  CircleAlert,
  Code2,
  Copy,
  FileText,
  Globe,
  Hash,
  ImageIcon,
  Info,
  KeyRound,
  Layers,
  ListOrdered,
  Mail,
  Palette,
  Phone,
  Shield,
  ShieldCheck,
  Tag,
  User,
  XCircle,
} from 'lucide-react';
import { Drawer } from './Drawer';
import { formatDate } from '@/shared/libs/helper';

export interface RecordInspectorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  isLoading: boolean;
  error: Error | null;
  record: unknown;
  endpoint?: string;
}

// ─── DetailField Component (matching ProjectTypeDetailPage "Record Information") ───

function DetailField({
  icon,
  label,
  value,
  mono = false,
  className = '',
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`flex items-start gap-4 rounded-xl border border-gray-100 bg-gray-50/60 p-4 dark:border-gray-800 dark:bg-white/[0.025] ${className}`}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
          {label}
        </p>
        <div
          className={`mt-1 break-words text-sm font-medium text-gray-900 dark:text-white/90 ${
            mono ? 'font-mono' : ''
          }`}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

// ─── SkeletonField Loader Component ───────────────────────────────────────────

function SkeletonField() {
  return (
    <div className="flex items-start gap-4 rounded-xl border border-gray-100 bg-gray-50/60 p-4 dark:border-gray-800 dark:bg-white/[0.025]">
      <div className="h-9 w-9 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
        <div className="h-4 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
      </div>
    </div>
  );
}

// ─── Helpers: Key formatting & Icon Resolution ────────────────────────────────

function formatKeyLabel(key: string): string {
  const overrides: Record<string, string> = {
    id: 'ID',
    nip: 'NIP',
    slug: 'Slug',
    url: 'URL',
    uri: 'URI',
    api: 'API',
    rbac: 'RBAC',
    created_at: 'Created At',
    updated_at: 'Updated At',
    deleted_at: 'Deleted At',
    last_login_at: 'Last Login At',
    email_verified_at: 'Email Verified At',
    is_active: 'Active Status',
    is_email_verified: 'Email Verification',
    phone_number: 'Phone Number',
    color_code: 'Color Code',
    sequence_order: 'Sequence Order',
    avatar_url: 'Avatar',
    logo_url: 'Logo',
  };

  if (overrides[key]) {
    return overrides[key];
  }

  return key
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getFieldIcon(key: string): ReactNode {
  const lower = key.toLowerCase();

  if (lower === 'id') return <Hash className="h-4 w-4" />;
  if (lower.includes('name') || lower === 'title') return <Tag className="h-4 w-4" />;
  if (lower === 'nip' || lower === 'user' || lower === 'username') return <User className="h-4 w-4" />;
  if (lower.includes('email')) return <Mail className="h-4 w-4" />;
  if (lower.includes('phone')) return <Phone className="h-4 w-4" />;
  if (lower === 'slug') return <Globe className="h-4 w-4" />;
  if (lower === 'module') return <Layers className="h-4 w-4" />;
  if (lower.includes('desc')) return <FileText className="h-4 w-4" />;
  if (lower.includes('date') || lower.includes('_at') || lower === 'timestamp') {
    return <CalendarClock className="h-4 w-4" />;
  }
  if (lower.startsWith('is_') || lower === 'status' || lower === 'active') {
    return <CheckCircle2 className="h-4 w-4" />;
  }
  if (lower === 'roles' || lower === 'role') return <Shield className="h-4 w-4" />;
  if (lower === 'permissions' || lower === 'permission') return <KeyRound className="h-4 w-4" />;
  if (lower.includes('color')) return <Palette className="h-4 w-4" />;
  if (lower.includes('order') || lower.includes('sequence') || lower === 'no') {
    return <ListOrdered className="h-4 w-4" />;
  }
  if (lower.includes('logo') || lower.includes('avatar') || lower.includes('image')) {
    return <ImageIcon className="h-4 w-4" />;
  }
  if (lower.includes('verified')) return <ShieldCheck className="h-4 w-4" />;

  return <Info className="h-4 w-4" />;
}

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;

function formatFieldValue(key: string, value: unknown): { content: ReactNode; mono?: boolean; isLong?: boolean } {
  if (value === null || value === undefined || value === '') {
    return { content: <span className="text-gray-400 font-normal">—</span> };
  }

  // Boolean
  if (typeof value === 'boolean') {
    return {
      content: value ? (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Active / Yes
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-400">
          <XCircle className="h-3.5 w-3.5" />
          Inactive / No
        </span>
      ),
    };
  }

  // Number
  if (typeof value === 'number') {
    return { content: value, mono: true };
  }

  // Arrays (e.g., roles, permissions, role_ids, tags)
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return { content: <span className="text-gray-400 font-normal">—</span> };
    }

    return {
      isLong: true,
      content: (
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {value.map((item, idx) => {
            const label =
              typeof item === 'object' && item !== null
                ? (item as Record<string, unknown>).name ??
                  (item as Record<string, unknown>).slug ??
                  JSON.stringify(item)
                : String(item);
            return (
              <span
                key={idx}
                className="inline-flex items-center rounded-md bg-brand-50 px-2 py-0.5 text-xs font-mono font-medium text-brand-700 border border-brand-200/60 dark:bg-brand-900/30 dark:text-brand-300 dark:border-brand-800/60"
              >
                {String(label)}
              </span>
            );
          })}
        </div>
      ),
    };
  }

  // Objects
  if (typeof value === 'object') {
    return {
      isLong: true,
      mono: true,
      content: JSON.stringify(value, null, 2),
    };
  }

  // String values
  const str = String(value);

  // Hex Color
  if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(str)) {
    return {
      mono: true,
      content: (
        <div className="flex items-center gap-2">
          <span
            className="h-4 w-4 rounded-md border border-black/10 dark:border-white/20 shadow-xs"
            style={{ backgroundColor: str }}
          />
          <span>{str}</span>
        </div>
      ),
    };
  }

  // ISO Dates
  if (ISO_DATE_REGEX.test(str)) {
    return {
      mono: true,
      content: formatDate(new Date(str).toLocaleString()),
    };
  }

  // Identifiers / slugs
  const isMono =
    key.toLowerCase() === 'id' ||
    key.toLowerCase() === 'slug' ||
    key.toLowerCase().endsWith('_id') ||
    str.length === 36; // UUID

  return {
    content: str,
    mono: isMono,
    isLong: str.length > 50,
  };
}

// ─── Main RecordInspectorDrawer Component ─────────────────────────────────────

export function RecordInspectorDrawer({
  isOpen,
  onClose,
  title,
  isLoading,
  error,
  record,
  endpoint,
}: RecordInspectorDrawerProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyRaw = () => {
    if (!record) return;
    navigator.clipboard.writeText(JSON.stringify(record, null, 2)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const recordEntries =
    record && typeof record === 'object' && !Array.isArray(record)
      ? Object.entries(record as Record<string, unknown>)
      : [];

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title={title} subtitle={endpoint}>
      {isLoading ? (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs dark:border-gray-800 dark:bg-gray-900">
            <div className="border-b border-gray-100 bg-gray-50/80 px-6 py-4 dark:border-gray-800 dark:bg-white/[0.02]">
              <div className="h-4 w-36 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
            </div>
            <div className="grid gap-3 p-5 sm:grid-cols-2">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <SkeletonField key={i} />
              ))}
            </div>
          </div>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 dark:border-red-900/50 dark:bg-red-950/30">
          <div className="flex items-start gap-3 text-red-700 dark:text-red-300">
            <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" />
            <div className="min-w-0">
              <p className="font-semibold text-sm">Unable to load record detail</p>
              <p className="mt-1 break-words text-xs text-red-600 dark:text-red-400">
                {error.message}
              </p>
            </div>
          </div>
        </div>
      ) : record ? (
        <div className="space-y-5">
          {/* Record Information Card (matching ProjectTypeDetailPage) */}
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs dark:border-gray-800 dark:bg-gray-900">
            <div className="border-b border-gray-100 bg-gray-50/80 px-6 py-4 dark:border-gray-800 dark:bg-white/[0.02]">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-white/80">
                Record Information
              </h3>
            </div>

            {recordEntries.length > 0 ? (
              <div className="grid gap-3 p-5 sm:grid-cols-2">
                {recordEntries.map(([key, val]) => {
                  const { content, mono, isLong } = formatFieldValue(key, val);
                  return (
                    <DetailField
                      key={key}
                      icon={getFieldIcon(key)}
                      label={formatKeyLabel(key)}
                      value={content}
                      mono={mono}
                      className={isLong ? 'sm:col-span-2' : ''}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="p-5">
                <DetailField
                  icon={<Info className="h-4 w-4" />}
                  label="Value"
                  value={String(record)}
                />
              </div>
            )}
          </div>

          {/* Raw JSON Response Card */}
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/80 px-6 py-3.5 dark:border-gray-800 dark:bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <Code2 className="h-4 w-4 text-gray-400" />
                <h4 className="text-xs font-semibold text-gray-700 dark:text-white/80">
                  Raw JSON Response
                </h4>
              </div>
              <button
                type="button"
                onClick={handleCopyRaw}
                className="inline-flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-200/60 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white transition-colors"
                title="Copy raw JSON"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-emerald-600 dark:text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <div className="p-4">
              <pre className="max-h-56 overflow-x-auto rounded-xl border border-gray-100 bg-gray-50 p-3.5 font-mono text-xs leading-relaxed text-gray-700 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-300">
                {JSON.stringify(record, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center dark:border-gray-800">
          <Info className="mx-auto h-8 w-8 text-gray-300 dark:text-gray-600" />
          <p className="mt-2 text-xs font-medium text-gray-500 dark:text-gray-400">
            No record data loaded.
          </p>
        </div>
      )}
    </Drawer>
  );
}
