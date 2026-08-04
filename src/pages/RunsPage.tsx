import { useState, useRef, useEffect } from 'react';
import { useActiveRuns, useRequestAction } from '../api/hooks';
import { useSelectedWorker } from '../components/WorkerContext';
import { StatusBadge } from '../components/StatusBadge';
import { ConfirmDialog } from '../components/ConfirmDialog';
import type { RunResponse } from '../api/types';

const actionVariant: Record<string, 'success' | 'danger' | 'warning' | 'primary'> = {
  APPROVE: 'success', REJECT: 'danger', CANCEL: 'danger', FORCE_CANCEL: 'danger',
  RESUME: 'warning', RETRY: 'primary', RESET: 'primary',
};

const actionLabels: Record<string, string> = {
  APPROVE: 'Approve', REJECT: 'Reject', CANCEL: 'Cancel Job', FORCE_CANCEL: 'Force Cancel',
  RESUME: 'Resume', RETRY: 'Retry', RESET: 'Reset Step',
};

const actionMessages: Record<string, string> = {
  APPROVE: 'Approve the current step and advance to the next step in the workflow.',
  REJECT: 'Reject the current step. The job will loop back for refinement.',
  CANCEL: 'Stop the job gracefully, letting the current step finish.',
  FORCE_CANCEL: 'Immediately terminate the job and kill any running child processes.',
  RESUME: 'Force-approve the current step and advance, bypassing the wait condition.',
  RETRY: 'Re-execute the current step from scratch with a fresh attempt.',
  RESET: 'Reset the current step back to pending status for re-execution.',
};

const AWAITING_STATUSES = ['WAITING_FOR_HUMAN_APPROVAL', 'AWAITING_INTERVENTION', 'AWAITING_MAXRETRIED'];
const USER_ACTION_STATUSES = ['USER_APPROVED', 'USER_REJECTED', 'USER_RESUMED', 'USER_RETRIED'];

