export interface RunResponse {
  run_id: string;
  run_code: string;
  workflow_name: string;
  run_status: string;
  action_requested: string | null;
  current_step: string | null;
  current_step_run_id: string | null;
  worker_id: string | null;
  created_at: string;
  updated_at: string;
  valid_actions: string[];
}

export interface RunListResponse {
  runs: RunResponse[];
}

export interface WorkerResponse {
  worker_id: string;
  host_id: string | null;
  hostname: string | null;
  status: string;
  worker_label: string;
  last_heartbeat: string | null;
  current_run_id: string | null;
}

export interface WorkflowResponse {
  workflow_name: string;
  job_prefix: string;
  init_step: string | null;
  is_active: boolean;
  step_count: number;
}

export interface SubmitRunRequest {
  workflow_name: string;
  worker_id?: string;
  project_root?: string;
  start_step?: string;
  input_payload?: Record<string, string>;
}

export interface ActionRequest {
  action: string;
  feedback?: string;
}

export interface OutcomeResponse {
  run_id: string;
  run_status: string;
  current_step: string | null;
  action_requested: string | null;
  message: string;
}

export interface HeartbeatResponse {
  commands: string[];
}

// Hosts
export interface HostResponse {
  id: string;
  hostname: string;
  ip_address: string | null;
  os_type: string;
  created_at: string;
  updated_at: string;
}

export interface CreateHostRequest {
  hostname: string;
  ip_address?: string;
  os_type?: string;
}

// Repos
export interface RepoWorkflowResponse {
  id: string;
  workflow_name: string;
  display_name: string | null;
  created_at: string;
}

export interface RepoResponse {
  id: string;
  name: string;
  path: string;
  worker_id: string;
  host_id: string | null;
  hostname: string | null;
  os_type: string | null;
  workflows: RepoWorkflowResponse[];
  created_at: string;
  updated_at: string;
}

export interface CreateRepoRequest {
  name: string;
  path: string;
  worker_id: string;
}

export interface UpdateRepoRequest {
  name?: string;
  path?: string;
  worker_id?: string;
}

export interface AssignWorkflowRequest {
  workflow_name: string;
  display_name?: string;
}
