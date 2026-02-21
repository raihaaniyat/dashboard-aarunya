import { useState, useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { RaceProvider, useRace } from './context/RaceContext'
import LeftPanel from './components/LeftPanel'
import CenterPanel from './components/CenterPanel'
import RightPanel from './components/RightPanel'
import useRealtimeQueue from './hooks/useRealtimeQueue'
import useRealtimeLaps from './hooks/useRealtimeLaps'
import PublicLeaderboard from './pages/PublicLeaderboard'

// ── Admin Dashboard Content ──
function DashboardContent({ onLogout }) {
  useRealtimeQueue()
  useRealtimeLaps()

  const { toast } = useRace()

  return (
    <>
      {/* Header */}
      <header className="dashboard-header">
        <h1>Drift X Karting 2.0</h1>
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

// ── Admin Password Gate ──
function AdminGate({ children }) {
  const [authed, setAuthed] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  const adminUsername = import.meta.env.VITE_ADMIN_USERNAME || 'admin-scavengers'
  const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD || 'admin@scavengers123'
  const isBypass = import.meta.env.VITE_BYPASS_AUTH === 'true'

  useEffect(() => {
    // Check sessionStorage for admin auth
    if (sessionStorage.getItem('admin_authed') === 'true') {
      setAuthed(true)
    }
    // Check Supabase session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (username === adminUsername && password === adminPassword) {
      sessionStorage.setItem('admin_authed', 'true')
      setAuthed(true)
      setError('')
    } else {
      setError('Incorrect username or password')
    }
  }

  const handleLogout = async () => {
    sessionStorage.removeItem('admin_authed')
    setAuthed(false)
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

  // Allow access if: bypass mode, or password matches, or supabase session
  if (isBypass || authed || session) {
    return (
      <RaceProvider>
        <DashboardContent onLogout={handleLogout} />
      </RaceProvider>
    )
  }

  // Password login screen
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-primary)',
    }}>
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '2.5rem',
        width: '100%',
        maxWidth: '380px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🏎️</div>
        <h2 style={{
          fontSize: '1.3rem',
          fontWeight: 800,
          background: 'linear-gradient(135deg, #6366f1, #3b82f6)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '0.25rem',
        }}>
          Admin Access
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1.5rem' }}>
          Drift X Karting 2.0 Race Control
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              background: 'var(--bg-input)',
              border: error ? '1px solid var(--accent-red)' : '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
              outline: 'none',
              marginBottom: '0.5rem',
            }}
            autoFocus
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              background: 'var(--bg-input)',
              border: error ? '1px solid var(--accent-red)' : '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
              outline: 'none',
              marginBottom: '0.75rem',
            }}
          />
          {error && (
            <div style={{ color: 'var(--accent-red)', fontSize: '0.75rem', marginBottom: '0.5rem' }}>
              {error}
            </div>
          )}
          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.75rem', fontSize: '0.85rem' }}
          >
            Enter Dashboard
          </button>
        </form>

        <a
          href="/"
          style={{
            display: 'block',
            marginTop: '1rem',
            color: 'var(--text-muted)',
            fontSize: '0.75rem',
            textDecoration: 'none',
          }}
        >
          ← Back to Live Leaderboard
        </a>
      </div>
    </div>
  )
}

// ── Main App with Routes ──
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicLeaderboard />} />
      <Route path="/admin" element={<AdminGate />} />
    </Routes>
  )
}
