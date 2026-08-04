import { useState, useMemo, useEffect } from 'react';
import { useRepos, useWorkers, useWorkflows, useCreateRepo, useUpdateRepo, useDeleteRepo, useAssignWorkflow, useUnassignWorkflow } from '../api/hooks';
import { ConfirmDialog } from '../components/ConfirmDialog';
import type { RepoResponse } from '../api/types';

const EMPTY_REPOS: RepoResponse[] = [];
const EMPTY_WORKERS: { worker_id: string; hostname: string | null; status: string }[] = [];
const EMPTY_WFS: { workflow_name: string; step_count: number; steps: string[] }[] = [];

type View = { level: 'workers' } | { level: 'repos'; workerId: string } | { level: 'workflows'; workerId: string; repo: RepoResponse };

export function ReposPage() {
  const { data: repos } = useRepos();
  const { data: workers } = useWorkers();
  const { data: allWorkflows } = useWorkflows();
  const createRepoMut = useCreateRepo();
  const updateRepoMut = useUpdateRepo();
  const deleteRepoMut = useDeleteRepo();
  const assignMut = useAssignWorkflow();
  const unassignMut = useUnassignWorkflow();

  const [view, setView] = useState<View>({ level: 'workers' });
  const [showCreate, setShowCreate] = useState(false);
  const [editRepo, setEditRepo] = useState<RepoResponse | null>(null);
  const [editForm, setEditForm] = useState({ name: '', path: '', worker_id: '' });
  const [deleteConfirm, setDeleteConfirm] = useState<RepoResponse | null>(null);
  const [showAssign, setShowAssign] = useState(false);
  const [newRepo, setNewRepo] = useState({ name: '', path: '', worker_id: '' });
  const [newWorkflow, setNewWorkflow] = useState('');

  const workerList = workers ?? EMPTY_WORKERS;
  const wfList = allWorkflows ?? EMPTY_WFS;

  const reposByWorker = useMemo(() => {
    const map = new Map<string, RepoResponse[]>();
    for (const repo of (repos ?? EMPTY_REPOS)) {
      const list = map.get(repo.worker_id) || [];
      list.push(repo);
      map.set(repo.worker_id, list);
    }
    return map;
  }, [repos]);

  const workerIds = useMemo(() => {
    const r = repos ?? EMPTY_REPOS;
    const w = workers ?? EMPTY_WORKERS;
    const fromRepos = new Set(r.map(r => r.worker_id));
    for (const worker of w) fromRepos.add(worker.worker_id);
    return [...fromRepos].sort();
  }, [repos, workers]);

  // Keep view.repo in sync with refreshed data after mutations
  useEffect(() => {
    if (!repos) return;
    setView(prev => {
      if (prev.level !== 'workflows') return prev;
      const fresh = repos.find(r => r.id === prev.repo.id);
      if (!fresh || fresh === prev.repo) return prev;
      return { ...prev, repo: fresh };
    });
  }, [repos]);

  const doCreateRepo = () => {
    createRepoMut.mutate(newRepo, {
      onSuccess: () => {
        setShowCreate(false);
        setNewRepo({ name: '', path: '', worker_id: '' });
      },
    });
  };

  const openEdit = (repo: RepoResponse) => {
    setEditRepo(repo);
    setEditForm({ name: repo.name, path: repo.path, worker_id: repo.worker_id });
  };

  const doUpdateRepo = () => {
    if (!editRepo) return;
    updateRepoMut.mutate(
      { repoId: editRepo.id, data: editForm },
      { onSuccess: () => setEditRepo(null) },
    );
  };

  const doAssign = () => {
    if (view.level !== 'workflows' || !newWorkflow) return;
    assignMut.mutate(
      { repoId: view.repo.id, data: { workflow_name: newWorkflow } },
      { onSuccess: () => setNewWorkflow('') },
    );
  };

  const currentRepo = view.level === 'workflows' ? view.repo : null;
  const currentWorkflows = currentRepo?.workflows ?? [];
  const assignedNames = new Set(currentWorkflows.map(w => w.workflow_name));
  const availableWorkflows = wfList.filter(w => !assignedNames.has(w.workflow_name));

  return (
    <>
      <header className="h-14 bg-bg-secondary border-b border-border flex items-center px-6 justify-between shrink-0">
        <Breadcrumb view={view} onNavigate={setView} />
        {view.level === 'workers' && (
          <button
            className="px-3 py-1.5 rounded-md text-xs bg-accent hover:bg-accent-hover text-white font-medium"
            onClick={() => setShowCreate(true)}
          >
            + Add Repo
          </button>
        )}
        {view.level === 'workflows' && (
          <button
            className="px-3 py-1.5 rounded-md text-xs bg-accent hover:bg-accent-hover text-white font-medium"
            onClick={() => setShowAssign(true)}
          >
            + Assign Workflow
          </button>
        )}
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        {view.level === 'workers' && (
          <WorkerList
            workerIds={workerIds}
            reposByWorker={reposByWorker}
            workerList={workerList}
            onSelect={(workerId) => setView({ level: 'repos', workerId })}
          />
        )}

        {view.level === 'repos' && (
          <RepoList
            workerId={view.workerId}
            repos={reposByWorker.get(view.workerId) ?? []}
            workerList={workerList}
            onSelect={(repo) => setView({ level: 'workflows', workerId: view.workerId, repo })}
            onEdit={(repo) => openEdit(repo)}
            onDelete={(repo) => setDeleteConfirm(repo)}
          />
        )}

        {view.level === 'workflows' && currentRepo && (
          <WorkflowGrid
            repo={currentRepo}
            workflows={currentWorkflows}
            allWorkflows={wfList}
            availableWorkflows={availableWorkflows}
            showAssign={showAssign}
            newWorkflow={newWorkflow}
            onSetNewWorkflow={setNewWorkflow}
            onAssign={doAssign}
            onCloseAssign={() => setShowAssign(false)}
            onOpenAssign={() => setShowAssign(true)}
            onUnassign={(wfName) => unassignMut.mutate({ repoId: currentRepo.id, workflowName: wfName })}
          />
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

      {/* Edit Repo Dialog */}
      <ConfirmDialog
        open={!!editRepo}
        title={`Edit Repo: ${editRepo?.name ?? ''}`}
        message=""
        confirmLabel="Save"
        confirmVariant="primary"
        onConfirm={doUpdateRepo}
        onCancel={() => setEditRepo(null)}
      >
        <div className="flex flex-col gap-3 py-2">
          <div>
            <label className="block text-xs text-text-muted mb-1">Repo Name</label>
            <input
              className="w-full bg-bg-input border border-border rounded-md px-3 py-2 text-sm text-text-primary"
              value={editForm.name}
              onChange={e => setEditForm({ ...editForm, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">Path</label>
            <input
              className="w-full bg-bg-input border border-border rounded-md px-3 py-2 text-sm text-text-primary font-mono"
              value={editForm.path}
              onChange={e => setEditForm({ ...editForm, path: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">Worker</label>
            <select
              className="w-full bg-bg-input border border-border rounded-md px-3 py-2 text-sm text-text-primary"
              value={editForm.worker_id}
              onChange={e => setEditForm({ ...editForm, worker_id: e.target.value })}
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
    </>
  );
}

function Breadcrumb({ view, onNavigate }: { view: View; onNavigate: (v: View) => void }) {
  return (
    <div className="flex items-center gap-1.5 text-sm">
      <button
        className="text-text-muted hover:text-text-primary transition-colors"
        onClick={() => onNavigate({ level: 'workers' })}
      >
        Repos
      </button>
      {view.level !== 'workers' && (
        <>
          <span className="text-text-muted">/</span>
          <button
            className={view.level === 'repos' ? 'text-text-primary font-medium' : 'text-text-muted hover:text-text-primary transition-colors'}
            onClick={() => view.level === 'workflows' && onNavigate({ level: 'repos', workerId: view.workerId })}
          >
            {view.workerId}
          </button>
        </>
      )}
      {view.level === 'workflows' && (
        <>
          <span className="text-text-muted">/</span>
          <span className="text-text-primary font-medium">{view.repo.name}</span>
        </>
      )}
    </div>
  );
}

function WorkerList({
  workerIds, reposByWorker, workerList, onSelect,
}: {
  workerIds: string[];
  reposByWorker: Map<string, RepoResponse[]>;
  workerList: { worker_id: string; hostname: string | null; status: string }[];
  onSelect: (workerId: string) => void;
}) {
  if (workerIds.length === 0) {
    return <div className="text-text-muted text-center py-12">No workers or repos registered.</div>;
  }

  const workerMeta = new Map(workerList.map(w => [w.worker_id, w]));

  return (
    <div className="bg-bg-secondary border border-border rounded-xl">
      <div className="px-5 py-3.5 border-b border-border">
        <h3 className="text-sm font-semibold">Workers</h3>
      </div>
      {workerIds.map(wid => {
        const meta = workerMeta.get(wid);
        const count = reposByWorker.get(wid)?.length ?? 0;
        return (
          <div
            key={wid}
            className="grid grid-cols-[1fr_auto_auto] items-center px-5 py-3 border-b border-bg-primary last:border-0 hover:bg-white/5 cursor-pointer transition-colors"
            onClick={() => onSelect(wid)}
          >
            <div>
              <div className="text-sm font-medium text-text-primary">{wid}</div>
              <div className="text-xs text-text-muted">{meta?.hostname || 'unknown host'}</div>
            </div>
            <span className="text-xs text-text-muted">{count} repo{count !== 1 ? 's' : ''}</span>
            <span className="text-text-muted">→</span>
          </div>
        );
      })}
    </div>
  );
}

function RepoList({
  workerId, repos, workerList, onSelect, onEdit, onDelete,
}: {
  workerId: string;
  repos: RepoResponse[];
  workerList: { worker_id: string; hostname: string | null }[];
  onSelect: (repo: RepoResponse) => void;
  onEdit: (repo: RepoResponse) => void;
  onDelete: (repo: RepoResponse) => void;
}) {
  const worker = workerList.find(w => w.worker_id === workerId);

  return (
    <div>
      <div className="mb-4 px-1">
        <div className="text-xs text-text-muted">
          {worker?.hostname || workerId} · {repos.length} repo{repos.length !== 1 ? 's' : ''}
        </div>
      </div>
      <div className="bg-bg-secondary border border-border rounded-xl">
        <div className="px-5 py-3.5 border-b border-border">
          <h3 className="text-sm font-semibold">Repos</h3>
        </div>
        {repos.length === 0 ? (
          <div className="p-8 text-center text-text-muted">No repos for this worker</div>
        ) : (
          repos.map(repo => (
            <div
              key={repo.id}
              className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center px-5 py-3 border-b border-bg-primary last:border-0 gap-3"
            >
              <div
                className="min-w-0 cursor-pointer hover:text-accent transition-colors"
                onClick={() => onSelect(repo)}
              >
                <div className="text-sm font-medium text-text-primary truncate">{repo.name}</div>
                <div className="text-xs text-text-muted font-mono truncate">{repo.path}</div>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-text-muted uppercase">{repo.os_type || '—'}</span>
              <span className="text-xs text-text-muted">{repo.workflows.length} workflow{repo.workflows.length !== 1 ? 's' : ''}</span>
              <button
                className="px-2 py-1 rounded text-[11px] border border-border text-text-muted hover:text-text-primary hover:border-text-muted"
                onClick={() => onEdit(repo)}
              >
                Edit
              </button>
              <button
                className="px-2 py-1 rounded text-[11px] border border-border text-text-muted hover:text-red-400 hover:border-red-400"
                onClick={() => onDelete(repo)}
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function WorkflowGrid({
  repo, workflows, availableWorkflows,
  showAssign, newWorkflow, onSetNewWorkflow, onAssign, onCloseAssign, onOpenAssign, onUnassign,
}: {
  repo: RepoResponse;
  workflows: RepoResponse['workflows'];
  allWorkflows: { workflow_name: string; step_count: number; steps: string[] }[];
  availableWorkflows: { workflow_name: string; step_count: number; steps: string[] }[];
  showAssign: boolean;
  newWorkflow: string;
  onSetNewWorkflow: (v: string) => void;
  onAssign: () => void;
  onCloseAssign: () => void;
  onOpenAssign: () => void;
  onUnassign: (workflowName: string) => void;
}) {
  return (
    <div>
      <div className="mb-4 px-1">
        <div className="text-xs text-text-muted font-mono">{repo.path}</div>
      </div>
      <div className="bg-bg-secondary border border-border rounded-xl">
        <div className="px-5 py-3.5 border-b border-border flex justify-between items-center">
          <h3 className="text-sm font-semibold">Assigned Workflows ({workflows.length})</h3>
        </div>
        {workflows.length === 0 ? (
          <div className="p-8 text-center text-text-muted">
            No workflows assigned to this repo
            {!showAssign && (
              <button
                className="block mx-auto mt-3 px-3 py-1.5 rounded-md text-xs bg-accent hover:bg-accent-hover text-white font-medium"
                onClick={onOpenAssign}
              >
                + Assign Workflow
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-[1fr_80px_100px_auto] items-center px-5 py-2.5 border-b border-border text-xs text-text-muted uppercase tracking-wider">
            <span>Workflow</span>
            <span>Steps</span>
            <span>Prefix</span>
            <span />
          </div>
        )}
        {workflows.map(wf => (
          <div key={wf.id} className="grid grid-cols-[1fr_80px_100px_auto] items-center px-5 py-3 border-b border-bg-primary last:border-0 gap-3">
            <span className="text-sm text-text-primary">{wf.display_name || wf.workflow_name}</span>
            <span className="text-xs text-text-muted font-mono">{wf.workflow_name}</span>
            <span className="text-xs text-text-muted">—</span>
            <button
              className="px-2 py-1 rounded text-[11px] border border-border text-text-muted hover:text-red-400 hover:border-red-400 justify-self-end"
              onClick={() => onUnassign(wf.workflow_name)}
            >
              Unassign
            </button>
          </div>
        ))}
      </div>

      {/* Assign workflow inline panel */}
      {showAssign && (
        <div className="bg-bg-secondary border border-border rounded-xl mt-4 p-5">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold">Assign Workflow</h4>
            <button className="text-text-muted hover:text-text-primary text-xs" onClick={onCloseAssign}>✕</button>
          </div>
          {availableWorkflows.length === 0 ? (
            <div className="text-xs text-text-muted">All workflows are already assigned to this repo.</div>
          ) : (
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label className="block text-xs text-text-muted mb-1">Workflow</label>
                <select
                  className="w-full bg-bg-input border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
                  value={newWorkflow}
                  onChange={e => onSetNewWorkflow(e.target.value)}
                >
                  <option value="">Select workflow...</option>
                  {availableWorkflows.map(w => (
                    <option key={w.workflow_name} value={w.workflow_name}>
                      {w.workflow_name} ({w.step_count} steps)
                    </option>
                  ))}
                </select>
              </div>
              <button
                className="px-4 py-2 rounded-md text-xs bg-accent hover:bg-accent-hover text-white font-medium disabled:opacity-50"
                disabled={!newWorkflow}
                onClick={onAssign}
              >
                Assign
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
