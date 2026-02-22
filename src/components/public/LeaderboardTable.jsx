import { useState, useEffect } from 'react'

const formatMs = (ms) => {
    if (ms == null) return '--'
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    const millis = ms % 1000
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(millis).padStart(3, '0')}`
}

export default function LeaderboardTable({ leaders }) {
    // Top 3 distinct styling
    const getRowStyle = (rank) => {
        if (rank === 1) return { background: 'var(--gradient-gold)', color: '#000', transform: 'scale(1.02)' }
        if (rank === 2) return { background: 'var(--gradient-silver)', color: '#000', transform: 'scale(1.01)' }
        if (rank === 3) return { background: 'var(--gradient-bronze)', color: '#fff', transform: 'scale(1.005)' }
        return { background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }
    }

    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', zIndex: 10, overflowX: 'auto' }}>
            {/* Scrollable Container for Mobile */}
            <div style={{ minWidth: '600px', display: 'flex', flexDirection: 'column', gap: '8px' }}>

                {/* Table Header */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '80px 1fr 1fr 80px 150px 150px',
                    padding: '1rem 1.5rem',
                    fontFamily: 'var(--font-heading)',
                    fontSize: '0.9rem',
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '2px',
                    borderBottom: '2px solid var(--border-subtle)',
                    marginBottom: '0.5rem'
                }}>
                    <div>Rk</div>
                    <div>Rider</div>
                    <div>College</div>
                    <div style={{ textAlign: 'center' }}>Laps</div>
                    <div style={{ textAlign: 'right' }}>Avg Lap</div>
                    <div style={{ textAlign: 'right', color: 'var(--accent-red)' }}>Best Lap</div>
                </div>

                {/* Table Rows */}
                {leaders.length === 0 ? (
                    <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🏁</div>
                        <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', letterSpacing: '2px' }}>AWAITING RACERS</div>
                    </div>
                ) : (
                    leaders.map((l) => (
                        <div
                            key={l.enrollment_no || l.full_name}
                            style={{
                                display: 'grid',
                                gridTemplateColumns: '80px 1fr 1fr 80px 150px 150px',
                                alignItems: 'center',
                                padding: '1.25rem 1.5rem',
                                borderRadius: 'var(--radius-md)',
                                ...getRowStyle(l.rank),
                                boxShadow: l.rank <= 3 ? '0 4px 15px rgba(0,0,0,0.15)' : 'none',
                                border: l.rank > 3 ? '1px solid var(--border-subtle)' : 'none',
                                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                        >
                            {/* Rank Badge */}
                            <div style={{
                                fontFamily: 'var(--font-heading)',
                                fontSize: l.rank <= 3 ? '1.8rem' : '1.4rem',
                                fontWeight: 900,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}>
                                {l.rank === 1 ? '🥇' : l.rank === 2 ? '🥈' : l.rank === 3 ? '🥉' : ''} {l.rank}
                            </div>

                            {/* Name */}
                            <div style={{
                                fontSize: '1.2rem',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '1px'
                            }}>
                                {l.full_name}
                            </div>

                            {/* College */}
                            <div style={{
                                fontSize: '0.9rem',
                                opacity: l.rank <= 3 ? 0.8 : 0.6,
                                textTransform: 'uppercase'
                            }}>
                                {l.college}
                            </div>

                            {/* Laps */}
                            <div style={{
                                fontFamily: 'var(--font-heading)',
                                fontSize: '1.2rem',
                                textAlign: 'center',
                                opacity: 0.9,
                                fontWeight: 700
                            }}>
                                {l.rounds_completed}
                            </div>

                            {/* Avg Lap */}
                            <div style={{
                                fontFamily: 'var(--font-mono)',
                                fontSize: '1.1rem',
                                textAlign: 'right',
                                opacity: 0.8
                            }}>
                                {formatMs(l.average_lap_time_ms)}
                            </div>

                            {/* Best Lap */}
                            <div style={{
                                fontFamily: 'var(--font-mono)',
                                fontSize: l.rank <= 3 ? '1.5rem' : '1.3rem',
                                fontWeight: 900,
                                textAlign: 'right',
                                textShadow: 'none',
                                color: l.rank > 3 ? 'var(--accent-red)' : 'inherit'
                            }}>
                                {formatMs(l.best_lap_time_ms)}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
