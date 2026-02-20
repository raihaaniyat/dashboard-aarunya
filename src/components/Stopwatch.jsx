import { useState, useEffect, useRef, useCallback } from 'react'
import { useRace } from '../context/RaceContext'

export default function Stopwatch() {
    const { activeRider, stopwatchRef, formatMs } = useRace()
    const [display, setDisplay] = useState('00:00.000')
    const rafRef = useRef(null)

    const isRacing = activeRider?.raceEntry?.race_status === 'racing'

    const tick = useCallback(() => {
        if (stopwatchRef.current.startTime) {
            const elapsed = Date.now() - stopwatchRef.current.startTime
            setDisplay(formatMs(elapsed))
        }
        rafRef.current = requestAnimationFrame(tick)
    }, [stopwatchRef, formatMs])

    useEffect(() => {
        if (isRacing && stopwatchRef.current.startTime) {
            rafRef.current = requestAnimationFrame(tick)
        } else {
            if (rafRef.current) cancelAnimationFrame(rafRef.current)
            if (!stopwatchRef.current.startTime) setDisplay('00:00.000')
        }
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current)
        }
    }, [isRacing, tick, stopwatchRef])

    return (
        <div className={`stopwatch-display ${isRacing ? 'racing' : ''}`}>
            {display}
        </div>
    )
}
