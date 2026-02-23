import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { getRaceDay } from '../lib/raceDay'
import Header from '../components/public/Header'
import LeaderboardTable from '../components/public/LeaderboardTable'
import CurrentRacerCard from '../components/public/CurrentRacerCard'
import StatsPanel from '../components/public/StatsPanel'
import FooterTicker from '../components/public/FooterTicker'

export default function PublicLeaderboard() {
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

    // ── Fetch Leaderboard & Stats ──
    const fetchData = useCallback(async () => {
        const { data: leadData } = await supabase
            .from('race_entries')
            .select('registration_id, best_lap_time_ms, average_lap_time_ms, rounds_completed, race_status, race_day, registrations!inner(full_name, enrollment_no, college, rounds)')
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

        // Calculate Stats
        const { data: allData } = await supabase
            .from('race_entries')
            .select('best_lap_time_ms, average_lap_time_ms, rounds_completed')
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
            }, 10)
        } else {
            setLiveTimer(0)
            if (timerRef.current) clearInterval(timerRef.current)
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current)
        }
    }, [activeRacer])

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
                    minWidth: 0,
                    maxWidth: '100%'
                }}>
                    <div style={{ flex: '0 0 auto' }}>
                        <CurrentRacerCard activeRacer={activeRacer} liveTimer={liveTimer} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <StatsPanel stats={stats} dayLabel={''} />
                    </div>
                </div>

                {/* Right zone: Leaderboard */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    flex: '2.5 1 min(100%, 500px)',
                    minWidth: 0,
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
