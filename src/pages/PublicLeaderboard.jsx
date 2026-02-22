import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { getRaceDay, TOTAL_DAYS } from '../lib/raceDay'
import Header from '../components/public/Header'
import LeaderboardTable from '../components/public/LeaderboardTable'
import CurrentRacerCard from '../components/public/CurrentRacerCard'
import StatsPanel from '../components/public/StatsPanel'
import FooterTicker from '../components/public/FooterTicker'

export default function PublicLeaderboard() {
    const [selectedDay, setSelectedDay] = useState(getRaceDay())
    const [leaders, setLeaders] = useState([])
    const [activeRacer, setActiveRacer] = useState(null)
    const [liveTimer, setLiveTimer] = useState(0)
    const [stats, setStats] = useState({
        fastestOfDday: null,
        totalParticipants: 0,
        totalLaps: 0,
        avgOverall: null
    })

    const timerRef = useRef(null)

    // ── Fetch Leaderboard & Stats (scoped to selectedDay) ──
    const fetchData = useCallback(async () => {
        // Fetch top 10 for the selected day
        const { data: leadData } = await supabase
            .from('race_entries')
            .select('registration_id, best_lap_time_ms, average_lap_time_ms, rounds_completed, race_status, race_day, registrations!inner(full_name, enrollment_no, college, rounds)')
            .eq('race_day', selectedDay)
            .not('best_lap_time_ms', 'is', null)
            .order('best_lap_time_ms', { ascending: true })

        const formattedLeaders = (leadData || []).map((d, i) => ({
            rank: i + 1,
            full_name: d.registrations.full_name,
            enrollment_no: d.registrations.enrollment_no,
            college: d.registrations.college,
            best_lap_time_ms: d.best_lap_time_ms,
            average_lap_time_ms: d.average_lap_time_ms,
            rounds_completed: d.rounds_completed,
            total_rounds: d.registrations.rounds || 1,
            race_status: d.race_status,
        }))
        setLeaders(formattedLeaders)

        // Calculate Stats for the selected day
        const { data: allData } = await supabase
            .from('race_entries')
            .select('best_lap_time_ms, average_lap_time_ms, rounds_completed')
            .eq('race_day', selectedDay)
            .not('best_lap_time_ms', 'is', null)

        if (allData && allData.length > 0) {
            const fastest = Math.min(...allData.map(d => d.best_lap_time_ms))
            const totalLaps = allData.reduce((acc, curr) => acc + curr.rounds_completed, 0)
            const sumAvgs = allData.reduce((acc, curr) => acc + curr.average_lap_time_ms, 0)
            const avgOverall = Math.round(sumAvgs / allData.length)

            setStats({
                fastestOfDday: fastest,
                totalParticipants: allData.length,
                totalLaps: totalLaps,
                avgOverall: avgOverall
            })
        } else {
            setStats({
                fastestOfDday: null,
                totalParticipants: 0,
                totalLaps: 0,
                avgOverall: null
            })
        }
    }, [selectedDay])

    // ── Fetch Active Racer (current day only) ──
    const fetchActiveRacer = useCallback(async () => {
        const currentDay = getRaceDay()
        const { data } = await supabase
            .from('race_entries')
            .select('registration_id, race_status, rounds_completed, race_started_at, race_day, registrations!inner(full_name, college, enrollment_no, rounds)')
            .eq('race_status', 'racing')
            .eq('race_day', currentDay)
            .limit(1)
            .maybeSingle()

        if (data) {
            // Need the latest lap time to calculate current running lap
            const { data: laps } = await supabase
                .from('laps')
                .select('*')
                .eq('registration_id', data.registration_id)
                .eq('race_day', data.race_day)
                .order('lap_number', { ascending: true })

            const validLaps = (laps || []).filter(l => l.valid !== false)
            let currentLapStart = new Date(data.race_started_at).getTime()

            if (validLaps.length > 0) {
                // The start of the current lap is the race_started_at + sum of previous lap times
                const totalPrevLapsMs = validLaps.reduce((acc, l) => acc + l.lap_time_ms, 0)
                currentLapStart += totalPrevLapsMs
            }

            setActiveRacer({
                full_name: data.registrations.full_name,
                college: data.registrations.college,
                enrollment_no: data.registrations.enrollment_no,
                rounds_completed: validLaps.length,
                total_rounds: data.registrations.rounds || 1,
                currentLapStartTime: currentLapStart
            })
        } else {
            setActiveRacer(null)
            setLiveTimer(0)
        }
    }, [])

    // ── Realtime & Timer Loop ──
    useEffect(() => {
        fetchData()
        fetchActiveRacer()

        const channel = supabase
            .channel('public-leaderboard')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'race_entries' }, () => {
                fetchData()
                fetchActiveRacer()
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'laps' }, () => {
                fetchData()
                fetchActiveRacer()
            })
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [fetchData, fetchActiveRacer])

    useEffect(() => {
        if (activeRacer && activeRacer.currentLapStartTime) {
            timerRef.current = setInterval(() => {
                setLiveTimer(Date.now() - activeRacer.currentLapStartTime)
            }, 10) // 10ms for smooth ms updates
        } else {
            setLiveTimer(0)
            if (timerRef.current) clearInterval(timerRef.current)
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current)
        }
    }, [activeRacer])

    // Page starts at top naturally — no auto-scroll

    const currentDay = getRaceDay()

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100vh',
            paddingBottom: '60px', // For footer ticker
            overflowX: 'hidden',
            width: '100%'
        }}>
            <Header />

            {/* ── Day Selector Tabs ── */}
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '1rem clamp(1rem, 3vw, 3rem) 0',
                flexWrap: 'wrap'
            }}>
                {Array.from({ length: TOTAL_DAYS }, (_, i) => i + 1).map(day => (
                    <button
                        key={day}
                        onClick={() => setSelectedDay(day)}
                        style={{
                            padding: '0.6rem 1.5rem',
                            fontFamily: 'var(--font-heading)',
                            fontSize: 'clamp(0.75rem, 2vw, 0.95rem)',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '2px',
                            border: selectedDay === day
                                ? '2px solid var(--accent-red)'
                                : '2px solid var(--border-subtle)',
                            borderRadius: '50px',
                            background: selectedDay === day
                                ? 'linear-gradient(135deg, rgba(227, 24, 55, 0.2), rgba(227, 24, 55, 0.05))'
                                : 'var(--bg-card)',
                            color: selectedDay === day
                                ? 'var(--accent-red)'
                                : 'var(--text-secondary)',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            boxShadow: selectedDay === day
                                ? 'var(--shadow-glow-red)'
                                : 'none',
                            position: 'relative',
                        }}
                    >
                        Day {day}
                        {day === currentDay && (
                            <span style={{
                                position: 'absolute',
                                top: '-6px',
                                right: '-6px',
                                width: '12px',
                                height: '12px',
                                borderRadius: '50%',
                                background: 'var(--accent-green)',
                                border: '2px solid var(--bg-primary)',
                                animation: 'pulse 1.5s infinite',
                            }} />
                        )}
                    </button>
                ))}
            </div>

            <div style={{
                flex: 1,
                display: 'flex',
                flexWrap: 'wrap',
                gap: '2rem',
                padding: 'clamp(1rem, 3vw, 2rem) clamp(1rem, 3vw, 3rem)',
                boxSizing: 'border-box',
                width: '100%',
                maxWidth: '100%'
            }}>
                {/* Left zone: Current Racer & Stats */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2rem',
                    flex: '1 1 min(100%, 350px)',
                    minWidth: 0, // CRITICAL FOR PREVENTING FLEX BLOWOUT
                    maxWidth: '100%'
                }}>
                    <div style={{ flex: '0 0 auto' }}>
                        <CurrentRacerCard activeRacer={activeRacer} liveTimer={liveTimer} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <StatsPanel stats={stats} dayLabel={selectedDay} />
                    </div>
                </div>

                {/* Right zone: Leaderboard */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    flex: '2.5 1 min(100%, 500px)',
                    minWidth: 0, // CRITICAL FOR PREVENTING FLEX BLOWOUT
                    maxWidth: '100%'
                }}>
                    <div style={{
                        background: 'linear-gradient(90deg, var(--accent-red), transparent)',
                        height: '4px',
                        width: '100%',
                        marginBottom: '1rem',
                        borderRadius: '2px'
                    }} />
                    <LeaderboardTable leaders={leaders} />
                </div>
            </div>

            <FooterTicker />
        </div>
    )
}
