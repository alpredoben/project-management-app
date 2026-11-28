import { Calendar } from 'lucide-react';
import type { In_TaskTrackingItem } from '@/types/api-type';
import { formatDate } from '@/shared/libs/helper';
import { cn } from '@/shared/libs/cn';
import { TaskAssignerAvatarStack } from '../components/TaskAssignerAvatarStack';
import { getDaysRemainingInfo } from '../components/task-tracking-utils';

export interface TimelineScreenProps {
  tasks: In_TaskTrackingItem[];
  onTaskClick: (taskId: string) => void;
}

export function TimelineScreen({ tasks, onTaskClick }: TimelineScreenProps) {
  return (
    <div className="space-y-2.5 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      {tasks.length === 0 ? (
        <div className="p-6 text-center text-xs text-gray-500 dark:text-gray-400">
          No scheduled tasks available.
        </div>
      ) : (
        tasks.map((task) => {
          const daysInfo = getDaysRemainingInfo(task.end_date);
          return (
            <div
              key={task.id}
              onClick={() => onTaskClick(task.id)}
              className="flex flex-col gap-2 rounded-xl border border-gray-100 bg-gray-50/70 p-3.5 sm:flex-row sm:items-center sm:justify-between hover:border-brand-300 transition-colors cursor-pointer dark:border-gray-800 dark:bg-white/[0.02]"
            >
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  {task.task_status && (
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{
                        backgroundColor:
                          task.task_status.color_code || '#6366f1',
                      }}
                    />
                  )}
                  <span className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                    {task.title}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {task.task_status?.name ?? 'Backlog'} •{' '}
                  {task.task_type?.name ?? 'Task'}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs">
                <TaskAssignerAvatarStack assigners={task.task_assigners} />
                <span className="inline-flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                  <Calendar className="h-3.5 w-3.5 text-gray-400" />
                  {task.start_date
                    ? formatDate(task.start_date, 'D MMM YYYY')
                    : '—'}{' '}
                  –{' '}
                  {task.end_date
                    ? formatDate(task.end_date, 'D MMM YYYY')
                    : '—'}
                </span>
                {daysInfo && (
                  <span
                    className={cn(
                      'font-semibold',
                      daysInfo.tone === 'danger'
                        ? 'text-red-500'
                        : 'text-amber-600',
                    )}
                  >
                    {daysInfo.label}
                  </span>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
