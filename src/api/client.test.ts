import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as api from './client';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

function mockOk(body: unknown) {
  return Promise.resolve(new Response(JSON.stringify(body), { status: 200 }));
}

function mockError(status: number, detail = 'error') {
  return Promise.resolve(new Response(detail, { status }));
}

beforeEach(() => {
  mockFetch.mockReset();
});

// ── Runs ──────────────────────────────────────────────

describe('listRuns', () => {
  it('fetches all runs when no status given', async () => {
    mockFetch.mockReturnValue(mockOk({ runs: [] }));
    await api.listRuns();
    expect(mockFetch).toHaveBeenCalledWith('/api/runs', { method: 'GET', headers: undefined, body: undefined });
  });

  it('appends status query param', async () => {
    mockFetch.mockReturnValue(mockOk({ runs: [] }));
    await api.listRuns('active');
    expect(mockFetch).toHaveBeenCalledWith('/api/runs?status=active', expect.anything());
  });
});

describe('listAllRuns', () => {
  it('fetches GET /runs', async () => {
    const data = { runs: [{ run_id: 'r1' }] };
    mockFetch.mockReturnValue(mockOk(data));
    const result = await api.listAllRuns();
    expect(mockFetch).toHaveBeenCalledWith('/api/runs', { method: 'GET', headers: undefined, body: undefined });
    expect(result).toEqual(data);
  });
});

describe('getRun', () => {
  it('fetches a single run by id', async () => {
    const data = { run_id: 'r1', workflow_name: 'test' };
    mockFetch.mockReturnValue(mockOk(data));
    const result = await api.getRun('r1');
    expect(mockFetch).toHaveBeenCalledWith('/api/runs/r1', { method: 'GET', headers: undefined, body: undefined });
    expect(result).toEqual(data);
  });
});

describe('submitRun', () => {
  it('posts run data', async () => {
    const req = { workflow_name: 'wf1', project_root: '/tmp' };
    const res = { run_id: 'r1', run_code: 'WF1-001' };
    mockFetch.mockReturnValue(mockOk(res));
    const result = await api.submitRun(req);
    expect(mockFetch).toHaveBeenCalledWith('/api/runs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
    expect(result).toEqual(res);
  });
});

describe('requestAction', () => {
  it('posts action to run', async () => {
    const data = { action: 'APPROVE', feedback: 'looks good' };
    mockFetch.mockReturnValue(mockOk({ run_id: 'r1' }));
    await api.requestAction('r1', data);
    expect(mockFetch).toHaveBeenCalledWith('/api/runs/r1/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  });
});

describe('resetStep', () => {
  it('posts reset-step with step name', async () => {
    mockFetch.mockReturnValue(mockOk({}));
    await api.resetStep('r1', 'build');
    expect(mockFetch).toHaveBeenCalledWith('/api/runs/r1/reset-step', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ step_name: 'build' }),
    });
  });
});

describe('reportOutcome', () => {
  it('posts outcome without failure class', async () => {
    mockFetch.mockReturnValue(mockOk({ run_id: 'r1' }));
    await api.reportOutcome('sr1', 'success');
    expect(mockFetch).toHaveBeenCalledWith('/api/runs/step-runs/sr1/outcome', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ outcome: 'success', failure_class: undefined }),
    });
  });

  it('posts outcome with failure class', async () => {
    mockFetch.mockReturnValue(mockOk({}));
    await api.reportOutcome('sr1', 'failure', 'TRANSIENT');
    expect(mockFetch).toHaveBeenCalledWith('/api/runs/step-runs/sr1/outcome', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ outcome: 'failure', failure_class: 'TRANSIENT' }),
    });
  });
});

// ── Workers ───────────────────────────────────────────

describe('listWorkers', () => {
  it('fetches GET /workers', async () => {
    const data = [{ worker_id: 'w1' }];
    mockFetch.mockReturnValue(mockOk(data));
    const result = await api.listWorkers();
    expect(mockFetch).toHaveBeenCalledWith('/api/workers', { method: 'GET', headers: undefined, body: undefined });
    expect(result).toEqual(data);
  });
});

describe('registerWorker', () => {
  it('posts worker registration', async () => {
    mockFetch.mockReturnValue(mockOk({ worker_id: 'w1' }));
    await api.registerWorker('w1', 'live');
    expect(mockFetch).toHaveBeenCalledWith('/api/workers/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ worker_id: 'w1', worker_label: 'live' }),
    });
  });

  it('defaults worker_label to live', async () => {
    mockFetch.mockReturnValue(mockOk({}));
    await api.registerWorker('w1');
    expect(mockFetch).toHaveBeenCalledWith('/api/workers/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ worker_id: 'w1', worker_label: 'live' }),
    });
  });
});

describe('heartbeat', () => {
  it('posts heartbeat with status', async () => {
    mockFetch.mockReturnValue(mockOk({ commands: [] }));
    await api.heartbeat('w1', 'busy');
    expect(mockFetch).toHaveBeenCalledWith('/api/workers/w1/heartbeat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'busy' }),
    });
  });

  it('defaults status to idle', async () => {
    mockFetch.mockReturnValue(mockOk({}));
    await api.heartbeat('w1');
    expect(mockFetch).toHaveBeenCalledWith('/api/workers/w1/heartbeat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'idle' }),
    });
  });
});

describe('stopWorker', () => {
  it('posts stop command', async () => {
    mockFetch.mockReturnValue(mockOk({ status: 'stopping' }));
    await api.stopWorker('w1');
    expect(mockFetch).toHaveBeenCalledWith('/api/workers/w1/stop', {
      method: 'POST',
      headers: undefined,
      body: undefined,
    });
  });
});

