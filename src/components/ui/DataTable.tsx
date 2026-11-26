import { useMemo, useState, type ReactNode } from 'react';
import { AlertCircle, RefreshCw, Search } from 'lucide-react';
import { Button } from './Button';
import { cn } from '@/shared/libs/cn';

export interface DataTableColumn<T> {
  key: string;
  header: string;
  align?: 'left' | 'right';
  className?: string;
  render: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  data: readonly T[];
  columns: readonly DataTableColumn<T>[];
  getRowKey: (row: T) => string;
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  searchPlaceholder?: string;
  searchFilter?: (row: T, query: string) => boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  toolbarExtra?: ReactNode;
}

export function DataTable<T>({
  data,
  columns,
  getRowKey,
  isLoading = false,
  error = null,
  onRetry,
  searchPlaceholder = 'Search records...',
  searchFilter,
  emptyTitle = 'No records found',
  emptyDescription = 'Create a new entry to populate this directory.',
  emptyAction,
  toolbarExtra,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredData = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q || !searchFilter) return data;
    return data.filter((row) => searchFilter(row, q));
  }, [data, searchFilter, searchQuery]);

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-white p-8 text-center dark:border-red-900/40 dark:bg-surface-dark-card">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400">
          <AlertCircle className="h-5 w-5" />
        </div>
        <h3 className="mt-3 text-sm font-semibold text-gray-900 dark:text-white/90">
          Failed to load data
        </h3>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{error.message}</p>
        {onRetry && (
          <div className="mt-4">
            <Button variant="outline" size="sm" onClick={onRetry}>
              <RefreshCw className="h-3.5 w-3.5" />
              Retry Request
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white dark:border-white/[0.06] dark:bg-surface-dark-card">
      {(searchFilter || toolbarExtra) && (
        <div className="flex flex-col gap-3 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-white/[0.06]">
          {searchFilter ? (
            <div className="relative w-full max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
                className="h-9 w-full rounded-xl border border-gray-200 bg-transparent pl-9 pr-3 text-xs text-gray-800 placeholder:text-gray-400 focus:border-brand-400 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-white/90 dark:focus:border-brand-500/60"
              />
            </div>
          ) : (
            <div />
          )}
          <div className="flex min-w-0 flex-1 items-center gap-3">
            {toolbarExtra}
            <span className="shrink-0 whitespace-nowrap font-mono text-xs text-gray-500 tabular-nums dark:text-gray-400">
              {filteredData.length} {filteredData.length === 1 ? 'record' : 'records'}
            </span>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="divide-y divide-gray-100 dark:divide-white/[0.04]">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div key={idx} className="flex items-center gap-4 px-5 py-3.5">
              <div className="h-4 w-32 animate-pulse rounded bg-gray-100 dark:bg-white/[0.06]" />
              <div className="h-4 flex-1 animate-pulse rounded bg-gray-100 dark:bg-white/[0.06]" />
              <div className="h-4 w-24 animate-pulse rounded bg-gray-100 dark:bg-white/[0.06]" />
            </div>
          ))}
        </div>
      ) : filteredData.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white/90">
            {searchQuery ? 'No matching records' : emptyTitle}
          </h3>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {searchQuery
              ? `No entries matched "${searchQuery}". Try clearing the search filter.`
              : emptyDescription}
          </p>
          {!searchQuery && emptyAction && <div className="mt-4">{emptyAction}</div>}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50 text-xs font-medium text-gray-500 dark:border-white/[0.04] dark:bg-white/[0.02] dark:text-gray-400">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    scope="col"
                    className={cn(
                      'px-5 py-3 whitespace-nowrap',
                      col.align === 'right' ? 'text-right' : 'text-left',
                      col.className,
                    )}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/[0.04]">
              {filteredData.map((row) => (
                <tr
                  key={getRowKey(row)}
                  className="transition-colors hover:bg-gray-50/50 dark:hover:bg-white/[0.02]"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        'px-5 py-3 text-gray-700 dark:text-gray-300',
                        col.align === 'right' ? 'text-right' : 'text-left',
                        col.className,
                      )}
                    >
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
