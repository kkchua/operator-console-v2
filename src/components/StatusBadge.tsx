const statusStyles: Record<string, string> = {
  RUNNING: 'bg-blue-900/50 text-blue-400',
  PENDING: 'bg-blue-900/30 text-blue-300',
  SUBMITTED: 'bg-blue-900/30 text-blue-300',
  WAITING_FOR_HUMAN_APPROVAL: 'bg-amber-900/50 text-amber-400',
  AWAITING_INTERVENTION: 'bg-amber-900/50 text-amber-400',
  AWAITING_MAXRETRIED: 'bg-amber-900/50 text-amber-400',
  COMPLETED: 'bg-green-900/50 text-green-400',
  FAILED: 'bg-red-900/50 text-red-400',
  CANCELLED: 'bg-gray-700/50 text-gray-400',
};

const dotStyles: Record<string, string> = {
  RUNNING: 'bg-blue-400 animate-pulse',
  PENDING: 'bg-blue-300',
  SUBMITTED: 'bg-blue-300',
  WAITING_FOR_HUMAN_APPROVAL: 'bg-amber-400 animate-pulse',
  AWAITING_INTERVENTION: 'bg-amber-400 animate-pulse',
  AWAITING_MAXRETRIED: 'bg-amber-400',
  COMPLETED: 'bg-green-400',
  FAILED: 'bg-red-400',
  CANCELLED: 'bg-gray-400',
};

const statusLabels: Record<string, string> = {
  RUNNING: 'Running',
  PENDING: 'Pending',
  SUBMITTED: 'Submitted',
  WAITING_FOR_HUMAN_APPROVAL: 'Awaiting Approval',
  AWAITING_INTERVENTION: 'Awaiting Intervention',
  AWAITING_MAXRETRIED: 'Awaiting Retry',
  COMPLETED: 'Completed',
  FAILED: 'Failed',
  CANCELLED: 'Cancelled',
};

export function StatusBadge({ status }: { status: string }) {
  const style = statusStyles[status] || 'bg-gray-800 text-gray-400';
  const dot = dotStyles[status] || 'bg-gray-400';
  const label = statusLabels[status] || status;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${style}`} title={status}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}
