import { useState } from 'react';
import { useAllRuns } from '../api/hooks';
import { StatusBadge } from '../components/StatusBadge';
import type { RunResponse } from '../api/types';

const statusGroups = [
  { label: 'All', value: '' },
  { label: 'Running', value: 'RUNNING' },
  { label: 'Awaiting', value: 'AWAITING' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Failed', value: 'FAILED' },
];

export function HistoryPage() {
  const { data, isLoading } = useAllRuns();
  const [filter, setFilter] = useState('');

  const runs = data?.runs ?? [];
  const filtered = filter
    ? runs.filter(r => filter === 'AWAITING' ? r.run_status.startsWith('AWAITING') : r.run_status === filter)
    : runs;

  return (
    <>
      <header className="h-14 bg-bg-secondary border-b border-border flex items-center px-6 justify-between shrink-0">
        <h2 className="text-lg font-semibold">Job History</h2>
        <div className="flex items-center gap-2">
          {statusGroups.map(g => (
            <button
              key={g.value}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                filter === g.value
                  ? 'bg-accent text-white'
                  : 'bg-white/5 text-text-muted hover:bg-white/10 hover:text-text-primary'
              }`}
              onClick={() => setFilter(g.value)}
            >
              {g.label}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-bg-secondary border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border flex justify-between items-center">
            <h3 className="text-sm font-semibold">All Runs</h3>
            <span className="text-xs text-text-muted">{filtered.length} runs</span>
          </div>
          {isLoading ? (
            <div className="p-8 text-center text-text-muted">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-text-muted">No runs found</div>
          ) : (
            filtered.map(run => (
              <RunRow key={run.run_id} run={run} />
            ))
          )}
        </div>
      </div>
    </>
  );
}

function RunRow({ run }: { run: RunResponse }) {
  return (
    <div className="grid grid-cols-[140px_1fr_130px_140px_100px_auto] items-center px-5 py-3 border-b border-bg-primary last:border-0 gap-3">
      <span className="font-mono text-sm text-blue-300 font-medium">{run.run_code}</span>
      <span className="text-sm text-text-secondary">{run.workflow_name}</span>
      <StatusBadge status={run.run_status} />
      <span className="text-xs text-text-muted font-mono">{run.current_step || '—'}</span>
      <span className="text-xs text-text-muted">{run.worker_id || '—'}</span>
      <span className="text-xs text-text-muted">{formatTime(run.updated_at)}</span>
    </div>
  );
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return d.toLocaleDateString();
}
