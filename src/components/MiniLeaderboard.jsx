import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useRace } from '../context/RaceContext'
import { getRaceDay, TOTAL_DAYS } from '../lib/raceDay'

export default function MiniLeaderboard() {
    const { formatMs, removeRider } = useRace()
    const [leaders, setLeaders] = useState([])
    const [selectedDay, setSelectedDay] = useState(0) // 0 = All Days

    const fetchLeaders = useCallback(async () => {
        let query = supabase
            .from('race_entries')
            .select('registration_id, best_lap_time_ms, rounds_completed, race_status, race_day, registrations!inner(full_name, enrollment_no, college)')
        if (selectedDay > 0) query = query.eq('race_day', selectedDay)
        const { data } = await query
            .not('best_lap_time_ms', 'is', null)
            .order('best_lap_time_ms', { ascending: true })
        setLeaders(
            (data || []).map((d, i) => ({
                rank: i + 1,
                registration_id: d.registration_id,
                full_name: d.registrations.full_name,
                enrollment_no: d.registrations.enrollment_no,
                college: d.registrations.college,
                best_lap_time_ms: d.best_lap_time_ms,
                rounds_completed: d.rounds_completed,
                race_status: d.race_status,
                race_day: d.race_day,
            }))
        )
    }, [selectedDay])

    useEffect(() => {
        fetchLeaders()
        const channel = supabase
            .channel('leaderboard-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'race_entries' }, () => {
                fetchLeaders()
            })
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [fetchLeaders])

    const getRankClass = (rank) => {
        if (rank === 1) return 'rank-badge rank-1'
        if (rank === 2) return 'rank-badge rank-2'
        if (rank === 3) return 'rank-badge rank-3'
        return 'rank-badge rank-default'
    }

    return (
        <div className="card" style={{ marginTop: '0.75rem' }}>
            <div className="panel-title">🏆 Leaderboard — {selectedDay === 0 ? 'All Days' : `Day ${selectedDay}`}</div>

            {/* Day selector */}
            <div style={{ display: 'flex', gap: '4px', padding: '0 0.5rem 0.5rem', flexWrap: 'wrap' }}>
                {[0, ...Array.from({ length: TOTAL_DAYS }, (_, i) => i + 1)].map(day => (
                    <button
                        key={day}
                        onClick={() => setSelectedDay(day)}
                        style={{
                            padding: '3px 10px',
                            fontSize: '0.65rem',
                            fontWeight: selectedDay === day ? 700 : 500,
                            border: selectedDay === day ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                            borderRadius: '12px',
                            background: selectedDay === day ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                            color: selectedDay === day ? 'var(--accent-cyan)' : 'var(--text-muted)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                        }}
                    >
                        {day === 0 ? 'All' : `D${day}`}
                    </button>
                ))}
            </div>

            {leaders.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">🏆</div>
                    No times recorded yet
                </div>
            ) : (
                <table className="data-table">
                    <thead>
                        <tr>
                            <th style={{ width: '36px' }}>#</th>
                            <th>Rider</th>
                            <th style={{ textAlign: 'center' }}>Laps</th>
                            <th>Best</th>
                            <th style={{ width: '36px' }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {leaders.map((l) => (
                            <tr key={`${l.enrollment_no || l.full_name}-${l.race_day}`}>
                                <td><span className={getRankClass(l.rank)}>{l.rank}</span></td>
                                <td>
                                    <div style={{ fontWeight: 600, fontSize: '0.8rem' }}>{l.full_name}</div>
                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                                        {l.college}{selectedDay === 0 ? ` · D${l.race_day}` : ''}
                                    </div>
                                </td>
                                <td style={{ textAlign: 'center', fontWeight: 600 }}>{l.rounds_completed}</td>
                                <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--accent-cyan)' }}>
                                    {formatMs(l.best_lap_time_ms)}
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                    <button
                                        onClick={() => {
                                            if (window.confirm('Delete this rider from the leaderboard?')) {
                                                removeRider(l.registration_id)
                                            }
                                        }}
                                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                                        title="Remove Rider"
                                    >
                                        🗑️
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    )
}
