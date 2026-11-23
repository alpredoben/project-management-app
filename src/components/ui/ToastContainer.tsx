import { useEffect } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { dismissToast } from '@/store/slices/ui-slice';
import { cn } from '@/shared/libs/cn';

export function ToastContainer() {
  const toasts = useAppSelector((s) => s.ui.toasts);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (toasts.length === 0) return;
    const timers = toasts.map((toast) =>
      window.setTimeout(() => {
        dispatch(dismissToast(toast.id));
      }, 4200),
    );
    return () => {
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [toasts, dispatch]);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-4 right-4 z-[9999] flex w-full max-w-sm flex-col gap-2 pointer-events-none"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className={cn(
            'pointer-events-auto flex items-start gap-3 rounded-xl border bg-white p-3.5 shadow-lg dark:bg-slate-900',
            toast.variant === 'error'
              ? 'border-red-200 dark:border-red-900/60'
              : toast.variant === 'success'
                ? 'border-emerald-200 dark:border-emerald-900/60'
                : 'border-slate-200 dark:border-slate-800',
          )}
        >
          {toast.variant === 'success' && (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          )}
          {toast.variant === 'error' && (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
          )}
          {toast.variant === 'info' && (
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">{toast.title}</p>
            {toast.description && (
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{toast.description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => dispatch(dismissToast(toast.id))}
            aria-label="Dismiss notification"
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
