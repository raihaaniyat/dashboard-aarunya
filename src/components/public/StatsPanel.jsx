import { useState, useEffect } from 'react'

const formatMs = (ms) => {
    if (ms == null) return '--'
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    const millis = ms % 1000
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(millis).padStart(3, '0')}`
}

export default function StatsPanel({ stats, dayLabel }) {
    const { fastestOfDday, totalParticipants, totalLaps, avgOverall } = stats

    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '1rem',
            height: '100%'
        }}>
            {/* Box 1: Fastest of the Day */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', background: 'linear-gradient(135deg, rgba(227, 24, 55, 0.1), rgba(227, 24, 55, 0))', padding: '1.5rem 1rem' }}>
                <div style={{ fontSize: 'clamp(0.6rem, 1.5vw, 0.8rem)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '0.5rem' }}>
                    Fastest Day {dayLabel || ''}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 900, color: 'var(--accent-red)', textShadow: 'var(--shadow-glow-red)' }}>
                    {formatMs(fastestOfDday)}
                </div>
            </div>

            {/* Box 2: Total Participants */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '1.5rem 1rem' }}>
                <div style={{ fontSize: 'clamp(0.6rem, 1.5vw, 0.8rem)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '0.5rem' }}>
                    Total Racers
                </div>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 900, color: 'var(--text-primary)' }}>
                    {totalParticipants}
                </div>
            </div>

            {/* Box 3: Total Laps */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '1.5rem 1rem' }}>
                <div style={{ fontSize: 'clamp(0.6rem, 1.5vw, 0.8rem)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '0.5rem' }}>
                    Total Laps
                </div>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 900, color: 'var(--text-primary)' }}>
                    {totalLaps}
                </div>
            </div>

            {/* Box 4: Average Overall */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '1.5rem 1rem' }}>
                <div style={{ fontSize: 'clamp(0.6rem, 1.5vw, 0.8rem)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '0.5rem' }}>
                    Avg Track Time
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'clamp(1.2rem, 2.5vw, 1.8rem)', fontWeight: 900, color: 'var(--text-secondary)' }}>
                    {formatMs(avgOverall)}
                </div>
            </div>

        </div>
    )
}
