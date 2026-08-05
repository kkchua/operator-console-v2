import { useState, useEffect, useMemo } from 'react';
import { useAllRuns, useRepos } from '../api/hooks';
import { useSelectedWorker } from '../components/WorkerContext';
import { StatusBadge } from '../components/StatusBadge';
import type { RunResponse } from '../api/types';

const PAGE_SIZE = 25;

const statusGroups = [
  { label: 'All', value: '' },
  { label: 'Running', value: 'RUNNING' },
  { label: 'Awaiting', value: 'AWAITING' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Failed', value: 'FAILED' },
];

export function HistoryPage() {
  const { selectedWorkerId } = useSelectedWorker();
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState('');
  const offset = page * PAGE_SIZE;
  const { data, isLoading } = useAllRuns(10000, selectedWorkerId, PAGE_SIZE, offset);
  const { data: repos } = useRepos();

  // Reset page when worker changes
  useEffect(() => { setPage(0); }, [selectedWorkerId]);

  const runs = data?.runs ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Build workflow_name → repo_name lookup
  const workflowToRepo = useMemo(() => {
    const map = new Map<string, string>();
    for (const repo of repos ?? []) {
      for (const wf of repo.workflows) {
        map.set(wf.workflow_name, repo.name);
      }
    }
    return map;
  }, [repos]);

  const filtered = filter
    ? runs.filter(r => filter === 'AWAITING' ? r.run_status.startsWith('AWAITING') : r.run_status === filter)
    : runs;

  // Reset to page 0 when worker or filter changes
  const onFilterChange = (v: string) => { setFilter(v); setPage(0); };

  return (
    <>
      <header className="h-14 bg-bg-secondary border-b border-border flex items-center px-6 justify-between shrink-0">
        <h2 className="text-lg font-semibold">Job History</h2>
        <div className="flex flex-wrap items-center gap-2">
          {statusGroups.map(g => (
            <button
              key={g.value}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                filter === g.value
                  ? 'bg-accent text-white'
                  : 'bg-white/5 text-text-muted hover:bg-white/10 hover:text-text-primary'
              }`}
              onClick={() => onFilterChange(g.value)}
            >
              {g.label}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="overflow-x-auto">
        <div className="bg-bg-secondary border border-border rounded-xl">
          <div className="px-5 py-3.5 border-b border-border flex justify-between items-center">
            <h3 className="text-sm font-semibold">All Runs</h3>
            <span className="text-xs text-text-muted">
              {total > 0 ? `${offset + 1}–${Math.min(offset + PAGE_SIZE, total)} of ${total}` : '0 runs'}
            </span>
          </div>
          {isLoading ? (
            <div className="p-8 text-center text-text-muted">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-text-muted">No runs found</div>
          ) : (
            <>
              {/* Mobile card layout */}
              <div className="md:hidden divide-y divide-bg-primary">
                {filtered.map(run => (
                  <div key={run.run_id} className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm text-blue-300 font-medium">{run.run_code}</span>
                      <StatusBadge status={run.run_status} />
                    </div>
                    <div className="text-sm text-text-secondary truncate">{run.workflow_name}</div>
                    <div className="text-xs text-text-muted mb-1">{workflowToRepo.get(run.workflow_name) || '—'}</div>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-text-muted">
                      <span className="font-mono">{run.current_step || '—'}</span>
                      <span>{run.worker_id || '—'}</span>
                      <span>{formatTime(run.updated_at)}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop grid layout */}
              <div className="hidden md:block">
                {filtered.map(run => (
                  <RunRow key={run.run_id} run={run} repoName={workflowToRepo.get(run.workflow_name) || '—'} />
                ))}
              </div>
            </>
          )}
          {/* Pagination */}
          <div className="px-5 py-3 border-t border-border flex items-center justify-between">
            <button
              className="px-3 py-1.5 rounded text-xs border border-border text-text-muted hover:text-text-primary hover:border-text-muted disabled:opacity-30 disabled:pointer-events-none"
              disabled={page === 0}
              onClick={() => setPage(p => p - 1)}
            >
              ← Prev
            </button>
            <span className="text-xs text-text-muted">
              Page {page + 1} of {totalPages}
            </span>
            <button
              className="px-3 py-1.5 rounded text-xs border border-border text-text-muted hover:text-text-primary hover:border-text-muted disabled:opacity-30 disabled:pointer-events-none"
              disabled={page >= totalPages - 1}
              onClick={() => setPage(p => p + 1)}
            >
              Next →
            </button>
          </div>
        </div>
        </div>
      </div>
    </>
  );
}

function RunRow({ run, repoName }: { run: RunResponse; repoName: string }) {
  return (
    <div className="grid grid-cols-[140px_120px_1fr_130px_140px_100px_auto] items-center px-5 py-3 border-b border-bg-primary last:border-0 gap-3">
      <span className="font-mono text-sm text-blue-300 font-medium">{run.run_code}</span>
      <span className="text-xs text-text-muted truncate">{repoName}</span>
      <span className="text-sm text-text-secondary truncate">{run.workflow_name}</span>
      <StatusBadge status={run.run_status} />
      <span className="text-xs text-text-muted font-mono">{run.current_step || '—'}</span>
      <span className="text-xs text-text-muted">{run.worker_id || '—'}</span>
      <span className="text-xs text-text-muted">{formatTime(run.updated_at)}</span>
    </div>
  );
}

function formatTime(iso: string): string {
  const d = new Date(iso.endsWith('Z') || iso.includes('+') ? iso : iso + 'Z');
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return d.toLocaleDateString();
}
