import { useEffect, useId, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/shared/libs/cn';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: ReactNode;
  footer?: ReactNode;
}

const sizeClasses: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  size = 'md',
  children,
  footer,
}: ModalProps) {
  const titleId = useId();

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Lock body scrolling while modal is active
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
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          'w-full rounded-2xl border border-gray-200/90 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900 transition-all duration-200',
          sizeClasses[size],
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 bg-gray-50/50 px-6 py-4.5 dark:border-gray-800 dark:bg-white/[0.02]">
          <div>
            <h2 id={titleId} className="font-display text-base font-semibold text-gray-900 dark:text-white/95">
              {title}
            </h2>
            {description && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:hover:bg-gray-800 dark:hover:text-gray-200 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[calc(85vh-8rem)] overflow-y-auto px-6 py-5">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2.5 border-t border-gray-100 bg-gray-50/50 px-6 py-3.5 dark:border-gray-800 dark:bg-white/[0.02]">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
