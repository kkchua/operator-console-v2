import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { LoginPage } from './components/LoginPage'
import { Layout } from './components/Layout'
import { WorkerProvider } from './components/WorkerContext'
import { RunsPage } from './pages/RunsPage'
import { HistoryPage } from './pages/HistoryPage'
import { SubmitPage } from './pages/SubmitPage'
import { ReposPage } from './pages/ReposPage'
import { WorkersPage } from './pages/WorkersPage'
import { HostsPage } from './pages/HostsPage'
import { WorkflowsPage } from './pages/WorkflowsPage'

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={
            <WorkerProvider>
              <Layout />
            </WorkerProvider>
          }>
            <Route index element={<RunsPage />} />
            <Route path="history" element={<HistoryPage />} />
            <Route path="submit" element={<SubmitPage />} />
            <Route path="repos" element={<ReposPage />} />
            <Route path="workers" element={<WorkersPage />} />
            <Route path="hosts" element={<HostsPage />} />
            <Route path="workflows" element={<WorkflowsPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
