import { useState } from 'react';
import { useHosts, useCreateHost, useUpdateHost, useDeleteHost } from '../api/hooks';
import { ConfirmDialog } from '../components/ConfirmDialog';
import type { HostResponse } from '../api/types';

export function HostsPage() {
  const { data: hosts, isLoading } = useHosts();
  const createMut = useCreateHost();
  const updateMut = useUpdateHost();
  const deleteMut = useDeleteHost();

  const [showAdd, setShowAdd] = useState(false);
  const [editHost, setEditHost] = useState<HostResponse | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [addForm, setAddForm] = useState({ hostname: '', ip_address: '', os_type: 'linux' });
  const [editForm, setEditForm] = useState({ hostname: '', ip_address: '', os_type: 'linux' });

  const list = hosts ?? [];

  const openEdit = (h: HostResponse) => {
    setEditHost(h);
    setEditForm({ hostname: h.hostname, ip_address: h.ip_address ?? '', os_type: h.os_type });
  };

  const doAdd = () => {
    if (!addForm.hostname) return;
    createMut.mutate(addForm, {
      onSuccess: () => {
        setShowAdd(false);
        setAddForm({ hostname: '', ip_address: '', os_type: 'linux' });
      },
    });
  };

  const doUpdate = () => {
    if (!editHost) return;
    updateMut.mutate(
      { hostId: editHost.id, data: editForm },
      { onSuccess: () => setEditHost(null) },
    );
  };

  return (
    <>
      <header className="h-14 bg-bg-secondary border-b border-border flex items-center px-6 justify-between shrink-0">
        <h2 className="text-lg font-semibold">Hosts</h2>
        <button
          className="px-3 py-1.5 rounded-md text-xs bg-accent hover:bg-accent-hover text-white font-medium"
          onClick={() => setShowAdd(true)}
        >
          + Add Host
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="text-text-muted">Loading...</div>
        ) : list.length === 0 ? (
          <div className="text-text-muted text-center py-12">No hosts registered</div>
        ) : (
          <div className="bg-bg-secondary border border-border rounded-xl">
            {/* Desktop header */}
            <div className="hidden md:grid grid-cols-[1.5fr_1fr_0.8fr_1.2fr_1.2fr_120px] gap-3 px-5 py-2.5 border-b border-border text-xs text-text-muted uppercase tracking-wider">
              <span>Hostname</span>
              <span>IP Address</span>
              <span>OS</span>
              <span>Created</span>
              <span>Updated</span>
              <span />
            </div>

            {/* Mobile card layout */}
            <div className="md:hidden divide-y divide-bg-primary">
              {list.map(h => (
                <div key={h.id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-text-primary">{h.hostname}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-text-muted uppercase">{h.os_type}</span>
                  </div>
                  <div className="text-xs text-text-muted font-mono">{h.ip_address || '—'}</div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-text-muted">
                    <span>Created: {formatDate(h.created_at)}</span>
                    <span>Updated: {formatDate(h.updated_at)}</span>
                  </div>
                  <div className="flex gap-1.5 pt-1">
                    <button
                      className="px-2 py-1 rounded text-[11px] border border-border text-text-muted hover:text-text-primary hover:border-text-muted"
                      onClick={() => openEdit(h)}
                    >
                      Edit
                    </button>
                    <button
                      className="px-2 py-1 rounded text-[11px] border border-border text-text-muted hover:text-red-400 hover:border-red-400"
                      onClick={() => setDeleteId(h.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop grid rows */}
            <div className="hidden md:block">
              {list.map(h => (
                <div
                  key={h.id}
                  className="grid grid-cols-[1.5fr_1fr_0.8fr_1.2fr_1.2fr_120px] gap-3 items-center px-5 py-3 border-b border-bg-primary last:border-0"
                >
                  <span className="text-sm font-medium text-text-primary truncate">{h.hostname}</span>
                  <span className="text-xs text-text-muted font-mono">{h.ip_address || '—'}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-text-muted uppercase">{h.os_type}</span>
                  <span className="text-xs text-text-muted">{formatDate(h.created_at)}</span>
                  <span className="text-xs text-text-muted">{formatDate(h.updated_at)}</span>
                  <div className="flex gap-1.5">
                    <button
                      className="px-2 py-1 rounded text-[11px] border border-border text-text-muted hover:text-text-primary hover:border-text-muted"
                      onClick={() => openEdit(h)}
                    >
                      Edit
                    </button>
                    <button
                      className="px-2 py-1 rounded text-[11px] border border-border text-text-muted hover:text-red-400 hover:border-red-400"
                      onClick={() => setDeleteId(h.id)}
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

      {/* Add Host Dialog */}
      <ConfirmDialog
        open={showAdd}
        title="Add Host"
        message=""
        confirmLabel="Create"
        confirmVariant="primary"
        onConfirm={doAdd}
        onCancel={() => setShowAdd(false)}
      >
        <div className="flex flex-col gap-3 py-2">
          <div>
            <label className="block text-xs text-text-muted mb-1">Hostname</label>
            <input
              className="w-full bg-bg-input border border-border rounded-md px-3 py-2 text-sm text-text-primary"
              placeholder="e.g. server-01"
              value={addForm.hostname}
              onChange={e => setAddForm({ ...addForm, hostname: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">IP Address</label>
            <input
              className="w-full bg-bg-input border border-border rounded-md px-3 py-2 text-sm text-text-primary font-mono"
              placeholder="e.g. 192.168.1.100"
              value={addForm.ip_address}
              onChange={e => setAddForm({ ...addForm, ip_address: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">OS Type</label>
            <select
              className="w-full bg-bg-input border border-border rounded-md px-3 py-2 text-sm text-text-primary"
              value={addForm.os_type}
              onChange={e => setAddForm({ ...addForm, os_type: e.target.value })}
            >
              <option value="linux">linux</option>
              <option value="windows">windows</option>
              <option value="macos">macos</option>
            </select>
          </div>
        </div>
      </ConfirmDialog>

      {/* Edit Host Dialog */}
      <ConfirmDialog
        open={!!editHost}
        title={`Edit Host: ${editHost?.hostname ?? ''}`}
        message=""
        confirmLabel="Save"
        confirmVariant="primary"
        onConfirm={doUpdate}
        onCancel={() => setEditHost(null)}
      >
        <div className="flex flex-col gap-3 py-2">
          <div>
            <label className="block text-xs text-text-muted mb-1">Hostname</label>
            <input
              className="w-full bg-bg-input border border-border rounded-md px-3 py-2 text-sm text-text-primary"
              value={editForm.hostname}
              onChange={e => setEditForm({ ...editForm, hostname: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">IP Address</label>
            <input
              className="w-full bg-bg-input border border-border rounded-md px-3 py-2 text-sm text-text-primary font-mono"
              value={editForm.ip_address}
              onChange={e => setEditForm({ ...editForm, ip_address: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">OS Type</label>
            <select
              className="w-full bg-bg-input border border-border rounded-md px-3 py-2 text-sm text-text-primary"
              value={editForm.os_type}
              onChange={e => setEditForm({ ...editForm, os_type: e.target.value })}
            >
              <option value="linux">linux</option>
              <option value="windows">windows</option>
              <option value="macos">macos</option>
            </select>
          </div>
        </div>
      </ConfirmDialog>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteId}
        title="Delete Host"
        message={`Delete this host? Workers assigned to it will become unassigned.`}
        confirmLabel="Delete"
        confirmVariant="danger"
        onConfirm={() => {
          if (deleteId) deleteMut.mutate(deleteId);
          setDeleteId(null);
        }}
        onCancel={() => setDeleteId(null)}
      />
    </>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso.endsWith('Z') || iso.includes('+') ? iso : iso + 'Z');
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}
