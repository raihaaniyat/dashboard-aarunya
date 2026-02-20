import { useState } from 'react'
import { useRace } from '../context/RaceContext'

export default function AdminControls() {
    const { resetLeaderboard, clearQueue } = useRace()
    const [confirmReset, setConfirmReset] = useState(false)
    const [confirmClear, setConfirmClear] = useState(false)

    const handleReset = async () => {
        if (!confirmReset) {
            setConfirmReset(true)
            setTimeout(() => setConfirmReset(false), 3000)
            return
        }
        await resetLeaderboard()
        setConfirmReset(false)
    }

    const handleClear = async () => {
        if (!confirmClear) {
            setConfirmClear(true)
            setTimeout(() => setConfirmClear(false), 3000)
            return
        }
        await clearQueue()
        setConfirmClear(false)
    }

    return (
        <div className="card" style={{ marginTop: '0.75rem' }}>
            <div className="panel-title">⚙️ Admin Controls</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.25rem 0' }}>
                <button
                    className={confirmClear ? 'btn btn-danger' : 'btn btn-secondary'}
                    onClick={handleClear}
                    style={{ width: '100%', fontSize: '0.8rem', padding: '0.5rem' }}
                >
                    {confirmClear ? '⚠️ Confirm Clear Queue?' : '🗑️ Clear Queue'}
                </button>

                <button
                    className={confirmReset ? 'btn btn-danger' : 'btn btn-secondary'}
                    onClick={handleReset}
                    style={{ width: '100%', fontSize: '0.8rem', padding: '0.5rem' }}
                >
                    {confirmReset ? '⚠️ CONFIRM RESET ALL?' : '🔄 Reset Leaderboard'}
                </button>
            </div>

            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.25rem', textAlign: 'center' }}>
                Click twice to confirm destructive actions
            </div>
        </div>
    )
}
