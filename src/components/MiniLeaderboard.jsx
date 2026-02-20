import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRace } from '../context/RaceContext'

export default function MiniLeaderboard() {
    const { formatMs, removeRider } = useRace()
    const [leaders, setLeaders] = useState([])

    const fetchLeaders = async () => {
        const { data } = await supabase
            .from('race_entries')
            .select('registration_id, best_lap_time_ms, rounds_completed, race_status, registrations!inner(full_name, enrollment_no, college)')
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
            }))
        )
    }

    useEffect(() => {
        fetchLeaders()
        // Subscribe to changes
        const channel = supabase
            .channel('leaderboard-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'race_entries' }, () => {
                fetchLeaders()
            })
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [])

    const getRankClass = (rank) => {
        if (rank === 1) return 'rank-badge rank-1'
        if (rank === 2) return 'rank-badge rank-2'
        if (rank === 3) return 'rank-badge rank-3'
        return 'rank-badge rank-default'
    }

    return (
        <div className="card" style={{ marginTop: '0.75rem' }}>
            <div className="panel-title">🏆 Leaderboard</div>

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
                            <tr key={l.enrollment_no || l.full_name}>
                                <td><span className={getRankClass(l.rank)}>{l.rank}</span></td>
                                <td>
                                    <div style={{ fontWeight: 600, fontSize: '0.8rem' }}>{l.full_name}</div>
                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{l.college}</div>
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
