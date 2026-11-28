import { Clock, Flag, Tag } from 'lucide-react';
import type { In_TaskTrackingItem } from '@/types/api-type';
import { cn } from '@/shared/libs/cn';
import { TaskAssignerAvatarStack } from './TaskAssignerAvatarStack';
import { getDaysRemainingInfo } from './task-tracking-utils';

export function TaskBoardCard({
  task,
  onClick,
}: {
  task: In_TaskTrackingItem;
  onClick: () => void;
}) {
  const daysInfo = getDaysRemainingInfo(task.end_date);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick();
        }
      }}
      className="group rounded-xl border border-gray-200/90 bg-white p-3.5 shadow-2xs transition-all duration-150 hover:border-brand-300 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:border-brand-700 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-400 dark:text-gray-500 truncate">
          {task.task_type?.name ? (
            <>
              <Tag className="h-3 w-3 shrink-0" />
              <span className="truncate">{task.task_type.name}</span>
            </>
          ) : (
            <span>Task</span>
          )}
        </span>
        <TaskAssignerAvatarStack assigners={task.task_assigners} />
      </div>

      <div className="mt-2 space-y-1">
        <h4 className="text-sm font-semibold text-gray-900 group-hover:text-brand-600 dark:text-white dark:group-hover:text-brand-400 transition-colors line-clamp-2">
          {task.title}
        </h4>
        {task.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
            {task.description}
          </p>
        )}
      </div>

      <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-2.5 dark:border-gray-800/80">
        <div className="flex items-center gap-2.5 text-[11px] font-medium text-gray-500 dark:text-gray-400">
          {task.priority && (
            <span className="inline-flex items-center gap-1 capitalize font-semibold text-amber-600 dark:text-amber-400">
              <Flag className="h-3 w-3" />
              {task.priority}
            </span>
          )}
          {task.estimated_hours !== undefined &&
            task.estimated_hours !== null && (
              <span className="inline-flex items-center gap-1 tabular-nums">
                <Clock className="h-3 w-3 text-gray-400" />
                {Number(task.estimated_hours)}h
              </span>
            )}
        </div>

        {daysInfo && (
          <span
            className={cn(
              'inline-flex items-center gap-1 text-[11px] font-semibold',
              daysInfo.tone === 'danger'
                ? 'text-red-500 dark:text-red-400'
                : 'text-amber-600 dark:text-amber-400',
            )}
          >
            <Clock className="h-3 w-3" />
            <span>{daysInfo.label}</span>
          </span>
        )}
      </div>
    </div>
  );
}
