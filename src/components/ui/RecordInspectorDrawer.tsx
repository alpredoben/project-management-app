import { Drawer } from './Drawer';

interface RecordInspectorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  endpoint: string;
  isLoading: boolean;
  error: Error | null;
  record: unknown;
}

export function RecordInspectorDrawer({
  isOpen,
  onClose,
  title,
  endpoint,
  isLoading,
  error,
  record,
}: RecordInspectorDrawerProps) {
  return (
    <Drawer isOpen={isOpen} onClose={onClose} title={title} subtitle={endpoint}>
      {isLoading ? (
        <div className="space-y-3">
          <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
          <div className="h-24 w-full animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-xs text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
          {error.message}
        </div>
      ) : record ? (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
            <pre className="overflow-x-auto bg-slate-50 p-4 font-mono text-xs leading-relaxed text-slate-800 dark:bg-slate-950 dark:text-slate-200">
              {JSON.stringify(record, null, 2)}
            </pre>
          </div>
        </div>
      ) : (
        <p className="text-xs text-slate-500 dark:text-slate-400">No record loaded.</p>
      )}
    </Drawer>
  );
}
