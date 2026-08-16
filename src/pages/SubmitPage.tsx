import { useState, useEffect, useRef } from 'react';
import { useRepos, useWorkflows, useWorkers, useSubmitRun } from '../api/hooks';
import { useSelectedWorker } from '../components/WorkerContext';
import { ConfirmDialog } from '../components/ConfirmDialog';

function isFileInput(key: string): boolean {
  return key.endsWith('_FILE') || key.endsWith('_DOC');
}

export function SubmitPage() {
  const { selectedWorkerId: globalWorkerId } = useSelectedWorker();
  const { data: repos } = useRepos();
  const { data: allWorkflows } = useWorkflows();
  const { data: workers } = useWorkers();
  const submitMut = useSubmitRun();
  const [workerId, setWorkerId] = useState('');
  const [repoId, setRepoId] = useState('');
  const [workflow, setWorkflow] = useState('');
  const [startStep, setStartStep] = useState('');
  const [selectedImpl, setSelectedImpl] = useState('');
  const [promptSelections, setPromptSelections] = useState<Record<string, string>>({});
  const [showConfirm, setShowConfirm] = useState(false);
  const [fileInputs, setFileInputs] = useState<Record<string, File>>({});
  const [textInputs, setTextInputs] = useState<Record<string, string>>({});
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Sync with sidebar worker selection
  useEffect(() => {
    setWorkerId(globalWorkerId ?? '');
    setRepoId('');
    setWorkflow('');
    setFileInputs({});
    setTextInputs({});
  }, [globalWorkerId]);

  // Clear inputs when workflow changes
  useEffect(() => {
    setFileInputs({});
    setTextInputs({});
    setSelectedImpl('');
    setPromptSelections({});
  }, [workflow]);

  // Reset prompt selections when implementation changes
  useEffect(() => {
    setPromptSelections({});
  }, [selectedImpl]);

  const workerList = workers ?? [];
  const repoList = (repos ?? []).filter(r => !workerId || r.worker_id === workerId);
  const selectedRepo = repoList.find(r => r.id === repoId);

  // Filter workflows to repo's assignments, or show all if no repo selected
  const availableWorkflows = selectedRepo
    ? selectedRepo.workflows.map(a => {
        const wf = allWorkflows?.find(w => w.workflow_name === a.workflow_name);
        return { workflow_name: a.workflow_name, display_name: a.display_name, step_count: wf?.step_count ?? 0, steps: wf?.steps ?? [], init_input_keys: wf?.init_input_keys ?? [], implementations: wf?.implementations ?? [] };
      })
    : (allWorkflows ?? []).map(w => ({ workflow_name: w.workflow_name, display_name: null as string | null, step_count: w.step_count, steps: w.steps, init_input_keys: w.init_input_keys ?? [], implementations: w.implementations ?? [] }));

  // Get steps and init_input_keys for the selected workflow
  const selectedWorkflowData = availableWorkflows.find(w => w.workflow_name === workflow);
  const selectedWorkflowSteps = selectedWorkflowData?.steps ?? [];
  const selectedWorkflowInitInputKeys = selectedWorkflowData?.init_input_keys ?? [];
  
  // Extract available implementations from workflow API response
  // BCS: If named implementations exist, hide "Default" to avoid confusion.
  // If no implementations exist, show "Base (workflow.toml)".
  const availableImpls = selectedWorkflowData?.implementations ?? [];
  const allImplementations = availableImpls.length > 0 
    ? availableImpls
    : [{ name: 'default', description: 'Uses default workflow.toml settings', label: 'Base (workflow.toml)' }];

  // Get the selected implementation object
  const selectedImplObj = allImplementations.find(i => i.name === selectedImpl);
  // step_slots generalises prompt_slots (includes type: "action" | "llm")
  const stepSlots = selectedImplObj?.step_slots ?? {};
  const promptSlots = selectedImplObj?.prompt_slots ?? {};
  // Sort slot keys by workflow step order so dropdowns appear in execution sequence
  const sortByStepOrder = (keys: string[]) =>
    [...keys].sort((a, b) => {
      const ia = selectedWorkflowSteps.indexOf(a);
      const ib = selectedWorkflowSteps.indexOf(b);
      if (ia !== -1 && ib !== -1) return ia - ib;
      if (ia !== -1) return -1;
      if (ib !== -1) return 1;
      return 0;
    });
  const stepSlotKeys = sortByStepOrder(Object.keys(stepSlots));
  const promptSlotKeys = sortByStepOrder(Object.keys(promptSlots));
  // Use step_slots if available, otherwise fall back to prompt_slots
  const hasStepSlots = stepSlotKeys.length > 0;
  const hasPromptSlots = !hasStepSlots && promptSlotKeys.length > 0;

  const doSubmit = () => {
    // Build input_payload from dynamic inputs
    const inputPayload: Record<string, string> = {};
    for (const key of selectedWorkflowInitInputKeys) {
      if (isFileInput(key)) {
        const file = fileInputs[key];
        if (file) inputPayload[key] = file.name;
      } else {
        const value = textInputs[key]?.trim();
        if (value) inputPayload[key] = value;
      }
    }
    
    // Build BCS payload
    const implName = selectedImpl && selectedImpl !== 'default' ? selectedImpl : undefined;
    const pSelections = Object.keys(promptSelections).length > 0 ? promptSelections : undefined;

    submitMut.mutate(
      {
        workflow_name: workflow,
        project_root: selectedRepo?.path || undefined,
        worker_id: selectedRepo?.worker_id || workerId || undefined,
        start_step: startStep || undefined,
        input_payload: Object.keys(inputPayload).length > 0 ? inputPayload : undefined,
        implementation_name: implName,
        prompt_selections: pSelections,
      },
      {
        onSettled: () => {
          setShowConfirm(false);
          setWorkflow('');
          setStartStep('');
          setSelectedImpl('');
          setPromptSelections({});
          setFileInputs({});
          setTextInputs({});
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
        <div className="bg-bg-secondary border border-border rounded-xl max-w-xl w-full">
          <div className="px-5 py-3.5 border-b border-border">
            <h3 className="text-sm font-semibold">New Workflow Run</h3>
          </div>
          <div className="p-5">
            <div className="mb-4">
              <label className="block text-sm text-text-secondary mb-1.5 font-medium">Worker</label>
              <select
                className="w-full bg-bg-input border border-border rounded-md px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent"
                value={workerId}
                onChange={e => { setWorkerId(e.target.value); setRepoId(''); setWorkflow(''); }}
              >
                <option value="">Any worker</option>
                {workerList.map(w => (
                  <option key={w.worker_id} value={w.worker_id}>
                    {w.worker_id} ({w.worker_label})
                  </option>
                ))}
              </select>
            </div>

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
                disabled={!workflow}
              >
                <option value="">From beginning</option>
                {selectedWorkflowSteps.map(step => (
                  <option key={step} value={step}>{step}</option>
                ))}
              </select>
            </div>

            {allImplementations.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm text-text-secondary mb-1.5 font-medium">Implementation</label>
                <select
                  className="w-full bg-bg-input border border-border rounded-md px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent"
                  value={selectedImpl}
                  onChange={e => setSelectedImpl(e.target.value)}
                  disabled={!workflow}
                >
                  <option value="">Select implementation...</option>
                  {allImplementations.map(impl => (
                    <option key={impl.name} value={impl.name}>{impl.label}</option>
                  ))}
                </select>
                <div className="mt-1 text-xs text-text-muted">
                  {allImplementations.length} implementation{allImplementations.length !== 1 ? 's' : ''} available
                </div>
              </div>
            )}

            {hasStepSlots && (
              <div className="mb-4 p-4 bg-bg-input border border-border rounded-lg">
                <h4 className="text-sm font-semibold text-text-secondary mb-3">Step Configuration</h4>
                {stepSlotKeys.map(slotId => {
                  const slot = stepSlots[slotId];
                  const defaultValue = slot.default ?? (slot.options[0]?.name ?? '');
                  const currentValue = promptSelections[slotId] ?? defaultValue;
                  const isAction = slot.type === 'action';
                  return (
                    <div key={slotId} className="mb-3 last:mb-0">
                      <label className="block text-sm text-text-secondary mb-1.5 font-medium">
                        {slot.label}
                        {isAction && <span className="ml-2 text-xs text-text-muted font-normal">(provider)</span>}
                      </label>
                      <select
                        className="w-full bg-bg-input border border-border rounded-md px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent"
                        value={currentValue}
                        onChange={e => setPromptSelections(prev => ({ ...prev, [slotId]: e.target.value }))}
                      >
                        {slot.options.map(opt => (
                          <option key={opt.name} value={opt.name}>
                            {opt.description || opt.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            )}

            {hasPromptSlots && (
              <div className="mb-4 p-4 bg-bg-input border border-border rounded-lg">
                <h4 className="text-sm font-semibold text-text-secondary mb-3">Prompt Variations</h4>
                {promptSlotKeys.map(slotId => {
                  const slot = promptSlots[slotId];
                  const defaultValue = slot.default ?? (slot.options[0]?.name ?? '');
                  const currentValue = promptSelections[slotId] ?? defaultValue;
                  return (
                    <div key={slotId} className="mb-3 last:mb-0">
                      <label className="block text-sm text-text-secondary mb-1.5 font-medium">{slot.label}</label>
                      <select
                        className="w-full bg-bg-input border border-border rounded-md px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent"
                        value={currentValue}
                        onChange={e => setPromptSelections(prev => ({ ...prev, [slotId]: e.target.value }))}
                      >
                        {slot.options.map(opt => (
                          <option key={opt.name} value={opt.name}>{opt.name}</option>
                        ))}
                      </select>
                      {slot.options.find(o => o.name === currentValue)?.description && (
                        <div className="mt-1 text-xs text-text-muted">
                          {slot.options.find(o => o.name === currentValue)?.description}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {selectedWorkflowInitInputKeys.length > 0 && (
              <div className="mb-4 p-4 bg-bg-input border border-border rounded-lg">
                <h4 className="text-sm font-semibold text-text-secondary mb-3">Workflow Inputs</h4>
                {selectedWorkflowInitInputKeys.map(key => (
                  <div key={key} className="mb-3 last:mb-0">
                    <label className="block text-sm text-text-secondary mb-1.5 font-medium">{key}</label>
                    {isFileInput(key) ? (
                      <div>
                        <input
                          type="file"
                          ref={el => { fileInputRefs.current[key] = el; }}
                          className="w-full bg-bg-input border border-border rounded-md px-3 py-2 text-sm text-text-primary file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-accent/20 file:text-accent hover:file:bg-accent/30"
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) setFileInputs(prev => ({ ...prev, [key]: file }));
                          }}
                        />
                        {fileInputs[key] && (
                          <div className="mt-1 text-xs text-text-muted">
                            Selected: {fileInputs[key].name}
                          </div>
                        )}
                      </div>
                    ) : (
                      <input
                        type="text"
                        className="w-full bg-bg-input border border-border rounded-md px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent"
                        placeholder={`Enter ${key}...`}
                        value={textInputs[key] ?? ''}
                        onChange={e => setTextInputs(prev => ({ ...prev, [key]: e.target.value }))}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

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
        message={`Submit job for workflow "${workflow}"?${selectedRepo ? ` Repo: ${selectedRepo.name} (${selectedRepo.path})` : ''}${selectedImpl ? `\nImplementation: ${selectedImpl}` : ''}${Object.keys(promptSelections).length > 0 ? `\nPrompts: ${Object.entries(promptSelections).map(([k, v]) => `${k}=${v}`).join(', ')}` : ''}${selectedWorkflowInitInputKeys.length > 0 ? `\n\nInputs: ${selectedWorkflowInitInputKeys.map(k => isFileInput(k) ? `${k}=${fileInputs[k]?.name ?? '(none)'}` : `${k}=${textInputs[k]?.trim() || '(none)'}`).join(', ')}` : ''}`}
        confirmLabel="Submit"
        confirmVariant="primary"
        onConfirm={doSubmit}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  );
}
