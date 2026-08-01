import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from './client';
import type { SubmitRunRequest, ActionRequest, CreateRepoRequest, AssignWorkflowRequest, CreateHostRequest } from './types';

export function useActiveRuns(refreshInterval = 5000) {
  return useQuery({
    queryKey: ['runs', 'active'],
    queryFn: () => api.listRuns('active'),
    refetchInterval: refreshInterval,
  });
}

export function useAllRuns(refreshInterval = 10000) {
  return useQuery({
    queryKey: ['runs', 'all'],
    queryFn: api.listAllRuns,
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['repos'] });
    },
  });
}

export function useUnassignWorkflow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ repoId, workflowName }: { repoId: string; workflowName: string }) =>
      api.unassignWorkflow(repoId, workflowName),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['repos'] });
    },
  });
}
