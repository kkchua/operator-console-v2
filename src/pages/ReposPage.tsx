import { useState } from 'react';
import { useRepos, useWorkers, useWorkflows, useCreateRepo, useDeleteRepo, useAssignWorkflow, useUnassignWorkflow } from '../api/hooks';
import { ConfirmDialog } from '../components/ConfirmDialog';
import type { RepoResponse } from '../api/types';

export function ReposPage() {
  const { data: repos } = useRepos();
  const { data: workers } = useWorkers();
  const { data: allWorkflows } = useWorkflows();
  const createRepoMut = useCreateRepo();
  const deleteRepoMut = useDeleteRepo();
  const assignMut = useAssignWorkflow();
  const unassignMut = useUnassignWorkflow();

  const [showCreate, setShowCreate] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<RepoResponse | null>(null);
  const [assignRepo, setAssignRepo] = useState<RepoResponse | null>(null);
  const [newRepo, setNewRepo] = useState({ name: '', path: '', worker_id: '' });
  const [newWorkflow, setNewWorkflow] = useState('');

  const repoList = repos ?? [];
  const workerList = workers ?? [];
  const wfList = allWorkflows ?? [];

  // Group repos by hostname
  const byHost = new Map<string, RepoResponse[]>();
  for (const repo of repoList) {
    const key = repo.hostname || repo.worker_id;
    const list = byHost.get(key) || [];
    list.push(repo);
    byHost.set(key, list);
  }

  const doCreateRepo = () => {
    createRepoMut.mutate(newRepo, {
      onSuccess: () => {
        setShowCreate(false);
        setNewRepo({ name: '', path: '', worker_id: '' });
      },
    });
  };

  const doAssign = () => {
    if (!assignRepo || !newWorkflow) return;
    assignMut.mutate(
      { repoId: assignRepo.id, data: { workflow_name: newWorkflow } },
      {
        onSuccess: () => {
          setAssignRepo(null);
          setNewWorkflow('');
        },
      },
    );
  };

  return (
    <>
      <header className="h-14 bg-bg-secondary border-b border-border flex items-center px-6 justify-between shrink-0">
        <h2 className="text-lg font-semibold">Repos</h2>
        <button
          className="px-3 py-1.5 rounded-md text-xs bg-accent hover:bg-accent-hover text-white font-medium"
          onClick={() => setShowCreate(true)}
        >
          + Add Repo
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        {repoList.length === 0 ? (
          <div className="text-text-muted text-center py-12">No repos registered. Click "Add Repo" to start.</div>
        ) : (
          Array.from(byHost.entries()).map(([hostName, hostRepos]) => (
            <div key={hostName} className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-bold text-text-primary">{hostName}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-text-muted uppercase">
                  {hostRepos[0]?.os_type || 'unknown'}
                </span>
                <span className="text-xs text-text-muted">{hostRepos.length} repos</span>
              </div>

              <div className="grid gap-3">
                {hostRepos.map(repo => (
                  <div key={repo.id} className="bg-bg-secondary border border-border rounded-xl p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="text-sm font-semibold text-text-primary">{repo.name}</h4>
                        <div className="text-xs text-text-muted mt-0.5 font-mono">{repo.path}</div>
                        <div className="text-xs text-text-muted mt-0.5">
                          Worker: <span className="text-text-secondary">{repo.worker_id}</span>
                        </div>
                      </div>
                      <button
                        className="px-2 py-1 rounded text-xs border border-border text-text-muted hover:text-red-400 hover:border-red-400"
                        onClick={() => setDeleteConfirm(repo)}
                      >
                        Delete
                      </button>
                    </div>

                    {/* Workflow assignments */}
                    <div className="border-t border-border pt-2 mt-2">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-text-muted uppercase tracking-wider">Workflows ({repo.workflows.length})</span>
                        <button
                          className="px-2 py-0.5 rounded text-[11px] text-accent hover:bg-accent/10"
                          onClick={() => setAssignRepo(repo)}
                        >
                          + Assign
                        </button>
                      </div>
                      {repo.workflows.length === 0 ? (
                        <div className="text-xs text-text-muted py-1">No workflows assigned</div>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {repo.workflows.map(wf => (
                            <span
                              key={wf.id}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] bg-white/5 text-text-secondary border border-border"
                            >
                              {wf.display_name || wf.workflow_name}
                              <button
                                className="text-text-muted hover:text-red-400 ml-0.5"
                                onClick={() => unassignMut.mutate({ repoId: repo.id, workflowName: wf.workflow_name })}
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Repo Dialog */}
      <ConfirmDialog
        open={showCreate}
        title="Add Repo"
        message=""
        confirmLabel="Create"
        confirmVariant="primary"
        onConfirm={doCreateRepo}
        onCancel={() => setShowCreate(false)}
      >
        <div className="flex flex-col gap-3 py-2">
          <div>
            <label className="block text-xs text-text-muted mb-1">Repo Name</label>
            <input
              className="w-full bg-bg-input border border-border rounded-md px-3 py-2 text-sm text-text-primary"
              placeholder="e.g. agent-runner-v2"
              value={newRepo.name}
              onChange={e => setNewRepo({ ...newRepo, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">Path</label>
            <input
              className="w-full bg-bg-input border border-border rounded-md px-3 py-2 text-sm text-text-primary font-mono"
              placeholder="e.g. D:/Projects/my-repo"
              value={newRepo.path}
              onChange={e => setNewRepo({ ...newRepo, path: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">Worker</label>
            <select
              className="w-full bg-bg-input border border-border rounded-md px-3 py-2 text-sm text-text-primary"
              value={newRepo.worker_id}
              onChange={e => setNewRepo({ ...newRepo, worker_id: e.target.value })}
            >
              <option value="">Select worker...</option>
              {workerList.map(w => (
                <option key={w.worker_id} value={w.worker_id}>
                  {w.worker_id} ({w.hostname || 'unknown host'})
                </option>
              ))}
            </select>
          </div>
        </div>
      </ConfirmDialog>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteConfirm}
        title="Delete Repo"
        message={`Delete repo "${deleteConfirm?.name}"? This also removes all workflow assignments.`}
        confirmLabel="Delete"
        confirmVariant="danger"
        onConfirm={() => {
          if (deleteConfirm) deleteRepoMut.mutate(deleteConfirm.id);
          setDeleteConfirm(null);
        }}
        onCancel={() => setDeleteConfirm(null)}
      />

      {/* Assign Workflow Dialog */}
      <ConfirmDialog
        open={!!assignRepo}
        title={`Assign Workflow to ${assignRepo?.name}`}
        message=""
        confirmLabel="Assign"
        confirmVariant="primary"
        onConfirm={doAssign}
        onCancel={() => { setAssignRepo(null); setNewWorkflow(''); }}
      >
        <div className="py-2">
          <label className="block text-xs text-text-muted mb-1">Workflow</label>
          <select
            className="w-full bg-bg-input border border-border rounded-md px-3 py-2 text-sm text-text-primary"
            value={newWorkflow}
            onChange={e => setNewWorkflow(e.target.value)}
          >
            <option value="">Select workflow...</option>
            {wfList.map(w => (
              <option key={w.workflow_name} value={w.workflow_name}>
                {w.workflow_name} ({w.step_count} steps)
              </option>
            ))}
          </select>
        </div>
      </ConfirmDialog>
    </>
  );
}
