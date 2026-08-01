import { useState } from 'react';
import { useRepos, useWorkflows, useSubmitRun } from '../api/hooks';
import { ConfirmDialog } from '../components/ConfirmDialog';

export function SubmitPage() {
  const { data: repos } = useRepos();
  const { data: allWorkflows } = useWorkflows();
  const submitMut = useSubmitRun();
  const [repoId, setRepoId] = useState('');
  const [workflow, setWorkflow] = useState('');
  const [startStep, setStartStep] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  const repoList = repos ?? [];
  const selectedRepo = repoList.find(r => r.id === repoId);

  // Filter workflows to repo's assignments, or show all if no repo selected
  const availableWorkflows = selectedRepo
    ? selectedRepo.workflows.map(a => {
        const wf = allWorkflows?.find(w => w.workflow_name === a.workflow_name);
        return { workflow_name: a.workflow_name, display_name: a.display_name, step_count: wf?.step_count ?? 0 };
      })
    : (allWorkflows ?? []).map(w => ({ workflow_name: w.workflow_name, display_name: null, step_count: w.step_count }));

  const doSubmit = () => {
    submitMut.mutate(
      {
        workflow_name: workflow,
        project_root: selectedRepo?.path || undefined,
        worker_id: selectedRepo?.worker_id || undefined,
        start_step: startStep || undefined,
      },
      {
        onSettled: () => {
          setShowConfirm(false);
          setWorkflow('');
          setStartStep('');
        },
      },
    );
  };

  return (
    <>
      <header className="h-14 bg-bg-secondary border-b border-border flex items-center px-6 shrink-0">
        <h2 className="text-lg font-semibold">Submit Job</h2>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-bg-secondary border border-border rounded-xl max-w-xl">
          <div className="px-5 py-3.5 border-b border-border">
            <h3 className="text-sm font-semibold">New Workflow Run</h3>
          </div>
          <div className="p-5">
            <div className="mb-4">
              <label className="block text-sm text-text-secondary mb-1.5 font-medium">Repo</label>
              <select
                className="w-full bg-bg-input border border-border rounded-md px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent"
                value={repoId}
                onChange={e => { setRepoId(e.target.value); setWorkflow(''); }}
              >
                <option value="">Select a repo...</option>
                {repoList.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.hostname || r.worker_id})
                  </option>
                ))}
              </select>
              {selectedRepo && (
                <div className="mt-1.5 text-xs text-text-muted font-mono">
                  {selectedRepo.path} → {selectedRepo.worker_id}
                </div>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm text-text-secondary mb-1.5 font-medium">Workflow</label>
              <select
                className="w-full bg-bg-input border border-border rounded-md px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent"
                value={workflow}
                onChange={e => setWorkflow(e.target.value)}
              >
                <option value="">Select a workflow...</option>
                {availableWorkflows.map(w => (
                  <option key={w.workflow_name} value={w.workflow_name}>
                    {w.display_name || w.workflow_name} ({w.step_count} steps)
                  </option>
                ))}
              </select>
              {selectedRepo && (
                <div className="mt-1 text-xs text-text-muted">
                  {selectedRepo.workflows.length} workflows assigned to this repo
                </div>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm text-text-secondary mb-1.5 font-medium">Start Step (optional)</label>
              <select
                className="w-full bg-bg-input border border-border rounded-md px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent"
                value={startStep}
                onChange={e => setStartStep(e.target.value)}
              >
                <option value="">From beginning</option>
              </select>
            </div>

            <div className="flex gap-2 mt-5">
              <button
                className="px-4 py-2.5 rounded-md text-sm font-medium bg-accent hover:bg-accent-hover text-white disabled:opacity-50"
                disabled={!workflow}
                onClick={() => setShowConfirm(true)}
              >
                Submit Job
              </button>
            </div>

            {submitMut.isSuccess && (
              <div className="mt-4 p-3 rounded-md bg-green-900/30 text-green-400 text-sm">
                Job submitted: {submitMut.data?.run_code}
              </div>
            )}
            {submitMut.isError && (
              <div className="mt-4 p-3 rounded-md bg-red-900/30 text-red-400 text-sm">
                Error: {submitMut.error?.message}
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={showConfirm}
        title="Confirm: Submit"
        message={`Submit job for workflow "${workflow}"?${selectedRepo ? ` Repo: ${selectedRepo.name} (${selectedRepo.path})` : ''}`}
        confirmLabel="Submit"
        confirmVariant="primary"
        onConfirm={doSubmit}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  );
}
