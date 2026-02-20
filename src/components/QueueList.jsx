import { useEffect } from 'react'
import { useRace } from '../context/RaceContext'

export default function QueueList() {
    const { queue, fetchQueue, markReady, selectRider, cancelRider } = useRace()

    useEffect(() => {
        fetchQueue()
    }, [fetchQueue])

    return (
        <div className="card" style={{ marginTop: '0.75rem' }}>
            <div className="panel-title">
                📋 Queue
                <span style={{ float: 'right', fontWeight: 400, fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {queue.length} rider{queue.length !== 1 ? 's' : ''}
                </span>
            </div>

            {queue.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">🏁</div>
                    No riders in queue
                </div>
            ) : (
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {queue.map((rider) => (
                        <div className="queue-item" key={rider.registration_id}>
                            <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => selectRider(rider.registration_id)}>
                                <div className="rider-name">{rider.full_name}</div>
                                <div className="rider-college">{rider.college} {rider.enrollment_no ? `• ${rider.enrollment_no}` : ''}</div>
                                <span className={`badge badge-${rider.race_status}`}>{rider.race_status}</span>
                            </div>
                            <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                                {rider.race_status === 'queued' && (
                                    <button className="btn btn-success btn-sm" onClick={() => markReady(rider.registration_id)} title="Mark Ready">
                                        ✓
                                    </button>
                                )}
                                {rider.race_status === 'ready' && (
                                    <button className="btn btn-primary btn-sm" onClick={() => selectRider(rider.registration_id)} title="Select">
                                        ▶
                                    </button>
                                )}
                                <button className="btn btn-ghost btn-sm" onClick={() => cancelRider(rider.registration_id)} title="Cancel">
                                    ✕
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
