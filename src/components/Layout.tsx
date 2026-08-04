import { useState, type ReactNode } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useActiveRuns, useWorkers } from '../api/hooks';
import { useTheme } from './ThemeProvider';
import { useSelectedWorker } from './WorkerContext';

const navItems = [
  { to: '/', label: 'Active Runs', icon: '▶', end: true },
  { to: '/history', label: 'History', icon: '📜' },
  { to: '/submit', label: 'Submit Job', icon: '＋' },
  { to: '/repos', label: 'Repos', icon: '📁' },
  { to: '/workers', label: 'Workers', icon: '⚙' },
  { to: '/hosts', label: 'Hosts', icon: '🖥' },
  { to: '/workflows', label: 'Workflows', icon: '📋' },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { selectedWorkerId, setSelectedWorkerId } = useSelectedWorker();
  const { data } = useActiveRuns(5000, selectedWorkerId);
  const { data: workers } = useWorkers();
  const { theme, toggle } = useTheme();
  const runCount = data?.runs?.length ?? 0;
  const workerList = workers ?? [];

  return (
    <>
      <div className="p-5 border-b border-border">
        <h1 className="text-base font-bold text-text-primary">⚡ Agent Runner</h1>
        <p className="text-[11px] text-text-muted mt-0.5">Operator Console V2</p>
      </div>
      <nav className="flex-1 p-2 overflow-y-auto">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm mb-0.5 transition-colors ${
                isActive
                  ? 'bg-accent text-white'
                  : 'text-text-secondary hover:bg-white/5 hover:text-text-primary'
              }`
            }
          >
            <span className="text-base w-5 text-center">{item.icon}</span>
            <span className="flex-1">{item.label}</span>
            {item.to === '/' && runCount > 0 && (
              <span className="bg-danger text-white text-[11px] px-1.5 py-0.5 rounded-full font-semibold">
                {runCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-border">
        <div className="text-[11px] text-text-muted uppercase tracking-wider mb-1">Worker</div>
        <select
          className="w-full bg-bg-input border border-border rounded-md px-2.5 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
          value={selectedWorkerId ?? ''}
          onChange={e => setSelectedWorkerId(e.target.value || null)}
        >
          <option value="">All Workers</option>
          {workerList.map(w => (
            <option key={w.worker_id} value={w.worker_id}>
              {w.worker_id} ({w.worker_label})
            </option>
          ))}
        </select>
        <button
          onClick={toggle}
          className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs border border-border text-text-muted hover:text-text-primary hover:border-text-muted transition-colors"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
        </button>
      </div>
    </>
  );
}

export function Layout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();

  // Close drawer on route change
  const closeDrawer = () => setDrawerOpen(false);

  return (
    <div className="flex h-screen">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 bg-bg-secondary border-r border-border flex-col shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile drawer backdrop */}
      {drawerOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={closeDrawer} />
      )}

      {/* Mobile drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-60 bg-bg-secondary flex flex-col shrink-0 transform transition-transform duration-200 md:hidden ${
          drawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent onNavigate={closeDrawer} />
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Mobile header */}
        <div className="md:hidden h-12 bg-bg-secondary border-b border-border flex items-center px-4 gap-3 shrink-0">
          <button
            className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-white/5"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-sm font-bold text-text-primary">⚡ Agent Runner</h1>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
