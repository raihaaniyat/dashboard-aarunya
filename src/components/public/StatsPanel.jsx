import { useState, useEffect } from 'react'

const formatMs = (ms) => {
    if (ms == null) return '--'
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    const millis = ms % 1000
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(millis).padStart(3, '0')}`
}

export default function StatsPanel({ stats }) {
    const { fastestOfDday, totalParticipants, totalLaps, avgOverall } = stats

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', height: '100%' }}>

            {/* Box 1: Fastest of the Day */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', background: 'linear-gradient(135deg, rgba(227, 24, 55, 0.1), rgba(227, 24, 55, 0))' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '0.5rem' }}>
                    Fastest of the Day
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '2rem', fontWeight: 900, color: 'var(--accent-red)', textShadow: 'var(--shadow-glow-red)' }}>
                    {formatMs(fastestOfDday)}
                </div>
            </div>

            {/* Box 2: Total Participants */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '0.5rem' }}>
                    Total Racers
                </div>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                    {totalParticipants}
                </div>
            </div>

            {/* Box 3: Total Laps */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '0.5rem' }}>
                    Total Laps Driven
                </div>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                    {totalLaps}
                </div>
            </div>

            {/* Box 4: Average Overall */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '0.5rem' }}>
                    Avg Track Time
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-secondary)' }}>
                    {formatMs(avgOverall)}
                </div>
            </div>

        </div>
    )
}
