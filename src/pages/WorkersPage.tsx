import { useState } from 'react';
import { useWorkers, useStopWorker } from '../api/hooks';
import { StatusBadge } from '../components/StatusBadge';
import { ConfirmDialog } from '../components/ConfirmDialog';

export function WorkersPage() {
  const { data: workers, isLoading } = useWorkers();
  const stopMut = useStopWorker();
  const [confirmWorker, setConfirmWorker] = useState<string | null>(null);

  const list = workers ?? [];

  return (
    <>
      <header className="h-14 bg-bg-secondary border-b border-border flex items-center px-6 shrink-0">
        <h2 className="text-lg font-semibold">Workers</h2>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="text-text-muted">Loading...</div>
        ) : list.length === 0 ? (
          <div className="text-text-muted">No workers registered</div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
            {list.map(w => (
              <div key={w.worker_id} className="bg-bg-secondary border border-border rounded-xl p-5">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-sm font-semibold">{w.worker_id}</h4>
                  <StatusBadge status={w.status.toUpperCase()} />
                </div>
                <div className="text-xs text-text-muted flex flex-col gap-1">
                  <span>Label: {w.worker_label}</span>
                  <span>Current: {w.current_run_id || '—'}</span>
                  <span>Last heartbeat: {w.last_heartbeat ? timeAgo(w.last_heartbeat) : '—'}</span>
                </div>
                <div className="mt-3">
                  <button
                    className="px-3 py-1.5 rounded text-xs border border-border text-text-muted hover:text-text-primary"
                    onClick={() => setConfirmWorker(w.worker_id)}
                  >
                    Stop
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!confirmWorker}
        title="Confirm: Stop Worker"
        message={`Stop worker "${confirmWorker}"? The daemon will shut down gracefully.`}
        confirmLabel="Stop"
        confirmVariant="warning"
        onConfirm={() => {
          if (confirmWorker) stopMut.mutate(confirmWorker);
          setConfirmWorker(null);
        }}
        onCancel={() => setConfirmWorker(null)}
      />
    </>
  );
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  return `${Math.floor(min / 60)}h ago`;
}
