import { RaceProvider, useRace } from './context/RaceContext'
import LeftPanel from './components/LeftPanel'
import CenterPanel from './components/CenterPanel'
import RightPanel from './components/RightPanel'
import useRealtimeQueue from './hooks/useRealtimeQueue'
import useRealtimeLaps from './hooks/useRealtimeLaps'

function DashboardContent() {
  useRealtimeQueue()
  useRealtimeLaps()

  const { toast } = useRace()

  return (
    <>
      {/* Header */}
      <header className="dashboard-header">
        <h1>Drift X Karting 2026</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Race Control</span>
          <div className="status-dot" />
        </div>
      </header>

      {/* 3-Panel Layout */}
      <main className="dashboard-layout">
        <LeftPanel />
        <CenterPanel />
        <RightPanel />
      </main>

      {/* Toast */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.message}
        </div>
      )}
    </>
  )
}

export default function App() {
  return (
    <RaceProvider>
      <DashboardContent />
    </RaceProvider>
  )
}
