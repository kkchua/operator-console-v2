import { NavLink, Outlet } from 'react-router-dom';
import { useActiveRuns } from '../api/hooks';
import { useTheme } from './ThemeProvider';

const navItems = [
  { to: '/', label: 'Active Runs', icon: '▶', end: true },
  { to: '/submit', label: 'Submit Job', icon: '＋' },
  { to: '/repos', label: 'Repos', icon: '📁' },
  { to: '/workers', label: 'Workers', icon: '⚙' },
  { to: '/workflows', label: 'Workflows', icon: '📋' },
];

export function Layout() {
  const { data } = useActiveRuns();
  const { theme, toggle } = useTheme();
  const runCount = data?.runs?.length ?? 0;

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-60 bg-bg-secondary border-r border-border flex flex-col shrink-0">
        <div className="p-5 border-b border-border">
          <h1 className="text-base font-bold text-text-primary">⚡ Agent Runner</h1>
          <p className="text-[11px] text-text-muted mt-0.5">Operator Console V2</p>
        </div>
        <nav className="flex-1 p-2">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm mb-0.5 transition-colors ${
                  isActive
                    ? 'bg-accent text-white'
                    : 'text-text-secondary hover:bg-white/5 hover:text-text-primary'
                }`
              }
            >
              <span className="text-base w-5 text-center">{item.icon}</span>
              {item.label}
              {item.to === '/' && runCount > 0 && (
                <span className="ml-auto bg-danger text-white text-[11px] px-1.5 py-0.5 rounded-full font-semibold">
                  {runCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-border">
          <div className="text-[11px] text-text-muted uppercase tracking-wider mb-1">Worker</div>
          <select className="w-full bg-bg-input border border-border rounded-md px-2.5 py-2 text-sm text-text-primary focus:outline-none focus:border-accent">
            <option>worker-1 (live)</option>
            <option>worker-2 (dev)</option>
          </select>
          <button
            onClick={toggle}
            className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs border border-border text-text-muted hover:text-text-primary hover:border-text-muted transition-colors"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}
