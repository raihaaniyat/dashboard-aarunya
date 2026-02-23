import { useState, useEffect } from 'react'

export default function FooterTicker() {
    const messages = [
        "Welcome to Drift X Karting 2.0",
        "Aarunya 2.0",
        "MITS Gwalior",
        "Scan QR Code at the registration desk to participate",
        "Fastest lap wins the grand prize!",
        "Powered by Team Scavengers",
        "Register at team-scavengers.vercel.app/aarunya"
    ]

    return (
        <div style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            width: '100%',
            background: 'var(--accent-red)',
            color: '#fff',
            padding: '0.75rem 0',
            overflow: 'hidden',
            fontFamily: 'var(--font-heading)',
            fontSize: '1.1rem',
            fontWeight: 700,
            letterSpacing: '2px',
            textTransform: 'uppercase',
            zIndex: 50,
            boxShadow: '0 -4px 20px rgba(227, 24, 55, 0.4)'
        }}>
            <div style={{
                display: 'flex',
                whiteSpace: 'nowrap',
                animation: 'ticker 30s linear infinite'
            }}>
                {/* Double the messages for seamless scrolling */}
                {[...messages, ...messages].map((msg, idx) => (
                    <span key={idx} style={{ margin: '0 3rem', display: 'flex', alignItems: 'center', gap: '3rem' }}>
                        {msg}
                        <span style={{ color: 'rgba(255,255,255,0.5)' }}>•</span>
                    </span>
                ))}
            </div>

            <style>{`
                @keyframes ticker {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
            `}</style>
        </div>
    )
}
