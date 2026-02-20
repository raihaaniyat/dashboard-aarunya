import { useState } from 'react'
import { useRace } from '../context/RaceContext'

export default function ManualSearch() {
    const { scanRider, loading } = useRace()
    const [value, setValue] = useState('')

    const handleSubmit = (e) => {
        e.preventDefault()
        if (!value.trim()) return
        scanRider(value.trim())
        setValue('')
    }

    return (
        <div className="card" style={{ marginTop: '0.75rem' }}>
            <div className="panel-title">🔍 Manual Search</div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                    className="input"
                    type="text"
                    placeholder="REG-2026-XXXXXX"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    disabled={loading}
                />
                <button className="btn btn-primary btn-sm" type="submit" disabled={loading || !value.trim()}>
                    Add
                </button>
            </form>
        </div>
    )
}
