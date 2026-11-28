import { Eye } from 'lucide-react';
import { formatDate } from '@/shared/libs/helper';
import type { In_TaskTrackingItem } from '@/types/api-type';
import { TaskAssignerAvatarStack } from '../../components/TaskAssignerAvatarStack';

export interface ListTaskScreenProps {
  tasks: In_TaskTrackingItem[];
  onTaskClick: (taskId: string) => void;
}

export function ListTaskScreen({ tasks, onTaskClick }: ListTaskScreenProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      {tasks.length === 0 ? (
        <div className="p-8 text-center text-xs text-gray-500 dark:text-gray-400">
          No tasks found for this project.
        </div>
      ) : (
        <table className="w-full text-left text-xs">
          <thead className="border-b border-gray-100 bg-gray-50/70 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:border-gray-800 dark:bg-white/[0.02] dark:text-gray-400">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Assigners</th>
              <th className="px-4 py-3">Timeline</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {tasks.map((task) => (
              <tr
                key={task.id}
                className="hover:bg-gray-50/70 dark:hover:bg-white/[0.02]"
              >
                <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">
                  {task.title}
                </td>
                <td className="px-4 py-3">
                  {task.task_status ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-2.5 py-0.5 text-[11px] font-semibold dark:border-gray-700">
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{
                          backgroundColor:
                            task.task_status.color_code || '#6366f1',
                        }}
                      />
                      {task.task_status.name}
                    </span>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                  {task.task_type?.name ?? '—'}
                </td>
                <td className="px-4 py-3">
                  <TaskAssignerAvatarStack assigners={task.task_assigners} />
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                  {task.start_date
                    ? formatDate(task.start_date, 'D MMM YYYY')
                    : '—'}{' '}
                  –{' '}
                  {task.end_date
                    ? formatDate(task.end_date, 'D MMM YYYY')
                    : '—'}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => onTaskClick(task.id)}
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-950/30 cursor-pointer"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>Detail</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}