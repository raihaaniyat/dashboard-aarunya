import ActiveRiderCard from './ActiveRiderCard'

export default function CenterPanel() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, minWidth: 0 }}>
            <ActiveRiderCard />
        </div>
    )
}
