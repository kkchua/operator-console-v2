import { Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { RunsPage } from './pages/RunsPage'
import { HistoryPage } from './pages/HistoryPage'
import { SubmitPage } from './pages/SubmitPage'
import { ReposPage } from './pages/ReposPage'
import { WorkersPage } from './pages/WorkersPage'
import { WorkflowsPage } from './pages/WorkflowsPage'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<RunsPage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="submit" element={<SubmitPage />} />
        <Route path="repos" element={<ReposPage />} />
        <Route path="workers" element={<WorkersPage />} />
        <Route path="workflows" element={<WorkflowsPage />} />
      </Route>
    </Routes>
  )
}

export default App
