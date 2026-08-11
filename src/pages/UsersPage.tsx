import { useState } from 'react';
import { useUsers, useUpdateUserRole, useRemoveUser, useWorkers, useUserWorkers, useSetUserWorkers } from '../api/hooks';
import { useAuth } from '../hooks/useAuth';
import { ConfirmDialog } from '../components/ConfirmDialog';
import type { UserRoleResponse } from '../api/types';

const ROLES = ['admin', 'operator', 'viewer'] as const;

const roleBadge: Record<string, string> = {
  admin: 'bg-purple-900/50 text-purple-400',
  operator: 'bg-blue-900/50 text-blue-400',
  viewer: 'bg-gray-700/50 text-gray-400',
};

function WorkerAssignment({ userId }: { userId: string }) {
  const { data: workers } = useWorkers();
  const { data: assignedIds } = useUserWorkers(userId);
  const setMut = useSetUserWorkers();

  const allWorkers = workers ?? [];
  const assigned = new Set(assignedIds ?? []);

  const toggle = (workerId: string) => {
    const next = new Set(assigned);
    if (next.has(workerId)) next.delete(workerId);
    else next.add(workerId);
    setMut.mutate({ userId, workerIds: [...next] });
  };

  if (allWorkers.length === 0) {
    return <span className="text-[11px] text-text-muted">No workers available</span>;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {allWorkers.map(w => (
        <button
          key={w.worker_id}
          onClick={() => toggle(w.worker_id)}
          className={`px-2 py-0.5 rounded text-[10px] border transition-colors ${
            assigned.has(w.worker_id)
              ? 'bg-accent/20 border-accent text-accent'
              : 'bg-bg-input border-border text-text-muted hover:border-accent'
          }`}
        >
          {w.worker_label}
        </button>
      ))}
    </div>
  );
}

export function UsersPage() {
  const { data: users, isLoading } = useUsers();
  const updateMut = useUpdateUserRole();
  const removeMut = useRemoveUser();
  const { user: currentUser } = useAuth();

  const [pendingRole, setPendingRole] = useState<{ user: UserRoleResponse; role: string } | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<UserRoleResponse | null>(null);

  const list = users ?? [];

  const handleRoleChange = (u: UserRoleResponse, newRole: string) => {
    if (newRole === u.role) return;
    setPendingRole({ user: u, role: newRole });
  };

  const doRoleChange = () => {
    if (!pendingRole) return;
    updateMut.mutate(
      { userId: pendingRole.user.user_id, data: { role: pendingRole.role } },
      { onSuccess: () => setPendingRole(null) },
    );
  };

  const doRemove = () => {
    if (!confirmRemove) return;
    removeMut.mutate(confirmRemove.user_id, { onSuccess: () => setConfirmRemove(null) });
  };

  return (
    <>
      <header className="h-14 bg-bg-secondary border-b border-border flex items-center px-6 shrink-0">
        <h2 className="text-lg font-semibold">Users & Roles</h2>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="text-text-muted">Loading...</div>
        ) : list.length === 0 ? (
          <div className="text-text-muted text-center py-12">No users found. Users appear here after their first login.</div>
        ) : (
          <div>
            {/* Desktop header */}
            <div className="hidden md:grid grid-cols-[1.5fr_0.8fr_1.2fr_1fr_0.8fr_100px] gap-3 px-5 py-2.5 border-b border-border text-xs text-text-muted uppercase tracking-wider">
              <span>Email</span>
              <span>Role</span>
              <span>Assigned Workers</span>
              <span>Change Role</span>
              <span>Last Updated</span>
              <span />
            </div>

            {/* Mobile card layout */}
            <div className="md:hidden space-y-2">
              {list.map(u => {
                const isSelf = u.user_id === currentUser?.id;
                return (
                <div key={u.user_id} className="p-4 space-y-3 bg-bg-secondary border border-border rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-text-primary truncate">
                      {u.email}
                      {isSelf && <span className="ml-1.5 text-[10px] text-text-muted">(you)</span>}
                      {u.is_system && <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded bg-amber-900/50 text-amber-400">system</span>}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleBadge[u.role] ?? roleBadge.viewer}`}>
                      {u.role}
                    </span>
                  </div>
                  <div>
                    <div className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Workers</div>
                    <WorkerAssignment userId={u.user_id} />
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      className="flex-1 bg-bg-input border border-border rounded-md px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent"
                      value={u.role}
                      onChange={e => handleRoleChange(u, e.target.value)}
                    >
                      {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                    {!u.is_system && (
                      <button
                        className="px-2 py-1.5 rounded text-[11px] border border-border text-text-muted hover:text-red-400 hover:border-red-400"
                        onClick={() => setConfirmRemove(u)}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="text-[11px] text-text-muted">
                    Updated: {new Date(u.updated_at.endsWith('Z') || u.updated_at.includes('+') ? u.updated_at : u.updated_at + 'Z').toLocaleString()}
                  </div>
                </div>
                );
              })}
            </div>

            {/* Desktop grid rows */}
            <div className="hidden md:block space-y-1.5">
              {list.map(u => {
                const isSelf = u.user_id === currentUser?.id;
                return (
                <div
                  key={u.user_id}
                  className="grid grid-cols-[1.5fr_0.8fr_1.2fr_1fr_0.8fr_100px] gap-3 items-center px-5 py-3 bg-bg-secondary border border-border rounded-lg"
                >
                  <span className="text-sm font-medium text-text-primary truncate">
                    {u.email}
                    {isSelf && <span className="ml-1.5 text-[10px] text-text-muted">(you)</span>}
                    {u.is_system && <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded bg-amber-900/50 text-amber-400">system</span>}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium w-fit ${roleBadge[u.role] ?? roleBadge.viewer}`}>
                    {u.role}
                  </span>
                  <WorkerAssignment userId={u.user_id} />
                  <select
                    className="bg-bg-input border border-border rounded-md px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent"
                    value={u.role}
                    onChange={e => handleRoleChange(u, e.target.value)}
                  >
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <span className="text-xs text-text-muted">
                    {new Date(u.updated_at.endsWith('Z') || u.updated_at.includes('+') ? u.updated_at : u.updated_at + 'Z').toLocaleString()}
                  </span>
                  {u.is_system ? (
                    <span />
                  ) : (
                    <button
                      className="px-2 py-1 rounded text-[11px] border border-border text-text-muted hover:text-red-400 hover:border-red-400 justify-self-end"
                      onClick={() => setConfirmRemove(u)}
                    >
                      Remove
                    </button>
                  )}
                </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Role Change Confirm */}
      <ConfirmDialog
        open={!!pendingRole}
        title="Change User Role"
        message={pendingRole ? `Change "${pendingRole.user.email}" from ${pendingRole.user.role} to ${pendingRole.role}?` : ''}
        confirmLabel="Change Role"
        confirmVariant="primary"
        onConfirm={doRoleChange}
        onCancel={() => setPendingRole(null)}
      />

      {/* Remove Confirm */}
      <ConfirmDialog
        open={!!confirmRemove}
        title="Remove User"
        message={confirmRemove ? `Remove "${confirmRemove.email}" from the user roles table? They will be re-added as "viewer" on next login. The Supabase auth account is not deleted.` : ''}
        confirmLabel="Remove"
        confirmVariant="danger"
        onConfirm={doRemove}
        onCancel={() => setConfirmRemove(null)}
      />
    </>
  );
}
