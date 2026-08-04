import { useWorkflows } from '../api/hooks';

export function WorkflowsPage() {
  const { data: workflows, isLoading } = useWorkflows();
  const list = workflows ?? [];

  return (
    <>
      <header className="h-14 bg-bg-secondary border-b border-border flex items-center px-6 justify-between shrink-0">
        <h2 className="text-lg font-semibold">Workflows</h2>
        <button className="px-3 py-1.5 rounded-md text-xs bg-accent hover:bg-accent-hover text-white font-medium">
          ↻ Sync Workflows
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="overflow-x-auto">
        <div className="bg-bg-secondary border border-border rounded-xl">
          <div className="px-5 py-3.5 border-b border-border">
            <h3 className="text-sm font-semibold">Workflow Definitions</h3>
          </div>
          {isLoading ? (
            <div className="p-8 text-center text-text-muted">Loading...</div>
          ) : list.length === 0 ? (
            <div className="p-8 text-center text-text-muted">No workflows synced</div>
          ) : (
            <>
              {/* Mobile card layout */}
              <div className="md:hidden divide-y divide-bg-primary">
                {list.map(w => (
                  <div key={w.workflow_name} className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-text-primary">{w.workflow_name}</span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900/50 text-green-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                        ACTIVE
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-text-muted">
                      <span>{w.step_count} steps</span>
                      <span className="font-mono">Prefix: {w.job_prefix}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop grid layout */}
              <div className="hidden md:block">
                {list.map(w => (
                  <div
                    key={w.workflow_name}
                    className="grid grid-cols-[1fr_auto_auto] items-center px-5 py-3 border-b border-bg-primary last:border-0 gap-4"
                  >
                    <div>
                      <span className="text-sm font-medium text-text-primary">{w.workflow_name}</span>
                      <span className="text-xs text-text-muted ml-2">{w.step_count} steps</span>
                    </div>
                    <span className="text-xs font-mono text-text-muted">Prefix: {w.job_prefix}</span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900/50 text-green-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                      ACTIVE
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
        </div>
      </div>
    </>
  );
}
