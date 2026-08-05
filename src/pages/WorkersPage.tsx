import { useState } from 'react';
import { useWorkers, useHosts, useStopWorker, useRegisterWorker, useUpdateWorker, useDeleteWorker } from '../api/hooks';
import { StatusBadge } from '../components/StatusBadge';
import { ConfirmDialog } from '../components/ConfirmDialog';
import type { WorkerResponse } from '../api/types';

export function WorkersPage() {
  const { data: workers, isLoading } = useWorkers();
  const { data: hosts } = useHosts();
  const stopMut = useStopWorker();
  const registerMut = useRegisterWorker();
  const updateMut = useUpdateWorker();
  const deleteMut = useDeleteWorker();

  const [showAdd, setShowAdd] = useState(false);
  const [confirmStop, setConfirmStop] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [editWorker, setEditWorker] = useState<WorkerResponse | null>(null);
  const [editForm, setEditForm] = useState({ worker_label: '', status: '', host_id: '', is_enabled: true, max_parallel: 1 });
  const [addForm, setAddForm] = useState({ worker_id: '', worker_label: 'live', host_id: '' });

  const list = workers ?? [];
  const hostList = hosts ?? [];

  const openEdit = (w: WorkerResponse) => {
    setEditWorker(w);
    setEditForm({ worker_label: w.worker_label, status: w.status, host_id: w.host_id ?? '', is_enabled: w.is_enabled, max_parallel: (w.capabilities?.max_parallel as number) ?? 1 });
  };

  const doAdd = () => {
    if (!addForm.worker_id) return;
    registerMut.mutate(addForm, {
      onSuccess: () => {
        setShowAdd(false);
        setAddForm({ worker_id: '', worker_label: 'live', host_id: '' });
      },
    });
  };

  const doUpdate = () => {
    if (!editWorker) return;
    updateMut.mutate(
      {
        workerId: editWorker.worker_id,
        data: {
          worker_label: editForm.worker_label,
          status: editForm.status,
          is_enabled: editForm.is_enabled,
          capabilities: { max_parallel: editForm.max_parallel },
          ...(editForm.host_id ? { host_id: editForm.host_id } : {}),
        },
      },
      { onSuccess: () => setEditWorker(null) },
    );
  };

  return (
    <>
      <header className="h-14 bg-bg-secondary border-b border-border flex items-center px-6 justify-between shrink-0">
        <h2 className="text-lg font-semibold">Workers</h2>
        <button
          className="px-3 py-1.5 rounded-md text-xs bg-accent hover:bg-accent-hover text-white font-medium"
          onClick={() => setShowAdd(true)}
        >
          + Add Worker
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="text-text-muted">Loading...</div>
        ) : list.length === 0 ? (
          <div className="text-text-muted text-center py-12">No workers registered</div>
        ) : (
          <div className="bg-bg-secondary border border-border rounded-xl">
            {/* Desktop header */}
            <div className="hidden md:grid grid-cols-[1.2fr_0.8fr_0.6fr_0.7fr_0.5fr_0.8fr_1fr_140px] gap-3 px-5 py-2.5 border-b border-border text-xs text-text-muted uppercase tracking-wider">
              <span>Worker ID</span>
              <span>Host</span>
              <span>Label</span>
              <span>Status</span>
              <span>Enabled</span>
              <span>Current Run</span>
              <span>Last Heartbeat</span>
              <span />
            </div>

            {/* Mobile card layout */}
            <div className="md:hidden divide-y divide-bg-primary">
              {list.map(w => (
                <div key={w.worker_id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-text-primary">{w.worker_id}</span>
                    <StatusBadge status={w.status.toUpperCase()} />
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                    <span className="text-text-muted">{w.hostname || '—'}</span>
                    <span className="text-text-secondary">{w.worker_label}</span>
                    <span className={w.is_enabled ? 'text-emerald-400 font-medium' : 'text-red-400 font-medium'}>{w.is_enabled ? 'Enabled' : 'Disabled'}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                    <span className="text-text-muted font-mono truncate">Run: {w.current_run_id || '—'}</span>
                    <span className="text-text-muted">Heartbeat: {w.last_heartbeat ? timeAgo(w.last_heartbeat) : '—'}</span>
                  </div>
                  <div className="flex gap-1.5 pt-1">
                    <button
                      className="px-2 py-1 rounded text-[11px] border border-border text-text-muted hover:text-text-primary hover:border-text-muted"
                      onClick={() => openEdit(w)}
                    >
                      Edit
                    </button>
                    <button
                      className="px-2 py-1 rounded text-[11px] border border-border text-text-muted hover:text-amber-400 hover:border-amber-400"
                      onClick={() => setConfirmStop(w.worker_id)}
                    >
                      Stop
                    </button>
                    <button
                      className="px-2 py-1 rounded text-[11px] border border-border text-text-muted hover:text-red-400 hover:border-red-400"
                      onClick={() => setConfirmDelete(w.worker_id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop grid rows */}
            <div className="hidden md:block">
              {list.map(w => (
                <div
                  key={w.worker_id}
                  className="grid grid-cols-[1.2fr_0.8fr_0.6fr_0.7fr_0.5fr_0.8fr_1fr_140px] gap-3 items-center px-5 py-3 border-b border-bg-primary last:border-0"
                >
                  <span className="text-sm font-medium text-text-primary truncate">{w.worker_id}</span>
                  <span className="text-xs text-text-muted truncate">{w.hostname || '—'}</span>
                  <span className="text-xs text-text-secondary">{w.worker_label}</span>
                  <StatusBadge status={w.status.toUpperCase()} />
                  <span className={`text-xs font-medium ${w.is_enabled ? 'text-emerald-400' : 'text-red-400'}`}>{w.is_enabled ? 'Yes' : 'No'}</span>
                  <span className="text-xs text-text-muted font-mono truncate">{w.current_run_id || '—'}</span>
                  <span className="text-xs text-text-muted">{w.last_heartbeat ? timeAgo(w.last_heartbeat) : '—'}</span>
                  <div className="flex gap-1.5">
                    <button
                      className="px-2 py-1 rounded text-[11px] border border-border text-text-muted hover:text-text-primary hover:border-text-muted"
                      onClick={() => openEdit(w)}
                    >
                      Edit
                    </button>
                    <button
                      className="px-2 py-1 rounded text-[11px] border border-border text-text-muted hover:text-amber-400 hover:border-amber-400"
                      onClick={() => setConfirmStop(w.worker_id)}
                    >
                      Stop
                    </button>
                    <button
                      className="px-2 py-1 rounded text-[11px] border border-border text-text-muted hover:text-red-400 hover:border-red-400"
                      onClick={() => setConfirmDelete(w.worker_id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add Worker Dialog */}
      <ConfirmDialog
        open={showAdd}
        title="Add Worker"
        message=""
        confirmLabel="Register"
        confirmVariant="primary"
        onConfirm={doAdd}
        onCancel={() => setShowAdd(false)}
      >
        <div className="flex flex-col gap-3 py-2">
          <div>
            <label className="block text-xs text-text-muted mb-1">Worker ID</label>
            <input
              className="w-full bg-bg-input border border-border rounded-md px-3 py-2 text-sm text-text-primary"
              placeholder="e.g. worker-01"
              value={addForm.worker_id}
              onChange={e => setAddForm({ ...addForm, worker_id: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">Label</label>
            <input
              className="w-full bg-bg-input border border-border rounded-md px-3 py-2 text-sm text-text-primary"
              placeholder="e.g. live"
              value={addForm.worker_label}
              onChange={e => setAddForm({ ...addForm, worker_label: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">Host</label>
            <select
              className="w-full bg-bg-input border border-border rounded-md px-3 py-2 text-sm text-text-primary"
              value={addForm.host_id}
              onChange={e => setAddForm({ ...addForm, host_id: e.target.value })}
            >
              <option value="">None</option>
              {hostList.map(h => (
                <option key={h.id} value={h.id}>{h.hostname} ({h.ip_address || 'no IP'})</option>
              ))}
            </select>
          </div>
        </div>
      </ConfirmDialog>

      {/* Edit Worker Dialog */}
      <ConfirmDialog
        open={!!editWorker}
        title={`Edit Worker: ${editWorker?.worker_id ?? ''}`}
        message=""
        confirmLabel="Save"
        confirmVariant="primary"
        onConfirm={doUpdate}
        onCancel={() => setEditWorker(null)}
      >
        <div className="flex flex-col gap-3 py-2">
          <div>
            <label className="block text-xs text-text-muted mb-1">Label</label>
            <input
              className="w-full bg-bg-input border border-border rounded-md px-3 py-2 text-sm text-text-primary"
              value={editForm.worker_label}
              onChange={e => setEditForm({ ...editForm, worker_label: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">Status</label>
            <select
              className="w-full bg-bg-input border border-border rounded-md px-3 py-2 text-sm text-text-primary"
              value={editForm.status}
              onChange={e => setEditForm({ ...editForm, status: e.target.value })}
            >
              <option value="active">active</option>
              <option value="idle">idle</option>
              <option value="busy">busy</option>
              <option value="stopped">stopped</option>
            </select>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-border bg-bg-input text-accent focus:ring-accent"
                checked={editForm.is_enabled}
                onChange={e => setEditForm({ ...editForm, is_enabled: e.target.checked })}
              />
              <span className="text-sm text-text-primary">Enabled</span>
            </label>
            <span className="text-xs text-text-muted">Disabled workers cannot claim work or heartbeat</span>
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">Max Parallel</label>
            <input
              type="number"
              min={1}
              className="w-full bg-bg-input border border-border rounded-md px-3 py-2 text-sm text-text-primary"
              value={editForm.max_parallel}
              onChange={e => setEditForm({ ...editForm, max_parallel: parseInt(e.target.value) || 1 })}
            />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">Host</label>
            <select
              className="w-full bg-bg-input border border-border rounded-md px-3 py-2 text-sm text-text-primary"
              value={editForm.host_id}
              onChange={e => setEditForm({ ...editForm, host_id: e.target.value })}
            >
              <option value="">None</option>
              {hostList.map(h => (
                <option key={h.id} value={h.id}>{h.hostname} ({h.ip_address || 'no IP'})</option>
              ))}
            </select>
          </div>
        </div>
      </ConfirmDialog>

      {/* Stop Confirm */}
      <ConfirmDialog
        open={!!confirmStop}
        title="Confirm: Stop Worker"
        message={`Stop worker "${confirmStop}"? The daemon will shut down gracefully.`}
        confirmLabel="Stop"
        confirmVariant="warning"
        onConfirm={() => {
          if (confirmStop) stopMut.mutate(confirmStop);
          setConfirmStop(null);
        }}
        onCancel={() => setConfirmStop(null)}
      />

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete Worker"
        message={`Delete worker "${confirmDelete}"? This removes it from the registry.`}
        confirmLabel="Delete"
        confirmVariant="danger"
        onConfirm={() => {
          if (confirmDelete) deleteMut.mutate(confirmDelete);
          setConfirmDelete(null);
        }}
        onCancel={() => setConfirmDelete(null)}
      />
    </>
  );
}

function timeAgo(iso: string): string {
  const d = new Date(iso.endsWith('Z') || iso.includes('+') ? iso : iso + 'Z');
  const diff = Date.now() - d.getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  return `${Math.floor(min / 60)}h ago`;
}
