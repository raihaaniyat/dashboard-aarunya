import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { getRaceDay } from '../lib/raceDay'
import Header from '../components/public/Header'
import LeaderboardTable from '../components/public/LeaderboardTable'
import CurrentRacerCard from '../components/public/CurrentRacerCard'
import StatsPanel from '../components/public/StatsPanel'
import FooterTicker from '../components/public/FooterTicker'

// Days to show on the public leaderboard (Day 3 = yesterday's results, Day 4 = live)
const DISPLAY_DAYS = [4, 3]

export default function PublicLeaderboard() {
    const [dayData, setDayData] = useState({})
    const [activeRacer, setActiveRacer] = useState(null)
    const [liveTimer, setLiveTimer] = useState(0)

    const timerRef = useRef(null)

    // ── Fetch Leaderboard & Stats for display days ──
    const fetchAllDays = useCallback(async () => {
        const results = {}

        for (const day of DISPLAY_DAYS) {
            const { data: leadData } = await supabase
                .from('race_entries')
                .select('registration_id, best_lap_time_ms, average_lap_time_ms, rounds_completed, race_status, race_day, registrations!inner(full_name, enrollment_no, college, rounds)')
                .eq('race_day', day)
                .not('best_lap_time_ms', 'is', null)
                .order('best_lap_time_ms', { ascending: true })

            const leaders = (leadData || []).map((d, i) => ({
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

            const { data: allData } = await supabase
                .from('race_entries')
                .select('best_lap_time_ms, average_lap_time_ms, rounds_completed')
                .eq('race_day', day)
                .not('best_lap_time_ms', 'is', null)

            let stats = { fastestOfDday: null, totalParticipants: 0, totalLaps: 0, avgOverall: null }
            if (allData && allData.length > 0) {
                const fastest = Math.min(...allData.map(d => d.best_lap_time_ms))
                const totalLaps = allData.reduce((acc, d) => acc + d.rounds_completed, 0)
                const sumAvgs = allData.reduce((acc, d) => acc + (d.average_lap_time_ms || 0), 0)
                const avgOverall = Math.round(sumAvgs / allData.length)
                stats = { fastestOfDday: fastest, totalParticipants: allData.length, totalLaps, avgOverall }
            }

            results[day] = { leaders, stats }
        }

        setDayData(results)
    }, [])

    // ── Fetch Active Racer ──
    const fetchActiveRacer = useCallback(async () => {
        const { data } = await supabase
            .from('race_entries')
            .select('registration_id, race_status, rounds_completed, race_started_at, race_day, registrations!inner(full_name, college, enrollment_no, rounds)')
            .eq('race_status', 'racing')
            .limit(1)
            .maybeSingle()

        if (data) {
            let lapsData = null
            if (data.race_day) {
                const { data: laps } = await supabase
                    .from('laps')
                    .select('*')
                    .eq('registration_id', data.registration_id)
                    .eq('race_day', data.race_day)
                    .order('lap_number', { ascending: true })
                lapsData = laps
            }
            if (!lapsData || lapsData.length === 0) {
                const { data: laps } = await supabase
                    .from('laps')
                    .select('*')
                    .eq('registration_id', data.registration_id)
                    .order('lap_number', { ascending: true })
                lapsData = laps
            }

            const validLaps = (lapsData || []).filter(l => l.valid !== false)
            let currentLapStart = new Date(data.race_started_at).getTime()

            if (validLaps.length > 0) {
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
        fetchAllDays()
        fetchActiveRacer()

        const channel = supabase
            .channel('public-leaderboard')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'race_entries' }, () => {
                fetchAllDays()
                fetchActiveRacer()
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'laps' }, () => {
                fetchAllDays()
                fetchActiveRacer()
            })
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [fetchAllDays, fetchActiveRacer])

    useEffect(() => {
        if (activeRacer && activeRacer.currentLapStartTime) {
            timerRef.current = setInterval(() => {
                setLiveTimer(Date.now() - activeRacer.currentLapStartTime)
            }, 10)
        } else {
            setLiveTimer(0)
            if (timerRef.current) clearInterval(timerRef.current)
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current)
        }
    }, [activeRacer])

    const currentDay = getRaceDay()

    const dayColors = {
        3: { accent: '#8b5cf6', gradient: 'linear-gradient(90deg, #8b5cf6, transparent)' },
        4: { accent: '#e31837', gradient: 'linear-gradient(90deg, #e31837, transparent)' },
    }

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100vh',
            paddingBottom: '60px',
            overflowX: 'hidden',
            width: '100%'
        }}>
            <Header />

            {/* Current Racer Card */}
            {activeRacer && (
                <div style={{ padding: '1rem clamp(1rem, 3vw, 3rem) 0' }}>
                    <CurrentRacerCard activeRacer={activeRacer} liveTimer={liveTimer} />
                </div>
            )}

            {/* ── Day Leaderboards (Day 4 first, then Day 3) ── */}
            {DISPLAY_DAYS.map(day => {
                const data = dayData[day] || { leaders: [], stats: { fastestOfDday: null, totalParticipants: 0, totalLaps: 0, avgOverall: null } }
                const colors = dayColors[day] || dayColors[4]

                return (
                    <div
                        key={day}
                        style={{
                            padding: 'clamp(1.5rem, 3vw, 2.5rem) clamp(1rem, 3vw, 3rem)',
                            borderBottom: '1px solid var(--border-subtle)',
                        }}
                    >
                        {/* Day Header */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            marginBottom: '1.5rem',
                        }}>
                            <div style={{
                                fontFamily: 'var(--font-heading)',
                                fontSize: 'clamp(1.5rem, 4vw, 2.2rem)',
                                fontWeight: 900,
                                textTransform: 'uppercase',
                                letterSpacing: '3px',
                                color: colors.accent,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                whiteSpace: 'nowrap',
                            }}>
                                🏁 Day {day} Leaderboard
                                {day === currentDay && (
                                    <span style={{
                                        fontSize: '0.7rem',
                                        fontWeight: 600,
                                        padding: '3px 10px',
                                        borderRadius: '50px',
                                        background: 'rgba(34, 197, 94, 0.15)',
                                        color: 'var(--accent-green)',
                                        border: '1px solid var(--accent-green)',
                                        letterSpacing: '1px',
                                        textTransform: 'uppercase',
                                        animation: 'pulse 1.5s infinite',
                                    }}>
                                        Live
                                    </span>
                                )}
                            </div>
                            <div style={{
                                flex: 1,
                                height: '4px',
                                background: colors.gradient,
                                borderRadius: '2px',
                            }} />
                        </div>

                        {/* Stats */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <StatsPanel stats={data.stats} dayLabel={day} />
                        </div>

                        {/* Leaderboard */}
                        <LeaderboardTable leaders={data.leaders} />
                    </div>
                )
            })}

            <FooterTicker />
        </div>
    )
}
