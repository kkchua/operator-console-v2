# AGENTS.md — operator-console-v2

## Overview

React web app that serves as the operator console for the **agent-runner-v2** workflow execution system. Provides a UI for monitoring active runs, submitting jobs, managing workers/repos/workflows, and sending actions (approve, reject, cancel, etc.) to the backend.

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | React | 19 |
| Language | TypeScript | 6 |
| Build tool | Vite | 8 |
| CSS | Tailwind CSS v4 | 4 (via `@tailwindcss/vite` plugin) |
| Data fetching | TanStack React Query | 5 |
| Routing | React Router DOM | 7 |
| Linting | Oxlint | — |

## Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server (port 3000, hosts 0.0.0.0) |
| `npm run build` | Type-check (`tsc -b`) then production build |
| `npm run lint` | Run Oxlint |
| `npm run preview` | Preview production build |

## Project Structure

```
src/
├── api/
│   ├── client.ts        # Generic fetch wrapper + all API functions
│   ├── types.ts         # TypeScript interfaces for all API request/response types
│   └── hooks.ts         # React Query hooks (useQuery / useMutation wrappers)
├── components/
│   ├── Layout.tsx        # Sidebar nav + Outlet shell
│   ├── ThemeProvider.tsx  # Dark/light theme context + toggle
│   ├── StatusBadge.tsx   # Colored status pill with dot indicator
│   └── ConfirmDialog.tsx # Reusable modal with optional feedback input
├── pages/
│   ├── RunsPage.tsx      # Active runs list + detail panel + action dropdown
│   ├── HistoryPage.tsx   # All runs (completed/failed/etc.)
│   ├── SubmitPage.tsx    # Submit new workflow job
│   ├── ReposPage.tsx     # Manage repos + workflow assignments
│   ├── WorkersPage.tsx   # Worker list + stop action
│   └── WorkflowsPage.tsx # Workflow definitions list
├── App.tsx               # Router setup (all routes nested under Layout)
├── main.tsx              # Entry point (QueryClient + BrowserRouter + ThemeProvider)
└── index.css             # Tailwind import + CSS custom properties for theming
```

## Conventions

### Component patterns
- Function components with TypeScript; named exports (not default) for pages/components
- Props typed inline or via `interface Props` for complex components
- Shared UI components go in `src/components/`; page-level components in `src/pages/`

### API layer
- `client.ts` — one `request<T>()` generic helper; all endpoints exported as named functions
- `types.ts` — all request/response interfaces live here; co-located with client but separated for clarity
- `hooks.ts` — React Query wrappers; mutations call `queryClient.invalidateQueries()` on success
- Add new endpoints by: (1) add types to `types.ts`, (2) add function to `client.ts`, (3) add hook to `hooks.ts`

### Styling
- Tailwind CSS v4 with custom theme tokens defined as CSS custom properties in `index.css`
- Theme tokens: `--color-bg-primary`, `--color-bg-secondary`, `--color-bg-input`, `--color-border`, `--color-text-primary`, `--color-text-secondary`, `--color-text-muted`, `--color-accent`, `--color-accent-hover`, `--color-success`, `--color-danger`, `--color-warning`
- Use semantic token classes (e.g. `bg-bg-secondary`, `text-text-muted`) — not raw color values
- Dark theme is default; light theme overrides via `[data-theme="light"]` selector

### Date/time handling
- Backend returns **naive UTC datetimes** (no timezone suffix)
- Always append `'Z'` before parsing: `new Date(iso.endsWith('Z') || iso.includes('+') ? iso : iso + 'Z')`
- Display using `toLocaleString()` or relative time helpers

### Status model
- Run statuses: `RUNNING`, `PENDING`, `USER_SUBMITTED`, `USER_APPROVED`, `USER_REJECTED`, `USER_RESUMED`, `USER_RETRIED`, `USER_CANCELLED`, `WAITING_FOR_HUMAN_APPROVAL`, `AWAITING_INTERVENTION`, `AWAITING_MAXRETRIED`, `COMPLETED`, `FAILED`, `CANCELLED`
- Valid actions: `APPROVE`, `REJECT`, `CANCEL`, `FORCE_CANCEL`, `RESUME`, `RETRY`, `RESET`
- StatusBadge and action mappings use `Record<string, ...>` lookup dicts — follow this pattern for new statuses

## Backend API

The Vite dev server proxies `/api/*` to `http://192.168.0.200:8200` (the agent-runner-v2 backend).

### Resource endpoints

| Resource | Base path | Methods |
|----------|-----------|---------|
| Runs | `/api/runs` | GET (list), GET `/:id`, POST (submit), POST `/:id/action`, POST `/:id/reset-step` |
| Step outcomes | `/api/runs/step-runs/:stepRunId/outcome` | POST |
| Workers | `/api/workers` | GET (list), POST `/register`, POST `/:id/heartbeat`, POST `/:id/stop` |
| Workflows | `/api/workflows` | GET (list), POST `/sync` |
| Hosts | `/api/hosts` | GET (list), POST (create), DELETE `/:id` |
| Repos | `/api/repos` | GET (list), POST (create), PUT `/:id`, DELETE `/:id`, POST `/:id/workflows`, DELETE `/:id/workflows/:wfName` |

## Branch

All development happens on the `dev` branch. `master` is the stable/release branch.
