import LapHistory from './LapHistory'
import MiniLeaderboard from './MiniLeaderboard'
import AdminControls from './AdminControls'

export default function RightPanel() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, minWidth: 0 }}>
            <LapHistory />
            <MiniLeaderboard />
            <AdminControls />
        </div>
    )
}
