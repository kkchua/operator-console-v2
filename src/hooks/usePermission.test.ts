import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../contexts/AuthContext', () => ({
  AuthContext: {},
}));

const mockAuthState = { role: 'viewer', user: {}, session: {}, loading: false };

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => mockAuthState,
}));

import { useHasAccess } from './usePermission';

function setRole(role: string) {
  mockAuthState.role = role;
}

describe('useHasAccess', () => {
  beforeEach(() => {
    setRole('viewer');
  });

  it('admin has access to everything', () => {
    setRole('admin');
    expect(useHasAccess('/')).toBe(true);
    expect(useHasAccess('/history')).toBe(true);
    expect(useHasAccess('/submit')).toBe(true);
    expect(useHasAccess('/workflows')).toBe(true);
    expect(useHasAccess('/workers')).toBe(true);
    expect(useHasAccess('/hosts')).toBe(true);
    expect(useHasAccess('/repos')).toBe(true);
    expect(useHasAccess('/users')).toBe(true);
  });

  it('operator can access runs, history, submit, workflows, workers but not admin pages', () => {
    setRole('operator');
    expect(useHasAccess('/')).toBe(true);
    expect(useHasAccess('/history')).toBe(true);
    expect(useHasAccess('/submit')).toBe(true);
    expect(useHasAccess('/workflows')).toBe(true);
    expect(useHasAccess('/workers')).toBe(true);
    expect(useHasAccess('/hosts')).toBe(false);
    expect(useHasAccess('/repos')).toBe(false);
    expect(useHasAccess('/users')).toBe(false);
  });

  it('viewer can only access runs and history', () => {
    setRole('viewer');
    expect(useHasAccess('/')).toBe(true);
    expect(useHasAccess('/history')).toBe(true);
    expect(useHasAccess('/submit')).toBe(false);
    expect(useHasAccess('/workflows')).toBe(false);
    expect(useHasAccess('/workers')).toBe(false);
    expect(useHasAccess('/hosts')).toBe(false);
    expect(useHasAccess('/repos')).toBe(false);
    expect(useHasAccess('/users')).toBe(false);
  });

  it('unknown paths default to allowed', () => {
    setRole('viewer');
    expect(useHasAccess('/some-unknown-path')).toBe(true);
  });
});
