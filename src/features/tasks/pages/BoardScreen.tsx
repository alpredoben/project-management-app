import { useMemo } from 'react';
import { Plus } from 'lucide-react';
import type {
  In_TaskStatusSummary,
  In_TaskTrackingItem,
} from '@/types/api-type';
import { TaskBoardCard } from '../components/TaskBoardCard';

export interface BoardScreenProps {
  tasks: In_TaskTrackingItem[];
  statuses: In_TaskStatusSummary[];
  onTaskClick: (taskId: string) => void;
  onCreateTask: (statusId?: string) => void;
}

export function BoardScreen({
  tasks,
  statuses,
  onTaskClick,
  onCreateTask,
}: BoardScreenProps) {
  const tasksByStatus = useMemo(() => {
    const grouped = new Map<string, In_TaskTrackingItem[]>();
    for (const task of tasks) {
      const statusId = task.task_status?.id ?? 'unassigned';
      const statusTasks = grouped.get(statusId) ?? [];
      statusTasks.push(task);
      grouped.set(statusId, statusTasks);
    }
    return grouped;
  }, [tasks]);

  return (
    <div className="flex items-start gap-4 overflow-x-auto pb-4">
      {statuses.map((status) => {
        const columnTasks = tasksByStatus.get(status.id) ?? [];
        const dotColor = status.color_code || '#6366f1';

        return (
          <div
            key={status.id}
            className="flex w-[290px] sm:w-[305px] shrink-0 flex-col gap-3"
          >
            <div className="flex items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 shadow-2xs dark:border-gray-800 dark:bg-gray-900">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-xs"
                  style={{ backgroundColor: dotColor }}
                />
                <span className="truncate text-xs font-semibold text-gray-800 dark:text-white">
                  {status.name}
                </span>
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-md border border-gray-200 bg-gray-50 px-1.5 text-[11px] font-semibold text-gray-600 tabular-nums dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                  {columnTasks.length}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onCreateTask(status.id)}
                className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200 transition-colors cursor-pointer"
                title={`Add task to ${status.name}`}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-col gap-2.5">
              {columnTasks.map((task) => (
                <TaskBoardCard
                  key={task.id}
                  task={task}
                  onClick={() => onTaskClick(task.id)}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={() => onCreateTask(status.id)}
              className="flex w-full items-center gap-1.5 rounded-xl px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-gray-500 hover:bg-white hover:text-brand-600 hover:shadow-2xs dark:text-gray-400 dark:hover:bg-gray-900 dark:hover:text-brand-400 transition-all cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Task</span>
            </button>
          </div>
        );
      })}
    </div>
  );
}
