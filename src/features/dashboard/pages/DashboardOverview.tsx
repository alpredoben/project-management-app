import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';

import { cn } from '@/shared/libs/cn';

type ChartMode = 'milestones' | 'tasks';

export function DashboardOverviewPage() {
  const [chartMode, setChartMode] = useState<ChartMode>('milestones');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Executive Overview"
        description="Portfolio throughput across workspaces, projects, milestones, and active sprint tasks."
        actions={
          <Link
            to="/admin/projects"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand-500 px-4 text-sm font-medium text-white hover:bg-brand-600 whitespace-nowrap shrink-0 transition-colors"
          >
            Manage Projects
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        }
      />


      {/* Middle Row: TailAdmin 12-Col Analytics Split (8 cols chart + 4 cols radial target) */}
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <section className="col-span-12 xl:col-span-8 rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-base font-semibold text-gray-900 dark:text-white/90">
                {chartMode === 'milestones' ? 'Milestone Delivery Progress' : 'Task Distribution by Status'}
              </h2>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                {chartMode === 'milestones'
                  ? 'Live completion percentage across tracked delivery milestones'
                  : 'Task volume and estimated hours grouped by workflow stage'}
              </p>
            </div>

            <div
              role="tablist"
              aria-label="Chart view switcher"
              className="inline-flex items-center gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-900"
            >
              <button
                type="button"
                role="tab"
                aria-selected={chartMode === 'milestones'}
                onClick={() => setChartMode('milestones')}
                className={cn(
                  'rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer',
                  chartMode === 'milestones'
                    ? 'bg-white text-gray-900 shadow-xs dark:bg-gray-800 dark:text-white'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white',
                )}
              >
                Milestones
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={chartMode === 'tasks'}
                onClick={() => setChartMode('tasks')}
                className={cn(
                  'rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer',
                  chartMode === 'tasks'
                    ? 'bg-white text-gray-900 shadow-xs dark:bg-gray-800 dark:text-white'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white',
                )}
              >
                Task Workload
              </button>
            </div>
          </div>

        </section>

      </div>
    </div>
  );
}
