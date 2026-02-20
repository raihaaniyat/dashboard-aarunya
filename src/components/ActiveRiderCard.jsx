import { useRace } from '../context/RaceContext'
import Stopwatch from './Stopwatch'

export default function ActiveRiderCard() {
    const {
        activeRider,
        startLap,
        stopLap,
        resetLastLap,
        disqualifyRider,
        formatMs,
        stopwatchRef,
    } = useRace()

    if (!activeRider) {
        return (
            <div className="card" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="empty-state">
                    <div className="empty-icon">🏎️</div>
                    <p>Select a rider from the queue to begin</p>
                </div>
            </div>
        )
    }

    const { raceEntry } = activeRider
    const isRacing = raceEntry.race_status === 'racing'
    const isReady = raceEntry.race_status === 'ready'
    const isCompleted = raceEntry.race_status === 'completed'
    const isQueued = raceEntry.race_status === 'queued'

    return (
        <div className="card">
            {/* Rider hero */}
            <div className="rider-hero">
                <span className={`badge badge-${raceEntry.race_status}`} style={{ marginBottom: '0.5rem' }}>
                    {raceEntry.race_status}
                </span>
                <div className="rider-name-lg">{activeRider.full_name}</div>
                <div className="rider-detail">
                    {activeRider.enrollment_no || 'N/A'} • {activeRider.college}
                </div>
                <div className="rider-detail" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {activeRider.registration_id_human}
                </div>
            </div>

            {/* Stats */}
            <div className="stat-grid">
                <div className="stat-item">
                    <div className="stat-label">Rounds</div>
                    <div className="stat-value">
                        {raceEntry.rounds_completed}/{activeRider.rounds || 1}
                    </div>
                </div>
                <div className="stat-item">
                    <div className="stat-label">Best Lap</div>
                    <div className="stat-value" style={{ color: raceEntry.best_lap_time_ms ? 'var(--accent-green)' : undefined }}>
                        {formatMs(raceEntry.best_lap_time_ms)}
                    </div>
                </div>
                <div className="stat-item">
                    <div className="stat-label">Avg Lap</div>
                    <div className="stat-value">
                        {formatMs(raceEntry.average_lap_time_ms)}
                    </div>
                </div>
            </div>

            {/* Stopwatch */}
            <Stopwatch />

            {/* Controls */}
            <div className="controls-bar">
                {(isReady || isQueued) && (
                    <button className="btn btn-success" onClick={startLap}>
                        ▶ Start Lap
                    </button>
                )}
                {isRacing && (
                    <>
                        <button className="btn btn-danger" onClick={stopLap}>
                            ⏹ Stop Lap
                        </button>
                        <button className="btn btn-ghost btn-sm" onClick={resetLastLap}>
                            ↩ Reset Last
                        </button>
                    </>
                )}
                {isCompleted && (
                    <div style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--accent-green)', fontWeight: 600 }}>
                        🏁 Race Completed
                    </div>
                )}
                {(isRacing || isReady || isQueued) && (
                    <button className="btn btn-ghost btn-sm" onClick={disqualifyRider} style={{ color: 'var(--accent-red)' }}>
                        ⚠ Disqualify
                    </button>
                )}
            </div>
        </div>
    )
}
