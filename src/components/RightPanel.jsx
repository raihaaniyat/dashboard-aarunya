import LapHistory from './LapHistory'
import MiniLeaderboard from './MiniLeaderboard'
import ActiveSessions from './ActiveSessions'
import AdminControls from './AdminControls'

export default function RightPanel() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, minWidth: 0 }}>
            <LapHistory />
            <MiniLeaderboard />
            <ActiveSessions />
            <AdminControls />
        </div>
    )
}
