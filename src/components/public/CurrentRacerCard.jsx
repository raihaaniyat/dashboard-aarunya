import { useState, useEffect } from 'react'

const formatTime = (ms) => {
    if (ms == null) return '00:00.000'
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    const millis = ms % 1000
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(millis).padStart(3, '0')}`
}

export default function CurrentRacerCard({ activeRacer, liveTimer }) {
    if (!activeRacer) {
        return (
            <div className="card" style={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px dashed var(--border-subtle)',
                background: 'transparent'
            }}>
                <div style={{
                    textAlign: 'center',
                    fontFamily: 'var(--font-heading)',
                    color: 'var(--text-muted)',
                    letterSpacing: '2px',
                    textTransform: 'uppercase'
                }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>🏎️</div>
                    <div>Track is clear</div>
                    <div style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>Next rider preparing...</div>
                </div>
            </div>
        )
    }

    return (
        <div style={{
            background: 'var(--gradient-primary)',
            borderRadius: 'var(--radius-xl)',
            padding: '2rem',
            color: '#fff',
            boxShadow: 'var(--shadow-card), 0 0 40px rgba(227, 24, 55, 0.3)',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
        }}>
            {/* Background Texture/Pattern */}
            <div style={{
                position: 'absolute',
                top: 0,
                right: 0,
                bottom: 0,
                left: 0,
                background: 'linear-gradient(45deg, transparent 48%, rgba(255,255,255,0.05) 50%, transparent 52%)',
                backgroundSize: '20px 20px',
                opacity: 0.5,
                zIndex: 0
            }} />

            {/* Content Container */}
            <div style={{ position: 'relative', zIndex: 1 }}>

                {/* Header Strip */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '2rem'
                }}>
                    <div style={{
                        background: '#000',
                        color: 'var(--accent-red)',
                        padding: '0.5rem 1rem',
                        borderRadius: 'var(--radius-sm)',
                        fontFamily: 'var(--font-heading)',
                        fontWeight: 900,
                        letterSpacing: '2px',
                        textTransform: 'uppercase',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        boxShadow: '0 0 15px rgba(0,0,0,0.5)'
                    }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-red)', animation: 'pulse 1s infinite' }} />
                        ON TRACK
                    </div>
                </div>

                {/* Racer Info */}
                <div style={{ marginBottom: '3rem' }}>
                    <div style={{
                        fontFamily: 'var(--font-heading)',
                        fontSize: '3rem',
                        fontWeight: 900,
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        lineHeight: 1.1,
                        marginBottom: '0.5rem',
                        textShadow: '0 4px 10px rgba(0,0,0,0.5)'
                    }}>
                        {activeRacer.full_name}
                    </div>
                    <div style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: '1.2rem',
                        fontWeight: 600,
                        opacity: 0.8,
                        letterSpacing: '1px',
                        textTransform: 'uppercase'
                    }}>
                        {activeRacer.college} • {activeRacer.enrollment_no}
                    </div>
                </div>

                {/* Progress & Live Timer */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '2rem' }}>

                    {/* Lap Count */}
                    <div>
                        <div style={{ fontSize: '0.9rem', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '0.5rem' }}>
                            Current Lap
                        </div>
                        <div style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', fontWeight: 900 }}>
                            {activeRacer.rounds_completed + 1} <span style={{ fontSize: '1.5rem', opacity: 0.5 }}>/ {activeRacer.total_rounds}</span>
                        </div>
                    </div>

                    {/* Timer */}
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.9rem', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '0.5rem' }}>
                            Lap Time
                        </div>
                        <div style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '3.5rem',
                            fontWeight: 900,
                            letterSpacing: '-2px',
                            textShadow: '0 0 30px rgba(255, 255, 255, 0.4)'
                        }}>
                            {formatTime(liveTimer)}
                        </div>
                    </div>

                </div>

            </div>
        </div>
    )
}
