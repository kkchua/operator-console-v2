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
  UserInfoResponse,
  NavigationItem,
} from './types';
import { supabase } from '../lib/supabase';

const BASE = import.meta.env.VITE_API_URL || '/api';

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    return { Authorization: `Bearer ${session.access_token}` };
  }
  return {};
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      ...authHeaders,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401) {
    await supabase.auth.signOut();
    throw new Error('Session expired. Please sign in again.');
  }
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`${method} ${path} failed (${res.status}): ${detail}`);
  }
  return res.json();
}

// Runs
export const listRuns = (status?: string, workerId?: string) => {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (workerId) params.set('worker_id', workerId);
  const qs = params.toString();
  return request<RunListResponse>('GET', `/runs${qs ? `?${qs}` : ''}`);
};

export const listAllRuns = (workerId?: string, limit = 100, offset = 0) => {
  const params = new URLSearchParams();
  if (workerId) params.set('worker_id', workerId);
  params.set('limit', String(limit));
  params.set('offset', String(offset));
  return request<RunListResponse>('GET', `/runs?${params.toString()}`);
};

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

export const updateWorker = (workerId: string, data: Partial<{ worker_label: string; status: string; is_enabled: boolean; capabilities: Record<string, unknown>; host_id: string }>) =>
  request<WorkerResponse>('PUT', `/workers/${workerId}`, data);

export const deleteWorker = (workerId: string) =>
  request<{ status: string }>('DELETE', `/workers/${workerId}`);

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

export const updateHost = (hostId: string, data: Partial<{ hostname: string; ip_address: string; os_type: string }>) =>
  request<HostResponse>('PUT', `/hosts/${hostId}`, data);

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

// Auth
export const getMe = () =>
  request<UserInfoResponse>('GET', '/auth/me');

export const getNavigation = (appId = 'agent-runner') =>
  request<NavigationItem[]>('GET', `/auth/navigation?app_id=${appId}`);
