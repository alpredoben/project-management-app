import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { cn } from '@/shared/libs/cn';

export interface DropdownSearchOption {
  value: string;
  label: string;
  subLabel?: string;
  icon?: ReactNode;
  dotColor?: string;
}

export interface DropdownSearchProps {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  options: readonly DropdownSearchOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  leadingIcon?: ReactNode;
  clearable?: boolean;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  emptyText?: string;
}

export function DropdownSearch({
  label,
  error,
  hint,
  required,
  options,
  value,
  onChange,
  placeholder = 'Select option...',
  searchPlaceholder = 'Search...',
  leadingIcon,
  clearable = true,
  disabled = false,
  className,
  triggerClassName,
  emptyText = 'No options found',
}: DropdownSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const generatedId = useId();
  const id = label ? `${generatedId}-dropdown` : undefined;
  const errorId = `${generatedId}-error`;

  const selectedOption = useMemo(
    () => options.find((opt) => opt.value === value),
    [options, value],
  );

  const filteredOptions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        (opt.subLabel && opt.subLabel.toLowerCase().includes(q)),
    );
  }, [options, search]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      // Autofocus the search box
      const timer = window.setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      return () => window.clearTimeout(timer);
    }
  }, [isOpen]);

  const toggleOpen = () => {
    if (disabled) return;
    setIsOpen((prev) => {
      const next = !prev;
      if (next) setSearch('');
      return next;
    });
  };

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
    setSearch('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  return (
    <div className={cn('relative w-full', className)} ref={containerRef}>
      {label && (
        <label
          htmlFor={id}
          className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
          {required && (
            <span className="ml-0.5 text-red-600 dark:text-red-400">*</span>
          )}
        </label>
      )}

      {/* ─── Trigger Button ───────────────────────────────────────────────── */}
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={toggleOpen}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className={cn(
          'group flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white px-3 text-xs font-medium text-gray-800 shadow-xs transition-all duration-150',
          'hover:border-gray-300 hover:bg-gray-50/50',
          'focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10',
          'dark:border-white/[0.1] dark:bg-white/[0.04] dark:text-white/90 dark:hover:border-white/[0.15] dark:hover:bg-white/[0.06] dark:focus:border-brand-500/60',
          disabled && 'cursor-not-allowed opacity-50',
          isOpen && 'border-brand-500 ring-4 ring-brand-500/10 dark:border-brand-500',
          error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20 dark:border-red-500',
          triggerClassName,
        )}
      >
        <div className="flex min-w-0 items-center gap-2 truncate">
          {leadingIcon && (
            <span className="shrink-0 text-gray-400 dark:text-gray-500">
              {leadingIcon}
            </span>
          )}
          {selectedOption ? (
            <div className="flex items-center gap-2 truncate">
              {selectedOption.dotColor && (
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: selectedOption.dotColor }}
                />
              )}
              {selectedOption.icon}
              <span className="truncate font-semibold text-gray-900 dark:text-white">
                {selectedOption.label}
              </span>
            </div>
          ) : (
            <span className="truncate text-gray-400 dark:text-gray-500">
              {placeholder}
            </span>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1 text-gray-400">
          {clearable && selectedOption && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onChange('');
                }
              }}
              title="Clear selection"
              className="rounded p-0.5 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          )}
          <ChevronDown
            className={cn(
              'h-4 w-4 transition-transform duration-200',
              isOpen && 'rotate-180 text-brand-600 dark:text-brand-400',
            )}
          />
        </div>
      </button>

      {/* ─── Popover Menu ─────────────────────────────────────────────────── */}
      {isOpen && (
        <div
          role="listbox"
          className="absolute z-50 mt-1.5 w-full min-w-[200px] rounded-xl border border-gray-200 bg-white p-1.5 shadow-xl transition-all duration-200 animate-in fade-in-0 zoom-in-95 dark:border-gray-800 dark:bg-gray-900"
        >
          {/* Search box inside menu */}
          <div className="relative mb-1 px-1 pt-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-8.5 w-full rounded-lg border border-gray-200 bg-gray-50/80 pl-8 pr-3 text-xs text-gray-800 placeholder:text-gray-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white dark:placeholder:text-gray-500 dark:focus:bg-white/[0.06]"
            />
          </div>

          {/* Options list */}
          <div className="max-h-56 overflow-y-auto divide-y divide-transparent py-1">
            {clearable && !search && (
              <button
                type="button"
                onClick={() => handleSelect('')}
                className={cn(
                  'flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-medium transition-colors cursor-pointer',
                  !value
                    ? 'bg-brand-50/80 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300'
                    : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-white/[0.04]',
                )}
              >
                <span className="italic">{placeholder}</span>
                {!value && <Check className="h-3.5 w-3.5 text-brand-600 shrink-0" />}
              </button>
            )}

            {filteredOptions.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-gray-400 dark:text-gray-500">
                {emptyText}
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={cn(
                      'flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-medium transition-colors cursor-pointer',
                      isSelected
                        ? 'bg-brand-50/80 font-semibold text-brand-700 dark:bg-brand-950/40 dark:text-brand-300'
                        : 'text-gray-800 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-white/[0.04]',
                    )}
                  >
                    <div className="flex min-w-0 items-center gap-2 truncate">
                      {opt.dotColor && (
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: opt.dotColor }}
                        />
                      )}
                      {opt.icon}
                      <div className="min-w-0 truncate">
                        <div className="truncate">{opt.label}</div>
                        {opt.subLabel && (
                          <div className="text-[10px] font-normal text-gray-400 dark:text-gray-500 truncate">
                            {opt.subLabel}
                          </div>
                        )}
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400 shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Hints & Errors */}
      {hint && !error && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{hint}</p>
      )}
      {error && (
        <p
          id={errorId}
          role="alert"
          className="mt-1 text-xs font-medium text-red-600 dark:text-red-400"
        >
          {error}
        </p>
      )}
    </div>
  );
}
