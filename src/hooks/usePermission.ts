import { useAuth } from './useAuth';

const PAGE_PERMISSIONS: Record<string, string[]> = {
  '/': ['admin', 'operator', 'viewer'],
  '/history': ['admin', 'operator', 'viewer'],
  '/submit': ['admin', 'operator'],
  '/workflows': ['admin', 'operator'],
  '/workers': ['admin', 'operator'],
  '/hosts': ['admin'],
  '/repos': ['admin'],
  '/users': ['admin'],
};

export function useHasAccess(path: string): boolean {
  const { role } = useAuth();
  const allowed = PAGE_PERMISSIONS[path];
  if (!allowed) return true;
  return allowed.includes(role);
}
