export function getDaysRemainingInfo(endDateStr?: string | null): {
  label: string;
  tone: 'danger' | 'warning' | 'neutral';
} | null {
  if (!endDateStr) return null;
  const end = new Date(endDateStr);
  if (Number.isNaN(end.getTime())) return null;

  const now = new Date();
  const todayUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const endUtc = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
  const diffDays = Math.round((endUtc - todayUtc) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const overdue = Math.abs(diffDays);
    return {
      label: `${overdue} ${overdue === 1 ? 'Day' : 'Days'} Overdue`,
      tone: 'danger',
    };
  }
  if (diffDays === 0) {
    return { label: 'Due Today', tone: 'danger' };
  }
  if (diffDays <= 3) {
    return {
      label: `${diffDays} ${diffDays === 1 ? 'Day' : 'Days'} Left`,
      tone: 'danger',
    };
  }
  return {
    label: `${diffDays} Days Left`,
    tone: 'warning',
  };
}
