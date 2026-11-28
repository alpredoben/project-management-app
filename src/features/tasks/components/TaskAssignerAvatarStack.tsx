import type { In_TaskAssigner } from '@/types/api-type';
import { getPublicUrlExpression } from '@/shared/libs/helper';

function getInitials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => word[0] ?? '')
      .join('')
      .toUpperCase() || 'U'
  );
}

export function TaskAssignerAvatarStack({
  assigners = [],
}: {
  assigners?: In_TaskAssigner[];
}) {
  if (assigners.length === 0) return null;

  const visible = assigners.slice(0, 3);
  const extra = assigners.length - visible.length;

  return (
    <div className="flex items-center -space-x-2">
      {visible.map((assigner) => {
        const displayName = assigner.user?.name ?? assigner.name ?? 'User';
        const rawAvatar = assigner.user?.avatar_url ?? assigner.avatar_url ?? null;
        const avatarUrl = rawAvatar ? getPublicUrlExpression(rawAvatar) : null;

        return avatarUrl ? (
          <img
            key={assigner.id}
            src={avatarUrl}
            alt={displayName}
            title={displayName}
            className="h-6 w-6 rounded-full object-cover ring-2 ring-white dark:ring-gray-900"
          />
        ) : (
          <span
            key={assigner.id}
            title={displayName}
            className="flex h-6 w-6 items-center justify-center rounded-full bg-linear-to-tr from-brand-500 to-indigo-600 text-[10px] font-bold text-white ring-2 ring-white dark:ring-gray-900"
          >
            {getInitials(displayName)}
          </span>
        );
      })}
      {extra > 0 && (
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-[10px] font-semibold text-gray-600 ring-2 ring-white dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-900">
          +{extra}
        </span>
      )}
    </div>
  );
}
