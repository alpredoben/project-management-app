import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description: string;
  apiPrefix?: string | null;
  actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 pb-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1">
        <h1 className="font-display text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          {title}
        </h1>
        <p className="max-w-2xl text-sm text-gray-500 dark:text-gray-400">{description}</p>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
