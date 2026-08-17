import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from './client';
import type { SubmitRunRequest, ActionRequest, CreateRepoRequest, AssignWorkflowRequest, CreateHostRequest, RepoResponse } from './types';

export function useActiveRuns(refreshInterval = 5000, workerId?: string | null) {
  return useQuery({
    queryKey: ['runs', 'active', workerId ?? ''],
    queryFn: () => api.listRuns('active', workerId ?? undefined),
    refetchInterval: refreshInterval,
  });
}

export function useAllRuns(refreshInterval = 10000, workerId?: string | null, limit = 100, offset = 0) {
  return useQuery({
    queryKey: ['runs', 'all', workerId ?? '', limit, offset],
    queryFn: () => api.listAllRuns(workerId ?? undefined, limit, offset),
    refetchInterval: refreshInterval,
  });
}

export function useRun(runId: string | null) {
  return useQuery({
    queryKey: ['run', runId],
    queryFn: () => api.getRun(runId!),
    enabled: !!runId,
  });
}

export function useWorkers() {
  return useQuery({
    queryKey: ['workers'],
    queryFn: api.listWorkers,
    refetchInterval: 10000,
  });
}

export function useWorkflows() {
  return useQuery({
    queryKey: ['workflows'],
    queryFn: api.listWorkflows,
  });
}

export function useSubmitRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: SubmitRunRequest) => api.submitRun(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['runs'] });
    },
  });
}

export function useRequestAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ runId, data }: { runId: string; data: ActionRequest }) =>
      api.requestAction(runId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['runs'] });
      qc.invalidateQueries({ queryKey: ['run'] });
    },
  });
}

export function useResetStep() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ runId, stepName }: { runId: string; stepName: string }) =>
      api.resetStep(runId, stepName),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['runs'] });
    },
  });
}

export function useStopWorker() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (workerId: string) => api.stopWorker(workerId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workers'] });
    },
  });
}

export function useRegisterWorker() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { worker_id: string; worker_label?: string; host_id?: string }) =>
      api.registerWorker(data.worker_id, data.worker_label ?? 'live'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workers'] });
    },
  });
}

export function useUpdateWorker() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ workerId, data }: { workerId: string; data: Parameters<typeof api.updateWorker>[1] }) =>
      api.updateWorker(workerId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workers'] });
    },
  });
}

export function useDeleteWorker() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (workerId: string) => api.deleteWorker(workerId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workers'] });
    },
  });
}

// Hosts
export function useHosts() {
  return useQuery({
    queryKey: ['hosts'],
    queryFn: api.listHosts,
  });
}

export function useCreateHost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateHostRequest) => api.createHost(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hosts'] });
      qc.invalidateQueries({ queryKey: ['workers'] });
    },
  });
}

export function useDeleteHost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (hostId: string) => api.deleteHost(hostId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hosts'] });
      qc.invalidateQueries({ queryKey: ['workers'] });
    },
  });
}

export function useUpdateHost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ hostId, data }: { hostId: string; data: Parameters<typeof api.updateHost>[1] }) =>
      api.updateHost(hostId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hosts'] });
      qc.invalidateQueries({ queryKey: ['workers'] });
    },
  });
}

// Repos
export function useRepos() {
  return useQuery({
    queryKey: ['repos'],
    queryFn: api.listRepos,
  });
}

export function useCreateRepo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRepoRequest) => api.createRepo(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['repos'] });
    },
  });
}

export function useUpdateRepo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ repoId, data }: { repoId: string; data: Parameters<typeof api.updateRepo>[1] }) =>
      api.updateRepo(repoId, data),
    onSuccess: (updated) => {
      qc.setQueryData<RepoResponse[]>(['repos'], old => {
        if (!old) return old;
        return old.map(r => r.id !== updated.id ? r : { ...r, ...updated });
      });
      setTimeout(() => qc.invalidateQueries({ queryKey: ['repos'] }), 2000);
    },
  });
}

export function useDeleteRepo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (repoId: string) => api.deleteRepo(repoId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['repos'] });
    },
  });
}

export function useAssignWorkflow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ repoId, data }: { repoId: string; data: AssignWorkflowRequest }) =>
      api.assignWorkflow(repoId, data),
    onSuccess: (newWf, { repoId }) => {
      qc.setQueryData<RepoResponse[]>(['repos'], old => {
        if (!old) return old;
        return old.map(r => r.id !== repoId ? r : { ...r, workflows: [...r.workflows, newWf] });
      });
      setTimeout(() => qc.invalidateQueries({ queryKey: ['repos'] }), 2000);
    },
  });
}

export function useUnassignWorkflow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ repoId, workflowName }: { repoId: string; workflowName: string }) =>
      api.unassignWorkflow(repoId, workflowName),
    onSuccess: (_data, { repoId, workflowName }) => {
      qc.setQueryData<RepoResponse[]>(['repos'], old => {
        if (!old) return old;
        return old.map(r => r.id !== repoId ? r : { ...r, workflows: r.workflows.filter(w => w.workflow_name !== workflowName) });
      });
      setTimeout(() => qc.invalidateQueries({ queryKey: ['repos'] }), 2000);
    },
  });
}

// Auth
export function useNavigation() {
  return useQuery({
    queryKey: ['navigation'],
    queryFn: () => api.getNavigation(),
  });
}

// User roles
export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: api.listUsers,
  });
}

export function useUpdateUserRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: { role: string } }) =>
      api.updateUserRole(userId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useRemoveUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => api.removeUser(userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

// User-Worker assignments
export function useUserWorkers(userId: string) {
  return useQuery({
    queryKey: ['user-workers', userId],
    queryFn: () => api.getUserWorkers(userId),
    enabled: !!userId,
  });
}

export function useSetUserWorkers() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, workerIds }: { userId: string; workerIds: string[] }) =>
      api.setUserWorkers(userId, { worker_ids: workerIds }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['user-workers'] });
    },
  });
}