describe('updateWorker', () => {
  it('puts worker update data', async () => {
    const data = { worker_label: 'staging', status: 'active' };
    mockFetch.mockReturnValue(mockOk({ worker_id: 'w1', ...data }));
    await api.updateWorker('w1', data);
    expect(mockFetch).toHaveBeenCalledWith('/api/workers/w1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  });

  it('supports partial updates', async () => {
    const data = { host_id: 'h1' };
    mockFetch.mockReturnValue(mockOk({ worker_id: 'w1' }));
    await api.updateWorker('w1', data);
    expect(mockFetch).toHaveBeenCalledWith('/api/workers/w1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  });
});

describe('deleteWorker', () => {
  it('deletes worker by id', async () => {
    mockFetch.mockReturnValue(mockOk({ status: 'ok' }));
    await api.deleteWorker('w1');
    expect(mockFetch).toHaveBeenCalledWith('/api/workers/w1', {
      method: 'DELETE',
      headers: undefined,
      body: undefined,
    });
  });
});

// ── Workflows ─────────────────────────────────────────

describe('listWorkflows', () => {
  it('fetches GET /workflows', async () => {
    const data = [{ workflow_name: 'wf1' }];
    mockFetch.mockReturnValue(mockOk(data));
    const result = await api.listWorkflows();
    expect(mockFetch).toHaveBeenCalledWith('/api/workflows', { method: 'GET', headers: undefined, body: undefined });
    expect(result).toEqual(data);
  });
});

describe('syncWorkflows', () => {
  it('posts workflow sync', async () => {
    const def = { steps: ['a', 'b'] };
    mockFetch.mockReturnValue(mockOk({ workflow_name: 'wf1' }));
    await api.syncWorkflows('wf1', def);
    expect(mockFetch).toHaveBeenCalledWith('/api/workflows/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workflow_name: 'wf1', definition: def }),
    });
  });
});

// ── Hosts ─────────────────────────────────────────────

describe('listHosts', () => {
  it('fetches GET /hosts', async () => {
    mockFetch.mockReturnValue(mockOk([]));
    await api.listHosts();
    expect(mockFetch).toHaveBeenCalledWith('/api/hosts', { method: 'GET', headers: undefined, body: undefined });
  });
});

describe('createHost', () => {
  it('posts host data', async () => {
    const data = { hostname: 'server1', ip_address: '10.0.0.1', os_type: 'linux' };
    mockFetch.mockReturnValue(mockOk({ id: 'h1' }));
    await api.createHost(data);
    expect(mockFetch).toHaveBeenCalledWith('/api/hosts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  });
});

describe('deleteHost', () => {
  it('deletes host by id', async () => {
    mockFetch.mockReturnValue(mockOk({ status: 'deleted' }));
    await api.deleteHost('h1');
    expect(mockFetch).toHaveBeenCalledWith('/api/hosts/h1', { method: 'DELETE', headers: undefined, body: undefined });
  });
});

// ── Repos ─────────────────────────────────────────────

describe('listRepos', () => {
  it('fetches GET /repos', async () => {
    mockFetch.mockReturnValue(mockOk([]));
    await api.listRepos();
    expect(mockFetch).toHaveBeenCalledWith('/api/repos', { method: 'GET', headers: undefined, body: undefined });
  });
});

describe('createRepo', () => {
  it('posts repo data', async () => {
    const data = { name: 'my-repo', path: '/src', worker_id: 'w1' };
    mockFetch.mockReturnValue(mockOk({ id: 'r1' }));
    await api.createRepo(data);
    expect(mockFetch).toHaveBeenCalledWith('/api/repos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  });
});

describe('updateRepo', () => {
  it('puts partial repo data', async () => {
    const data = { name: 'renamed' };
    mockFetch.mockReturnValue(mockOk({ id: 'r1' }));
    await api.updateRepo('r1', data);
    expect(mockFetch).toHaveBeenCalledWith('/api/repos/r1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  });
});

describe('deleteRepo', () => {
  it('deletes repo by id', async () => {
    mockFetch.mockReturnValue(mockOk({ status: 'deleted' }));
    await api.deleteRepo('r1');
    expect(mockFetch).toHaveBeenCalledWith('/api/repos/r1', { method: 'DELETE', headers: undefined, body: undefined });
  });
});

describe('assignWorkflow', () => {
  it('posts workflow assignment', async () => {
    const data = { workflow_name: 'wf1', display_name: 'WF One' };
    mockFetch.mockReturnValue(mockOk({ id: 'a1' }));
    await api.assignWorkflow('r1', data);
    expect(mockFetch).toHaveBeenCalledWith('/api/repos/r1/workflows', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  });
});

describe('unassignWorkflow', () => {
  it('deletes workflow assignment', async () => {
    mockFetch.mockReturnValue(mockOk({ status: 'removed' }));
    await api.unassignWorkflow('r1', 'wf1');
    expect(mockFetch).toHaveBeenCalledWith('/api/repos/r1/workflows/wf1', {
      method: 'DELETE',
      headers: undefined,
      body: undefined,
    });
  });
});

// ── Error handling ────────────────────────────────────

describe('error handling', () => {
  it('throws on non-ok response with detail', async () => {
    mockFetch.mockReturnValue(mockError(404, 'not found'));
    await expect(api.getRun('bad')).rejects.toThrow('GET /runs/bad failed (404): not found');
  });

  it('throws on 500 server error', async () => {
    mockFetch.mockReturnValue(mockError(500, 'internal'));
    await expect(api.listWorkers()).rejects.toThrow('GET /workers failed (500): internal');
  });

  it('throws on POST failure', async () => {
    mockFetch.mockReturnValue(mockError(400, 'bad request'));
    await expect(api.submitRun({ workflow_name: '' })).rejects.toThrow('POST /runs failed (400): bad request');
  });
});
