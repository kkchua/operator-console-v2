import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useHasAccess } from '../hooks/usePermission';

export function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const hasAccess = useHasAccess(location.pathname);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <div className="text-text-muted text-sm">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <div className="text-center space-y-2">
          <div className="text-4xl">🔒</div>
          <h2 className="text-lg font-semibold text-text-primary">Access Denied</h2>
          <p className="text-sm text-text-muted">You don't have permission to view this page.</p>
          <a href="/" className="text-sm text-accent hover:underline">← Back to Active Runs</a>
        </div>
      </div>
    );
  }

  return <Outlet />;
}
