import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import { RaceProvider, useRace } from './context/RaceContext'
import LeftPanel from './components/LeftPanel'
import CenterPanel from './components/CenterPanel'
import RightPanel from './components/RightPanel'
import Login from './components/Login'
import useRealtimeQueue from './hooks/useRealtimeQueue'
import useRealtimeLaps from './hooks/useRealtimeLaps'

function DashboardContent({ onLogout }) {
  useRealtimeQueue()
  useRealtimeLaps()

  const { toast } = useRace()

  return (
    <>
      {/* Header */}
      <header className="dashboard-header">
        <h1>Drift X Karting 2026</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Race Control</span>
          <div className="status-dot" />
          <button
            className="btn btn-ghost btn-sm"
            onClick={onLogout}
            style={{ padding: '4px 10px', fontSize: '0.7rem' }}
          >
            Logout
          </button>
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
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setSession(null)
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading...</div>
      </div>
    )
  }

  if (!session) {
    return <Login onLogin={setSession} />
  }

  return (
    <RaceProvider>
      <DashboardContent onLogout={handleLogout} />
    </RaceProvider>
  )
}
