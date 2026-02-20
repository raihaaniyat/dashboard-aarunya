import QRScanner from './QRScanner'
import ManualSearch from './ManualSearch'
import QueueList from './QueueList'

export default function LeftPanel() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, minWidth: 0 }}>
            <QRScanner />
            <ManualSearch />
            <QueueList />
        </div>
    )
}
