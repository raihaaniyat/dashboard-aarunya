import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function Header() {
    const [currentTime, setCurrentTime] = useState(new Date())
    const [status, setStatus] = useState('OFFLINE') // 'OFFLINE', 'LIVE', 'PAUSED'

    useEffect(() => {
        // Clock tick
        const timer = setInterval(() => setCurrentTime(new Date()), 1000)

        // Subscription check based on race_entries
        const checkStatus = async () => {
            const { count } = await supabase
                .from('race_entries')
                .select('*', { count: 'exact', head: true })
                .eq('race_status', 'racing')

            setStatus(count > 0 ? 'LIVE' : 'STANDBY')
        }

        checkStatus()

        const channel = supabase
            .channel('header-status')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'race_entries' }, () => {
                checkStatus()
            })
            .subscribe()

        return () => {
            clearInterval(timer)
            supabase.removeChannel(channel)
        }
    }, [])

    return (
        <header style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 'clamp(0.75rem, 2vw, 1.5rem) clamp(1rem, 3vw, 3rem)',
            background: 'var(--bg-secondary)',
            borderBottom: '1px solid var(--border-subtle)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
            flexWrap: 'wrap',
            gap: '1rem'
        }}>
            {/* Left Brand & Logos */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(0.5rem, 2vw, 1.5rem)', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(0.5rem, 1vw, 1rem)' }}>
                    <img src="/images/aarunya.png" alt="Aarunya" style={{ height: 'clamp(30px, 5vw, 45px)' }} />
                    <img src="/images/favicon.avif" alt="Team Scavengers" style={{ height: 'clamp(24px, 4vw, 36px)' }} />
                </div>

                <div style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: 'clamp(1.2rem, 3vw, 2rem)',
                    fontWeight: 900,
                    color: 'var(--text-primary)',
                    letterSpacing: 'clamp(1px, 0.2vw, 2px)',
                    textTransform: 'uppercase',
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: '0.4rem'
                }}>
                    <span style={{ color: 'var(--accent-red)' }}>DRIFT X</span> KARTING <span style={{ color: 'var(--accent-yellow)', fontSize: '0.8em' }}>2.0</span>
                </div>
            </div>

            {/* Center Status */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.5rem 1.5rem',
                background: status === 'LIVE' ? 'rgba(0, 255, 0, 0.1)' : 'rgba(255, 215, 0, 0.1)',
                border: `1px solid ${status === 'LIVE' ? 'var(--accent-green)' : 'var(--accent-yellow)'}`,
                borderRadius: '50px',
                boxShadow: status === 'LIVE' ? 'var(--shadow-glow-green)' : 'none',
                transition: 'all 0.3s ease'
            }}>
                <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: status === 'LIVE' ? 'var(--accent-green)' : 'var(--accent-yellow)',
                    animation: status === 'LIVE' ? 'pulse 1.5s infinite' : 'none'
                }} />
                <span style={{
                    fontFamily: 'var(--font-heading)',
                    fontWeight: 700,
                    color: status === 'LIVE' ? 'var(--accent-green)' : 'var(--accent-yellow)',
                    letterSpacing: '2px'
                }}>
                    {status}
                </span>
            </div>

            {/* Right Time */}
            <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '1.5rem',
                fontWeight: 700,
                color: 'var(--text-secondary)'
            }}>
                {currentTime.toLocaleTimeString('en-US', { hour12: false })}
            </div>

            <style>{`
                @keyframes pulse {
                    0% { box-shadow: 0 0 0 0 rgba(0, 255, 0, 0.4); }
                    70% { box-shadow: 0 0 0 10px rgba(0, 255, 0, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(0, 255, 0, 0); }
                }
            `}</style>
        </header>
    )
}