function ActionDropdown({ run, onAction }: { run: RunResponse; onAction: (action: string, run: RunResponse) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  if (run.valid_actions.length === 0) return <span className="text-xs text-text-muted">—</span>;

  return (
    <div ref={ref} className="relative">
      <button
        className="px-2.5 py-1 rounded text-xs font-medium bg-white/5 text-text-muted hover:bg-white/10 border border-border"
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
      >
        Actions ▾
      </button>
      {open && (
        <div className="absolute right-0 bottom-full mb-1 w-40 bg-bg-secondary border border-border rounded-lg shadow-xl z-50 py-1">
          {run.valid_actions.map(action => (
            <button
              key={action}
              className={`w-full text-left px-3 py-1.5 text-xs font-medium hover:bg-white/10 ${
                action === 'CANCEL' ? 'text-red-400' :
                action === 'APPROVE' ? 'text-green-400' :
                action === 'REJECT' ? 'text-red-400' :
                'text-text-secondary'
              }`}
              onClick={(e) => { e.stopPropagation(); setOpen(false); onAction(action, run); }}
            >
              {actionLabels[action] || action}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function RunsPage() {
  const { selectedWorkerId } = useSelectedWorker();
  const { data, isLoading } = useActiveRuns(5000, selectedWorkerId);
  const actionMut = useRequestAction();
  const [selectedRun, setSelectedRun] = useState<RunResponse | null>(null);
  const [confirm, setConfirm] = useState<{ action: string; run: RunResponse } | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [workflowFilter, setWorkflowFilter] = useState<string>('all');

  const runs = data?.runs ?? [];
  const counts = {
    running: runs.filter(r => r.run_status === 'RUNNING').length,
    awaiting: runs.filter(r => AWAITING_STATUSES.includes(r.run_status)).length,
    userAction: runs.filter(r => USER_ACTION_STATUSES.includes(r.run_status)).length,
    pending: runs.filter(r => r.run_status === 'PENDING' || r.run_status === 'USER_SUBMITTED').length,
  };

  // Keep selectedRun in sync with refreshed data
  const currentSelectedRun = selectedRun
    ? runs.find(r => r.run_id === selectedRun.run_id) || selectedRun
    : null;

  // Get unique workflow names for filter dropdown
  const workflows = [...new Set(runs.map(r => r.workflow_name))].sort();

  // Filter runs
  const filteredRuns = runs.filter(r => {
    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'running' && r.run_status !== 'RUNNING') return false;
      if (statusFilter === 'userAction' && !USER_ACTION_STATUSES.includes(r.run_status)) return false;
      if (statusFilter === 'awaiting' && !AWAITING_STATUSES.includes(r.run_status)) return false;
      if (statusFilter === 'pending' && r.run_status !== 'PENDING' && r.run_status !== 'USER_SUBMITTED') return false;
    }
    // Workflow filter
    if (workflowFilter !== 'all' && r.workflow_name !== workflowFilter) return false;
    return true;
  });

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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard value={counts.running} label="Running" color="text-blue-400" />
          <StatCard value={counts.userAction} label="User Action" color="text-emerald-400" />
          <StatCard value={counts.awaiting} label="Awaiting Human" color="text-amber-400" />
          <StatCard value={counts.pending} label="Pending" color="text-blue-300" />
        </div>

        {/* Run list */}
        <div className="overflow-x-auto">
        <div className="bg-bg-secondary border border-border rounded-xl">
          {/* Filter panel */}
          <div className="px-5 py-3 border-b border-border flex flex-wrap items-center gap-4">
            <span className="text-xs text-text-muted uppercase tracking-wider">Filters:</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-2.5 py-1 rounded text-xs bg-bg-primary border border-border text-text-secondary focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="running">Running</option>
              <option value="userAction">User Action</option>
              <option value="awaiting">Awaiting Human</option>
              <option value="pending">Pending</option>
            </select>
            <select
              value={workflowFilter}
              onChange={e => setWorkflowFilter(e.target.value)}
              className="px-2.5 py-1 rounded text-xs bg-bg-primary border border-border text-text-secondary focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Workflows</option>
              {workflows.map(w => <option key={w} value={w}>{w}</option>)}
            </select>
            {(statusFilter !== 'all' || workflowFilter !== 'all') && (
              <button
                onClick={() => { setStatusFilter('all'); setWorkflowFilter('all'); }}
                className="px-2 py-1 rounded text-xs text-text-muted hover:text-text-primary hover:bg-white/5"
              >
                Clear
              </button>
            )}
            <span className="ml-auto text-xs text-text-muted">{filteredRuns.length} of {runs.length} runs</span>
          </div>
          <div className="px-5 py-3.5 border-b border-border flex justify-between items-center">
            <h3 className="text-sm font-semibold">Active Runs</h3>
            <span className="text-xs text-text-muted">{runs.length} runs</span>
          </div>
          {isLoading ? (
            <div className="p-8 text-center text-text-muted">Loading...</div>
          ) : filteredRuns.length === 0 ? (
            <div className="p-8 text-center text-text-muted">
              {runs.length === 0 ? 'No active runs' : 'No runs match the current filters'}
            </div>
          ) : (
            <>
              {/* Mobile card layout */}
              <div className="md:hidden divide-y divide-bg-primary">
                {filteredRuns.map(run => (
                  <div
                    key={run.run_id}
                    className="p-4 cursor-pointer hover:bg-white/5 transition-colors"
                    onClick={() => setSelectedRun(run)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-sm text-blue-300 font-medium">{run.run_code}</span>
                      <StatusBadge status={run.run_status} />
                    </div>
                    <div className="text-sm text-text-secondary mb-1 truncate">{run.workflow_name}</div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-text-muted font-mono">{run.current_step}</span>
                      <div onClick={e => e.stopPropagation()}>
                        <ActionDropdown run={run} onAction={handleAction} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop grid layout */}
              <div className="hidden md:block">
                {filteredRuns.map(run => (
                  <div
                    key={run.run_id}
                    className="grid grid-cols-[140px_1fr_130px_140px_auto] items-center px-5 py-3 border-b border-bg-primary last:border-0 hover:bg-white/5 cursor-pointer gap-3 transition-colors"
                    onClick={() => setSelectedRun(run)}
                  >
                    <span className="font-mono text-sm text-blue-300 font-medium">{run.run_code}</span>
                    <span className="text-sm text-text-secondary">{run.workflow_name}</span>
                    <StatusBadge status={run.run_status} />
                    <span className="text-xs text-text-muted font-mono">{run.current_step}</span>
                    <div className="flex justify-end" onClick={e => e.stopPropagation()}>
                      <ActionDropdown run={run} onAction={handleAction} />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
        </div>
      </div>

      {/* Detail panel */}
      {currentSelectedRun && (
        <div className="fixed top-0 right-0 w-full sm:w-[480px] h-screen bg-bg-secondary border-l border-border shadow-2xl flex flex-col z-40">
          <div className="p-5 border-b border-border flex justify-between items-start">
            <div>
              <div className="text-xs text-text-muted mb-1">Run Detail</div>
              <h3 className="font-mono text-lg">{currentSelectedRun.run_code}</h3>
            </div>
            <button className="px-2 py-1 rounded border border-border text-text-muted hover:text-text-primary" onClick={() => setSelectedRun(null)}>✕</button>
          </div>
          <div className="flex-1 overflow-y-auto p-5">
            <DetailSection title="State">
              <DetailField label="Status"><StatusBadge status={currentSelectedRun.run_status} /></DetailField>
              <DetailField label="Action Requested">
                <span className="font-mono text-text-secondary">{currentSelectedRun.action_requested || '—'}</span>
              </DetailField>
              <DetailField label="Current Step" value={currentSelectedRun.current_step || '—'} />
              <DetailField label="Workflow" value={currentSelectedRun.workflow_name} />
              <DetailField label="Worker" value={currentSelectedRun.worker_id || '—'} />
            </DetailSection>
            <DetailSection title="Timing">
              <DetailField label="Created" value={toLocalTime(currentSelectedRun.created_at)} />
              <DetailField label="Updated" value={toLocalTime(currentSelectedRun.updated_at)} />
            </DetailSection>
          </div>
          <div className="p-4 border-t border-border">
            <ActionDropdown run={currentSelectedRun} onAction={handleAction} />
          </div>
        </div>
      )}

      {/* Confirm dialog */}
      <ConfirmDialog
        open={!!confirm}
        title={`${actionLabels[confirm?.action || ''] || confirm?.action} — ${confirm?.run.run_code || ''}`}
        message={actionMessages[confirm?.action || ''] || `Send ${confirm?.action} to the backend for ${confirm?.run.run_code}?`}
        confirmLabel={actionLabels[confirm?.action || ''] || confirm?.action || 'Confirm'}
        confirmVariant={actionVariant[confirm?.action || ''] || 'primary'}
        cancelLabel="Go Back"
        showFeedback={['APPROVE', 'REJECT', 'RESUME', 'RETRY'].includes(confirm?.action || '')}
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
  const d = new Date(iso.endsWith('Z') || iso.includes('+') ? iso : iso + 'Z');
  return d.toLocaleString();
}
