import type {
  RunListResponse,
  RunResponse,
  WorkerResponse,
  WorkflowResponse,
  SubmitRunRequest,
  ActionRequest,
  OutcomeResponse,
  HeartbeatResponse,
  HostResponse,
  CreateHostRequest,
  RepoResponse,
  CreateRepoRequest,
  AssignWorkflowRequest,
  RepoWorkflowResponse,
} from './types';

const BASE = '/api';

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`${method} ${path} failed (${res.status}): ${detail}`);
  }
  return res.json();
}

// Runs
export const listRuns = (status?: string) =>
  request<RunListResponse>('GET', `/runs${status ? `?status=${status}` : ''}`);

export const getRun = (runId: string) =>
  request<RunResponse>('GET', `/runs/${runId}`);

export const submitRun = (data: SubmitRunRequest) =>
  request<RunResponse>('POST', '/runs', data);

export const requestAction = (runId: string, data: ActionRequest) =>
  request<RunResponse>('POST', `/runs/${runId}/action`, data);

export const resetStep = (runId: string, stepName: string) =>
  request<RunResponse>('POST', `/runs/${runId}/reset-step`, { step_name: stepName });

export const reportOutcome = (stepRunId: string, outcome: string, failureClass?: string) =>
  request<OutcomeResponse>('POST', `/runs/step-runs/${stepRunId}/outcome`, {
    outcome,
    failure_class: failureClass,
  });

// Workers
export const listWorkers = () =>
  request<WorkerResponse[]>('GET', '/workers');

export const registerWorker = (workerId: string, workerLabel = 'live') =>
  request<WorkerResponse>('POST', '/workers/register', { worker_id: workerId, worker_label: workerLabel });

export const heartbeat = (workerId: string, status = 'idle') =>
  request<HeartbeatResponse>('POST', `/workers/${workerId}/heartbeat`, { status });

export const stopWorker = (workerId: string) =>
  request<{ status: string }>('POST', `/workers/${workerId}/stop`);

// Workflows
export const listWorkflows = () =>
  request<WorkflowResponse[]>('GET', '/workflows');

export const syncWorkflows = (workflowName: string, definition: Record<string, unknown>) =>
  request<WorkflowResponse>('POST', '/workflows/sync', { workflow_name: workflowName, definition });

// Hosts
export const listHosts = () =>
  request<HostResponse[]>('GET', '/hosts');

export const createHost = (data: CreateHostRequest) =>
  request<HostResponse>('POST', '/hosts', data);

export const deleteHost = (hostId: string) =>
  request<{ status: string }>('DELETE', `/hosts/${hostId}`);

// Repos
export const listRepos = () =>
  request<RepoResponse[]>('GET', '/repos');

export const createRepo = (data: CreateRepoRequest) =>
  request<RepoResponse>('POST', '/repos', data);

export const updateRepo = (repoId: string, data: Partial<CreateRepoRequest>) =>
  request<RepoResponse>('PUT', `/repos/${repoId}`, data);

export const deleteRepo = (repoId: string) =>
  request<{ status: string }>('DELETE', `/repos/${repoId}`);

export const assignWorkflow = (repoId: string, data: AssignWorkflowRequest) =>
  request<RepoWorkflowResponse>('POST', `/repos/${repoId}/workflows`, data);

export const unassignWorkflow = (repoId: string, workflowName: string) =>
  request<{ status: string }>('DELETE', `/repos/${repoId}/workflows/${workflowName}`);
