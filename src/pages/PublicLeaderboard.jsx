import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const formatMs = (ms) => {
    if (ms == null) return '--'
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    const millis = ms % 1000
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(millis).padStart(3, '0')}`
}

export default function PublicLeaderboard() {
    const [leaders, setLeaders] = useState([])
    const [lastUpdated, setLastUpdated] = useState(new Date())
    const [activeRacer, setActiveRacer] = useState(null)

    const fetchLeaders = useCallback(async () => {
        const { data } = await supabase
            .from('race_entries')
            .select('registration_id, best_lap_time_ms, rounds_completed, race_status, registrations!inner(full_name, enrollment_no, college, rounds)')
            .not('best_lap_time_ms', 'is', null)
            .order('best_lap_time_ms', { ascending: true })
            .limit(20)

        setLeaders(
            (data || []).map((d, i) => ({
                rank: i + 1,
                full_name: d.registrations.full_name,
                enrollment_no: d.registrations.enrollment_no,
                college: d.registrations.college,
                best_lap_time_ms: d.best_lap_time_ms,
                rounds_completed: d.rounds_completed,
                total_rounds: d.registrations.rounds || 1,
                race_status: d.race_status,
            }))
        )
        setLastUpdated(new Date())
    }, [])

    const fetchActiveRacer = useCallback(async () => {
        const { data } = await supabase
            .from('race_entries')
            .select('registration_id, race_status, registrations!inner(full_name, college)')
            .eq('race_status', 'racing')
            .limit(1)
            .maybeSingle()

        setActiveRacer(data ? {
            full_name: data.registrations.full_name,
            college: data.registrations.college,
        } : null)
    }, [])

    useEffect(() => {
        fetchLeaders()
        fetchActiveRacer()

        const channel = supabase
            .channel('public-leaderboard')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'race_entries' }, () => {
                fetchLeaders()
                fetchActiveRacer()
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'laps' }, () => {
                fetchLeaders()
            })
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [fetchLeaders, fetchActiveRacer])

    const getRankStyle = (rank) => {
        if (rank === 1) return { background: 'linear-gradient(135deg, #ffd700, #ffaa00)', color: '#000', fontWeight: 800 }
        if (rank === 2) return { background: 'linear-gradient(135deg, #c0c0c0, #a0a0a0)', color: '#000', fontWeight: 700 }
        if (rank === 3) return { background: 'linear-gradient(135deg, #cd7f32, #a0622e)', color: '#fff', fontWeight: 700 }
        return { background: 'var(--bg-card)', color: 'var(--text-muted)', fontWeight: 600 }
    }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: 'clamp(1rem, 3vw, 2rem)' }}>
            {/* Header */}
            <header style={{
                textAlign: 'center',
                marginBottom: 'clamp(1rem, 3vw, 2rem)',
                padding: 'clamp(1rem, 2vw, 1.5rem)',
            }}>
                <div style={{
                    fontSize: 'clamp(0.7rem, 1.5vw, 0.9rem)',
                    color: 'var(--accent-cyan)',
                    textTransform: 'uppercase',
                    letterSpacing: '3px',
                    fontWeight: 600,
                    marginBottom: '0.25rem',
                }}>
                    Aarunya 2026 Presents
                </div>
                <h1 style={{
                    fontSize: 'clamp(2rem, 5vw, 4rem)',
                    fontWeight: 900,
                    background: 'linear-gradient(135deg, #6366f1, #3b82f6, #06b6d4)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    letterSpacing: '-1px',
                    lineHeight: 1.1,
                }}>
                    DRIFT X KARTING
                </h1>
                <div style={{
                    fontSize: 'clamp(0.7rem, 1.2vw, 0.85rem)',
                    color: 'var(--text-muted)',
                    marginTop: '0.5rem',
                }}>
                    Live Leaderboard • Updated {lastUpdated.toLocaleTimeString()}
                </div>
            </header>

            {/* Active Racer Banner */}
            {activeRacer && (
                <div style={{
                    background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(249, 115, 22, 0.15))',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'clamp(0.75rem, 2vw, 1.25rem)',
                    textAlign: 'center',
                    marginBottom: 'clamp(1rem, 2vw, 1.5rem)',
                    animation: 'pulse-glow 2s ease-in-out infinite',
                }}>
                    <div style={{ fontSize: 'clamp(0.65rem, 1vw, 0.75rem)', color: '#ef4444', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 700 }}>
                        🏎️ Currently Racing
                    </div>
                    <div style={{ fontSize: 'clamp(1.2rem, 3vw, 2rem)', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                        {activeRacer.full_name}
                    </div>
                    <div style={{ fontSize: 'clamp(0.65rem, 1vw, 0.8rem)', color: 'var(--text-secondary)' }}>
                        {activeRacer.college}
                    </div>
                </div>
            )}

            {/* Leaderboard Table */}
            {leaders.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: 'clamp(3rem, 8vw, 6rem)',
                    color: 'var(--text-muted)',
                }}>
                    <div style={{ fontSize: 'clamp(3rem, 8vw, 6rem)', marginBottom: '1rem' }}>🏁</div>
                    <div style={{ fontSize: 'clamp(1rem, 2.5vw, 1.5rem)', fontWeight: 600 }}>
                        Race hasn't started yet
                    </div>
                    <div style={{ fontSize: 'clamp(0.75rem, 1.5vw, 1rem)', marginTop: '0.5rem' }}>
                        Times will appear here in real-time
                    </div>
                </div>
            ) : (
                <div style={{
                    maxWidth: '900px',
                    margin: '0 auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'clamp(0.4rem, 1vw, 0.6rem)',
                }}>
                    {leaders.map((l) => (
                        <div
                            key={l.enrollment_no || l.full_name}
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'clamp(40px, 6vw, 56px) 1fr auto',
                                alignItems: 'center',
                                gap: 'clamp(0.5rem, 1.5vw, 1rem)',
                                background: l.rank <= 3
                                    ? `linear-gradient(135deg, ${l.rank === 1 ? 'rgba(255, 215, 0, 0.08)' : l.rank === 2 ? 'rgba(192, 192, 192, 0.08)' : 'rgba(205, 127, 50, 0.08)'}, transparent)`
                                    : 'var(--bg-card)',
                                border: l.rank <= 3
                                    ? `1px solid ${l.rank === 1 ? 'rgba(255, 215, 0, 0.2)' : l.rank === 2 ? 'rgba(192, 192, 192, 0.2)' : 'rgba(205, 127, 50, 0.2)'}`
                                    : '1px solid var(--border-subtle)',
                                borderRadius: 'var(--radius-md)',
                                padding: 'clamp(0.6rem, 1.5vw, 1rem) clamp(0.75rem, 2vw, 1.25rem)',
                                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                            }}
                        >
                            {/* Rank */}
                            <div style={{
                                ...getRankStyle(l.rank),
                                width: 'clamp(32px, 5vw, 44px)',
                                height: 'clamp(32px, 5vw, 44px)',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 'clamp(0.8rem, 1.5vw, 1.1rem)',
                            }}>
                                {l.rank <= 3 ? ['🥇', '🥈', '🥉'][l.rank - 1] : l.rank}
                            </div>

                            {/* Name & College */}
                            <div>
                                <div style={{
                                    fontWeight: 700,
                                    fontSize: 'clamp(0.9rem, 2vw, 1.2rem)',
                                    color: 'var(--text-primary)',
                                }}>
                                    {l.full_name}
                                </div>
                                <div style={{
                                    fontSize: 'clamp(0.6rem, 1vw, 0.8rem)',
                                    color: 'var(--text-muted)',
                                    display: 'flex',
                                    gap: '0.75rem',
                                    flexWrap: 'wrap',
                                }}>
                                    <span>{l.college}</span>
                                    <span>•</span>
                                    <span>{l.rounds_completed}/{l.total_rounds} rounds</span>
                                </div>
                            </div>

                            {/* Best Lap Time */}
                            <div style={{
                                fontFamily: 'var(--font-mono)',
                                fontSize: 'clamp(1rem, 2.5vw, 1.6rem)',
                                fontWeight: 800,
                                color: l.rank === 1 ? '#ffd700' : l.rank === 2 ? '#c0c0c0' : l.rank === 3 ? '#cd7f32' : 'var(--accent-cyan)',
                                textAlign: 'right',
                                whiteSpace: 'nowrap',
                            }}>
                                {formatMs(l.best_lap_time_ms)}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Footer */}
            <footer style={{
                textAlign: 'center',
                marginTop: 'clamp(2rem, 4vw, 3rem)',
                padding: '1rem',
                fontSize: 'clamp(0.6rem, 1vw, 0.75rem)',
                color: 'var(--text-muted)',
            }}>
                Powered by Aarunya • MITS Gwalior • Live updates every second
            </footer>

            {/* Pulse animation for active racer */}
            <style>{`
                @keyframes pulse-glow {
                    0%, 100% { box-shadow: 0 0 15px rgba(239, 68, 68, 0.1); }
                    50% { box-shadow: 0 0 30px rgba(239, 68, 68, 0.25); }
                }
            `}</style>
        </div>
    )
}
