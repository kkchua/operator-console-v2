import { useState } from 'react';
import { useActiveRuns, useRequestAction } from '../api/hooks';
import { StatusBadge } from '../components/StatusBadge';
import { ConfirmDialog } from '../components/ConfirmDialog';
import type { RunResponse } from '../api/types';

const actionVariant: Record<string, 'success' | 'danger' | 'warning' | 'primary'> = {
  Approve: 'success', Reject: 'danger', Cancel: 'danger',
  Resume: 'warning', Retry: 'primary', Reset: 'primary',
};

const actionLabels: Record<string, string> = {
  Approve: 'Approve', Reject: 'Reject', Cancel: 'Cancel Job',
  Resume: 'Resume', Retry: 'Retry', Reset: 'Reset Step',
};

export function RunsPage() {
  const { data, isLoading } = useActiveRuns();
  const actionMut = useRequestAction();
  const [selectedRun, setSelectedRun] = useState<RunResponse | null>(null);
  const [confirm, setConfirm] = useState<{ action: string; run: RunResponse } | null>(null);

  const runs = data?.runs ?? [];
  const counts = {
    running: runs.filter(r => r.run_status === 'RUNNING').length,
    awaiting: runs.filter(r => r.run_status.startsWith('AWAITING')).length,
    pending: runs.filter(r => r.run_status === 'PENDING' || r.run_status === 'SUBMITTED').length,
  };

  const handleAction = (action: string, run: RunResponse) => {
    setConfirm({ action, run });
  };

  const doAction = (feedback?: string) => {
    if (!confirm) return;
    actionMut.mutate(
      { runId: confirm.run.run_id, data: { action: confirm.action, feedback } },
      { onSettled: () => setConfirm(null) },
    );
  };

  return (
    <>
      <header className="h-14 bg-bg-secondary border-b border-border flex items-center px-6 justify-between shrink-0">
        <h2 className="text-lg font-semibold">Active Runs</h2>
        <div className="flex items-center gap-3">
          <button className="px-3 py-1.5 rounded-md text-xs border border-border text-text-muted hover:text-text-primary">
            ↻ Refresh
          </button>
          <label className="text-xs text-text-muted flex items-center gap-1.5">
            <input type="checkbox" defaultChecked /> Auto
          </label>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <StatCard value={counts.running} label="Running" color="text-blue-400" />
          <StatCard value={counts.awaiting} label="Awaiting Action" color="text-amber-400" />
          <StatCard value={counts.pending} label="Pending" color="text-blue-300" />
        </div>

        {/* Run list */}
        <div className="bg-bg-secondary border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border flex justify-between items-center">
            <h3 className="text-sm font-semibold">Active Runs</h3>
            <span className="text-xs text-text-muted">{runs.length} runs</span>
          </div>
          {isLoading ? (
            <div className="p-8 text-center text-text-muted">Loading...</div>
          ) : runs.length === 0 ? (
            <div className="p-8 text-center text-text-muted">No active runs</div>
          ) : (
            runs.map(run => (
              <div
                key={run.run_id}
                className="grid grid-cols-[140px_1fr_130px_140px_auto] items-center px-5 py-3 border-b border-bg-primary last:border-0 hover:bg-white/5 cursor-pointer gap-3 transition-colors"
                onClick={() => setSelectedRun(run)}
              >
                <span className="font-mono text-sm text-blue-300 font-medium">{run.run_code}</span>
                <span className="text-sm text-text-secondary">{run.workflow_name}</span>
                <StatusBadge status={run.run_status} />
                <span className="text-xs text-text-muted font-mono">{run.current_step}</span>
                <div className="flex gap-1 justify-end" onClick={e => e.stopPropagation()}>
                  {run.valid_actions.map(action => (
                    <button
                      key={action}
                      className={`px-2.5 py-1 rounded text-xs font-medium ${
                        action === 'Cancel' ? 'bg-danger/20 text-red-400 hover:bg-danger/30' :
                        action === 'Approve' ? 'bg-success/20 text-green-400 hover:bg-success/30' :
                        action === 'Reject' ? 'bg-danger/20 text-red-400 hover:bg-danger/30' :
                        'bg-white/5 text-text-muted hover:bg-white/10'
                      }`}
                      onClick={() => handleAction(action, run)}
                    >
                      {actionLabels[action] || action}
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Detail panel */}
      {selectedRun && (
        <div className="fixed top-0 right-0 w-[480px] h-screen bg-bg-secondary border-l border-border shadow-2xl flex flex-col z-40">
          <div className="p-5 border-b border-border flex justify-between items-start">
            <div>
              <div className="text-xs text-text-muted mb-1">Run Detail</div>
              <h3 className="font-mono text-lg">{selectedRun.run_code}</h3>
            </div>
            <button className="px-2 py-1 rounded border border-border text-text-muted hover:text-text-primary" onClick={() => setSelectedRun(null)}>✕</button>
          </div>
          <div className="flex-1 overflow-y-auto p-5">
            <DetailSection title="State">
              <DetailField label="Status"><StatusBadge status={selectedRun.run_status} /></DetailField>
              <DetailField label="Action Requested">
                <span className="font-mono text-text-secondary">{selectedRun.action_requested || '—'}</span>
              </DetailField>
              <DetailField label="Current Step" value={selectedRun.current_step || '—'} />
              <DetailField label="Workflow" value={selectedRun.workflow_name} />
              <DetailField label="Worker" value={selectedRun.worker_id || '—'} />
            </DetailSection>
            <DetailSection title="Timing">
              <DetailField label="Created" value={toLocalTime(selectedRun.created_at)} />
              <DetailField label="Updated" value={toLocalTime(selectedRun.updated_at)} />
            </DetailSection>
          </div>
          <div className="p-4 border-t border-border flex gap-2 flex-wrap">
            {selectedRun.valid_actions.map(action => (
              <button
                key={action}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  action === 'Approve' ? 'bg-success text-white hover:bg-green-600' :
                  action === 'Reject' || action === 'Cancel' ? 'bg-danger text-white hover:bg-red-600' :
                  action === 'Resume' ? 'bg-warning text-black hover:bg-amber-600' :
                  'border border-border text-text-muted hover:text-text-primary'
                }`}
                onClick={() => handleAction(action, selectedRun)}
              >
                {actionLabels[action] || action}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Confirm dialog */}
      <ConfirmDialog
        open={!!confirm}
        title={`Confirm: ${actionLabels[confirm?.action || ''] || confirm?.action}`}
        message={`${actionLabels[confirm?.action || ''] || confirm?.action} for ${confirm?.run.run_code}? This will be sent to the backend immediately.`}
        confirmLabel={actionLabels[confirm?.action || ''] || confirm?.action || 'Confirm'}
        confirmVariant={actionVariant[confirm?.action || ''] || 'primary'}
        showFeedback={['Approve', 'Reject', 'Resume', 'Retry'].includes(confirm?.action || '')}
        onConfirm={doAction}
        onCancel={() => setConfirm(null)}
      />
    </>
  );
}

function StatCard({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="bg-bg-secondary border border-border rounded-xl p-4">
      <div className={`text-3xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-text-muted mt-0.5 uppercase tracking-wider">{label}</div>
    </div>
  );
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h4 className="text-xs uppercase tracking-wider text-text-muted mb-2">{title}</h4>
      {children}
    </div>
  );
}

function DetailField({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return (
    <div className="flex justify-between py-1.5 text-sm border-b border-bg-primary">
      <span className="text-text-muted">{label}</span>
      {children || <span className="font-mono text-text-secondary">{value}</span>}
    </div>
  );
}

function toLocalTime(iso: string): string {
  // Backend returns naive UTC datetimes — append 'Z' to parse as UTC
  const d = new Date(iso.endsWith('Z') || iso.includes('+') ? iso : iso + 'Z');
  return d.toLocaleString();
}
