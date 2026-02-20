import { useState } from 'react'
import { useRace } from '../context/RaceContext'

export default function LapHistory() {
    const { laps, invalidateLap, editLapTime, formatMs, activeRider } = useRace()
    const [editingId, setEditingId] = useState(null)
    const [editValue, setEditValue] = useState('')

    if (!activeRider) return null

    const handleEditStart = (lap) => {
        setEditingId(lap.id)
        // Convert ms to a human-readable format for editing
        const secs = (lap.lap_time_ms / 1000).toFixed(3)
        setEditValue(secs)
    }

    const handleEditSave = (lapId) => {
        const ms = Math.round(parseFloat(editValue) * 1000)
        if (isNaN(ms) || ms <= 0) return
        editLapTime(lapId, ms)
        setEditingId(null)
    }

    return (
        <div className="card">
            <div className="panel-title">
                🏁 Lap History
                <span style={{ float: 'right', fontWeight: 400, fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {laps.filter(l => l.valid !== false).length} valid lap{laps.filter(l => l.valid !== false).length !== 1 ? 's' : ''}
                </span>
            </div>

            {laps.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">⏱</div>
                    No laps recorded yet
                </div>
            ) : (
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Time</th>
                            <th>Status</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {laps.map((lap) => (
                            <tr key={lap.id} className={lap.valid === false ? 'lap-invalid' : ''}>
                                <td>{lap.lap_number}</td>
                                <td style={{ fontFamily: 'var(--font-mono)' }}>
                                    {editingId === lap.id ? (
                                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                            <input
                                                className="input"
                                                style={{ width: '80px', padding: '4px 6px', fontSize: '0.75rem' }}
                                                type="number"
                                                step="0.001"
                                                value={editValue}
                                                onChange={(e) => setEditValue(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleEditSave(lap.id)}
                                                autoFocus
                                            />
                                            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>sec</span>
                                        </div>
                                    ) : (
                                        formatMs(lap.lap_time_ms)
                                    )}
                                </td>
                                <td>
                                    {lap.valid === false ? (
                                        <span className="badge badge-cancelled">Invalid</span>
                                    ) : (
                                        <span className="badge badge-completed">Valid</span>
                                    )}
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                    {lap.valid !== false && (
                                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                                            {editingId === lap.id ? (
                                                <>
                                                    <button className="btn btn-success btn-sm" onClick={() => handleEditSave(lap.id)}>✓</button>
                                                    <button className="btn btn-ghost btn-sm" onClick={() => setEditingId(null)}>✕</button>
                                                </>
                                            ) : (
                                                <>
                                                    <button className="btn btn-ghost btn-sm" onClick={() => handleEditStart(lap)} title="Edit">✎</button>
                                                    <button className="btn btn-ghost btn-sm" onClick={() => invalidateLap(lap.id)} title="Invalidate" style={{ color: 'var(--accent-red)' }}>✕</button>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    )
}
