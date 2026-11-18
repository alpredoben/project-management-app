import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '@/shared/libs/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ComponentPropsWithoutRef<'button'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-500 text-white hover:bg-brand-600 focus-visible:ring-brand-500 border border-transparent dark:bg-brand-500 dark:hover:bg-brand-600',
  secondary:
    'bg-gray-900 text-white hover:bg-gray-800 focus-visible:ring-gray-500 border border-transparent dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100',
  outline:
    'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:text-gray-900 focus-visible:ring-brand-500 dark:bg-gray-900 dark:text-gray-200 dark:border-gray-800 dark:hover:bg-white/[0.03]',
  ghost:
    'bg-transparent text-gray-600 border border-transparent hover:bg-gray-100 hover:text-gray-900 focus-visible:ring-brand-500 dark:text-gray-400 dark:hover:bg-white/[0.05] dark:hover:text-white',
  danger:
    'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500 border border-transparent dark:bg-red-600 dark:hover:bg-red-500',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-9 px-4 text-sm gap-2',
  lg: 'h-10 px-5 text-sm gap-2',
};

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  className,
  type = 'button',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium whitespace-nowrap shrink-0 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-950 disabled:opacity-50 disabled:pointer-events-none cursor-pointer',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...rest}
    >
      {isLoading && (
        <span
          aria-hidden="true"
          className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
      {children}
    </button>
  );
}
