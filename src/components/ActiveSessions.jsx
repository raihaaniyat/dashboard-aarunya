import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRace } from '../context/RaceContext'
import { getRaceDay } from '../lib/raceDay'

export default function ActiveSessions() {
    const { removeRider, cancelRider, showToast } = useRace()
    const [sessions, setSessions] = useState([])

    const fetchSessions = async () => {
        const { data, error } = await supabase
            .from('race_entries')
            .select('registration_id, race_status, race_day, queued_at, race_started_at, registrations!inner(full_name, enrollment_no, college)')
            .in('race_status', ['racing', 'queued', 'ready'])
            .order('race_started_at', { ascending: false, nullsFirst: false })

        if (error) {
            console.error('fetchSessions error:', error)
            return
        }
        setSessions(data || [])
    }

    useEffect(() => {
        fetchSessions()

        const channel = supabase
            .channel('active-sessions')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'race_entries' }, () => {
                fetchSessions()
            })
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [])

    const forceRemove = async (registrationId, raceDay) => {
        // Delete laps for this entry
        await supabase.from('laps').delete()
            .eq('registration_id', registrationId)
            .eq('race_day', raceDay)
        // Delete the race entry
        const { error } = await supabase.from('race_entries').delete()
            .eq('registration_id', registrationId)
            .eq('race_day', raceDay)
        if (error) {
            showToast('Failed to remove: ' + error.message)
            return
        }
        showToast('Session force-removed', 'success')
        fetchSessions()
    }

    const forceComplete = async (registrationId, raceDay) => {
        const { error } = await supabase.from('race_entries')
            .update({ race_status: 'completed', race_completed_at: new Date().toISOString() })
            .eq('registration_id', registrationId)
            .eq('race_day', raceDay)
        if (error) {
            showToast('Failed to complete: ' + error.message)
            return
        }
        showToast('Session force-completed', 'success')
        fetchSessions()
    }

    const getStatusColor = (status) => {
        if (status === 'racing') return '#22c55e'
        if (status === 'ready') return '#f59e0b'
        return '#818cf8'
    }

    const getStatusEmoji = (status) => {
        if (status === 'racing') return '🏎️'
        if (status === 'ready') return '🟡'
        return '🔵'
    }

    return (
        <div className="card" style={{ marginTop: '0.75rem' }}>
            <div className="panel-title">🔴 Active Sessions ({sessions.length})</div>

            {sessions.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">✅</div>
                    No active sessions
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {sessions.map((s) => (
                        <div
                            key={`${s.registration_id}-${s.race_day}`}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '8px 10px',
                                background: 'var(--bg-input)',
                                border: '1px solid var(--border-subtle)',
                                borderRadius: 'var(--radius-md)',
                                borderLeft: `3px solid ${getStatusColor(s.race_status)}`,
                            }}
                        >
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                                    {getStatusEmoji(s.race_status)} {s.registrations.full_name}
                                </div>
                                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                                    {s.registrations.college} · Day {s.race_day} · <span style={{ color: getStatusColor(s.race_status), fontWeight: 600 }}>{s.race_status.toUpperCase()}</span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                                <button
                                    onClick={() => {
                                        if (window.confirm(`Force-complete ${s.registrations.full_name}?`)) {
                                            forceComplete(s.registration_id, s.race_day)
                                        }
                                    }}
                                    style={{
                                        background: 'none', border: 'none', cursor: 'pointer',
                                        fontSize: '0.85rem', padding: '4px', color: '#3b82f6'
                                    }}
                                    title="Force Complete"
                                >✅</button>
                                <button
                                    onClick={() => {
                                        if (window.confirm(`Force-remove ${s.registrations.full_name}? This deletes all their laps for Day ${s.race_day}.`)) {
                                            forceRemove(s.registration_id, s.race_day)
                                        }
                                    }}
                                    style={{
                                        background: 'none', border: 'none', cursor: 'pointer',
                                        fontSize: '0.85rem', padding: '4px', color: '#ef4444'
                                    }}
                                    title="Force Remove (delete entry + laps)"
                                >🗑️</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
