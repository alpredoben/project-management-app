import { useEffect, useId, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function Drawer({ isOpen, onClose, title, subtitle, children }: DrawerProps) {
  const titleId = useId();

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    // Prevent body scrolling behind the drawer
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex justify-end bg-slate-950/60 backdrop-blur-xs transition-opacity duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex h-screen w-full max-w-xl sm:max-w-2xl flex-col border-l border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900 transition-transform duration-200 ease-out"
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 bg-gray-50/50 px-6 py-4.5 dark:border-gray-800 dark:bg-white/[0.02]">
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="font-display text-base font-semibold text-gray-900 dark:text-white/95 truncate">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-1 font-mono text-xs text-gray-400 dark:text-gray-500 break-all select-all">
                {subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close detail panel"
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:hover:bg-gray-800 dark:hover:text-gray-200 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
