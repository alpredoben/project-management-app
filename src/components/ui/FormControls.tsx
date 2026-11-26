import { forwardRef, useId, type ComponentPropsWithoutRef } from 'react';
import { cn } from '@/shared/libs/cn';

interface FieldWrapperProps {
  label: string;
  error?: string;
  hint?: string;
  id: string;
  errorId: string;
  required?: boolean;
  children: React.ReactNode;
}

function FieldWrapper({ label, error, hint, id, errorId, required, children }: FieldWrapperProps) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="block text-xs font-medium text-gray-700 dark:text-gray-300"
      >
        {label}
        {required && <span className="ml-0.5 text-red-600 dark:text-red-400">*</span>}
      </label>
      {children}
      {hint && !error && (
        <p className="text-xs text-gray-500 dark:text-gray-400">{hint}</p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-xs font-medium text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}

const controlBaseClass =
  'w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 shadow-xs transition-all focus:border-brand-400 focus:outline-none focus:ring-3 focus:ring-brand-500/10 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 dark:border-white/[0.1] dark:bg-white/[0.04] dark:text-white/90 dark:placeholder:text-gray-500 dark:focus:border-brand-500/60 dark:focus:ring-brand-500/15 dark:disabled:bg-white/[0.02]';

interface InputProps extends ComponentPropsWithoutRef<'input'> {
  label: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, id: providedId, className, required, ...rest },
  ref,
) {
  const generatedId = useId();
  const id = providedId ?? generatedId;
  const errorId = `${id}-error`;

  return (
    <FieldWrapper label={label} error={error} hint={hint} id={id} errorId={errorId} required={required}>
      <input
        ref={ref}
        id={id}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className={cn(
          controlBaseClass,
          error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20 dark:border-red-500',
          className,
        )}
        {...rest}
      />
    </FieldWrapper>
  );
});

interface TextareaProps extends ComponentPropsWithoutRef<'textarea'> {
  label: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, hint, id: providedId, className, required, rows = 3, ...rest },
  ref,
) {
  const generatedId = useId();
  const id = providedId ?? generatedId;
  const errorId = `${id}-error`;

  return (
    <FieldWrapper label={label} error={error} hint={hint} id={id} errorId={errorId} required={required}>
      <textarea
        ref={ref}
        id={id}
        rows={rows}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className={cn(
          controlBaseClass,
          error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20 dark:border-red-500',
          className,
        )}
        {...rest}
      />
    </FieldWrapper>
  );
});

interface SelectOption {
  label: string;
  value: string;
}

interface SelectProps extends ComponentPropsWithoutRef<'select'> {
  label: string;
  options: readonly SelectOption[];
  placeholder?: string;
  error?: string;
  hint?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, options, placeholder, error, hint, id: providedId, className, required, ...rest },
  ref,
) {
  const generatedId = useId();
  const id = providedId ?? generatedId;
  const errorId = `${id}-error`;

  return (
    <FieldWrapper label={label} error={error} hint={hint} id={id} errorId={errorId} required={required}>
      <select
        ref={ref}
        id={id}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className={cn(
          controlBaseClass,
          error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20 dark:border-red-500',
          className,
        )}
        {...rest}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </FieldWrapper>
  );
});
