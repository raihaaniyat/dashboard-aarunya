import ActiveRiderCard from './ActiveRiderCard'
import Stopwatch from './Stopwatch'
import { useRace } from '../context/RaceContext'

export default function CenterPanel() {
    const { activeRider } = useRace()

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', minWidth: 0 }}>
            {/* Always-visible stopwatch at the top */}
            {!activeRider && (
                <div className="card" style={{ textAlign: 'center' }}>
                    <div className="panel-title">⏱ Stopwatch</div>
                    <Stopwatch />
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                        Select a rider to start timing
                    </p>
                </div>
            )}
            <ActiveRiderCard />
        </div>
    )
}
