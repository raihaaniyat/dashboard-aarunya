import { createContext, useContext, useReducer, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'

const RaceContext = createContext(null)

// ── Helpers ──
const formatMs = (ms) => {
    if (ms == null) return '--'
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    const millis = ms % 1000
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(millis).padStart(3, '0')}`
}
// ── Safe column list ──
// Only columns guaranteed to exist in the registrations table
const REG_SELECT = 'id, registration_id, full_name, enrollment_no, college, rounds, is_paid, status'

// ── Reducer ──
const initialState = {
    queue: [],
    activeRider: null,    // { registration_id, full_name, enrollment_no, college, rounds, raceEntry }
    laps: [],
    toast: null,
    loading: false,
}

function reducer(state, action) {
    switch (action.type) {
        case 'SET_QUEUE':
            return { ...state, queue: action.payload }
        case 'SET_ACTIVE_RIDER':
            return { ...state, activeRider: action.payload }
        case 'SET_LAPS':
            return { ...state, laps: action.payload }
        case 'ADD_LAP':
            return { ...state, laps: [...state.laps, action.payload] }
        case 'UPDATE_LAP':
            return {
                ...state,
                laps: state.laps.map(l => l.id === action.payload.id ? { ...l, ...action.payload } : l),
            }
        case 'SET_TOAST':
            return { ...state, toast: action.payload }
        case 'SET_LOADING':
            return { ...state, loading: action.payload }
        case 'UPDATE_ACTIVE_RACE_ENTRY':
            if (!state.activeRider) return state
            return {
                ...state,
                activeRider: {
                    ...state.activeRider,
                    raceEntry: { ...state.activeRider.raceEntry, ...action.payload },
                },
            }
        default:
            return state
    }
}

// ── Provider ──
export function RaceProvider({ children }) {
    const [state, dispatch] = useReducer(reducer, initialState)
    const stopwatchRef = useRef({ startTime: null })

    const showToast = useCallback((message, type = 'error') => {
        dispatch({ type: 'SET_TOAST', payload: { message, type } })
        setTimeout(() => dispatch({ type: 'SET_TOAST', payload: null }), 4000)
    }, [])

    // ── Fetch queue ──
    const fetchQueue = useCallback(async () => {
        const { data, error } = await supabase
            .from('race_entries')
            .select('registration_id, race_status, queued_at, registrations!inner(full_name, enrollment_no, college, rounds)')
            .in('race_status', ['queued', 'ready'])
            .order('queued_at', { ascending: true })

        if (error) {
            console.error('fetchQueue error:', error)
            showToast('Failed to fetch queue: ' + error.message)
            return
        }
        dispatch({
            type: 'SET_QUEUE',
            payload: (data || []).map(d => ({
                registration_id: d.registration_id,
                race_status: d.race_status,
                queued_at: d.queued_at,
                full_name: d.registrations.full_name,
                enrollment_no: d.registrations.enrollment_no,
                college: d.registrations.college,
                rounds: d.registrations.rounds || 1,
            })),
        })
    }, [showToast])

    // ── Scan rider (QR or manual) ──
    const scanRider = useCallback(async (registrationIdHuman) => {
        dispatch({ type: 'SET_LOADING', payload: true })

        // 1. Look up registration by human-readable ID or Enrollment Number (Case-Insensitive)
        const searchTerm = registrationIdHuman.trim()
        console.log('Searching for:', searchTerm)

        let { data: reg, error: regErr } = await supabase
            .from('registrations')
            .select(REG_SELECT)
            .ilike('registration_id', searchTerm)
            .maybeSingle()

        console.log('Search by registration_id result:', { reg, error: regErr })

        // Fallback: Try enrollment number if registration_id lookup fails
        if (!reg) {
            const { data: reg2, error: regErr2 } = await supabase
                .from('registrations')
                .select(REG_SELECT)
                .ilike('enrollment_no', searchTerm)
                .maybeSingle()

            console.log('Search by enrollment_no result:', { reg2, error: regErr2 })

            if (!reg2) {
                dispatch({ type: 'SET_LOADING', payload: false })
                const errMsg = regErr?.message || regErr2?.message || 'No matching record in database'
                showToast(`Search failed for "${searchTerm}": ${errMsg}`)
                return
            }
            reg = reg2
        }

        // Default rounds to 1 (column may not exist yet)
        reg.rounds = reg.rounds || 1

        // 2. Eligibility check
        if (!reg.is_paid || reg.status !== 'PAID') {
            dispatch({ type: 'SET_LOADING', payload: false })
            showToast('User not eligible or payment incomplete')
            return
        }

        // 3. Check / create race_entries row
        const { data: existing } = await supabase
            .from('race_entries')
            .select('*')
            .eq('registration_id', reg.id)
            .single()

        if (existing) {
            if (existing.race_status === 'completed') {
                dispatch({ type: 'SET_LOADING', payload: false })
                showToast('Rider already completed their race')
                return
            }
            if (['queued', 'ready', 'racing'].includes(existing.race_status)) {
                dispatch({ type: 'SET_LOADING', payload: false })
                showToast('Rider is already in the queue / racing')
                return
            }
        }

        if (!existing) {
            const { error: insertErr } = await supabase
                .from('race_entries')
                .insert({
                    registration_id: reg.id,
                    race_status: 'queued',
                    queued_at: new Date().toISOString(),
                })
            if (insertErr) {
                dispatch({ type: 'SET_LOADING', payload: false })
                showToast('Failed to queue rider: ' + insertErr.message)
                return
            }
        } else {
            // Re-queue (e.g. from cancelled/disqualified)
            const { error: updateErr } = await supabase
                .from('race_entries')
                .update({ race_status: 'queued', queued_at: new Date().toISOString() })
                .eq('registration_id', reg.id)
            if (updateErr) {
                dispatch({ type: 'SET_LOADING', payload: false })
                showToast('Failed to re-queue rider: ' + updateErr.message)
                return
            }
        }

        await fetchQueue()
        dispatch({ type: 'SET_LOADING', payload: false })
        showToast(`${reg.full_name} added to queue`, 'success')
    }, [fetchQueue, showToast])

    // ── Mark Ready ──
    const markReady = useCallback(async (registrationId) => {
        const { error } = await supabase
            .from('race_entries')
            .update({ race_status: 'ready' })
            .eq('registration_id', registrationId)
            .eq('race_status', 'queued')
        if (error) {
            showToast('Failed to mark ready: ' + error.message)
            return
        }
        await fetchQueue()
        showToast('Rider marked ready', 'success')
    }, [fetchQueue, showToast])

    // ── Select rider to active panel ──
    const selectRider = useCallback(async (registrationId) => {
        // Fetch full rider details
        const { data: re } = await supabase
            .from('race_entries')
            .select('*, registrations!inner(full_name, enrollment_no, college, rounds, registration_id)')
            .eq('registration_id', registrationId)
            .single()
        if (!re) return

        // Fetch laps
        const { data: lapData } = await supabase
            .from('laps')
            .select('*')
            .eq('registration_id', registrationId)
            .order('lap_number', { ascending: true })

        dispatch({
            type: 'SET_ACTIVE_RIDER',
            payload: {
                registration_id: re.registration_id,
                registration_id_human: re.registrations.registration_id,
                full_name: re.registrations.full_name,
                enrollment_no: re.registrations.enrollment_no,
                college: re.registrations.college,
                rounds: re.registrations.rounds || 1,
                raceEntry: {
                    race_status: re.race_status,
                    rounds_completed: re.rounds_completed,
                    best_lap_time_ms: re.best_lap_time_ms,
                    average_lap_time_ms: re.average_lap_time_ms,
                    race_started_at: re.race_started_at,
                },
            },
        })
        dispatch({ type: 'SET_LAPS', payload: lapData || [] })
    }, [])

    // ── Start Lap (begin stopwatch) ──
    const startLap = useCallback(async () => {
        if (!state.activeRider) return

        // Check concurrency: no one else is racing
        const { data: racingNow } = await supabase
            .from('race_entries')
            .select('registration_id')
            .eq('race_status', 'racing')

        if (racingNow && racingNow.length > 0 && racingNow[0].registration_id !== state.activeRider.registration_id) {
            showToast('Another rider is currently racing. Stop them first.')
            return
        }

        const now = new Date().toISOString()
        const { error } = await supabase
            .from('race_entries')
            .update({
                race_status: 'racing',
                race_started_at: state.activeRider.raceEntry.race_started_at || now,
            })
            .eq('registration_id', state.activeRider.registration_id)

        if (error) {
            showToast('Failed to start: ' + error.message)
            return
        }

        stopwatchRef.current.startTime = Date.now()
        dispatch({ type: 'UPDATE_ACTIVE_RACE_ENTRY', payload: { race_status: 'racing', race_started_at: now } })
        await fetchQueue()
    }, [state.activeRider, fetchQueue, showToast])

    // ── Stop Lap (record lap) ──
    const stopLap = useCallback(async () => {
        if (!state.activeRider || !stopwatchRef.current.startTime) return

        const lapTimeMs = Date.now() - stopwatchRef.current.startTime
        stopwatchRef.current.startTime = null

        const lapNumber = state.laps.filter(l => l.valid !== false).length + 1

        // Insert lap
        const { data: newLap, error: lapErr } = await supabase
            .from('laps')
            .insert({
                registration_id: state.activeRider.registration_id,
                lap_number: lapNumber,
                lap_time_ms: lapTimeMs,
            })
            .select()
            .single()

        if (lapErr) {
            showToast('Failed to record lap: ' + lapErr.message)
            return
        }

        dispatch({ type: 'ADD_LAP', payload: newLap })

        // Recalculate stats
        const allValidLaps = [...state.laps.filter(l => l.valid !== false), newLap]
        const times = allValidLaps.map(l => l.lap_time_ms)
        const best = Math.min(...times)
        const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length)
        const roundsCompleted = allValidLaps.length

        // Check if race complete
        const isComplete = roundsCompleted >= (state.activeRider.rounds || 1)

        const updateData = {
            rounds_completed: roundsCompleted,
            best_lap_time_ms: best,
            average_lap_time_ms: avg,
        }
        if (isComplete) {
            updateData.race_status = 'completed'
            updateData.race_completed_at = new Date().toISOString()
        } else {
            // Stay racing, reset stopwatch for next lap
            updateData.race_status = 'racing'
        }

        await supabase
            .from('race_entries')
            .update(updateData)
            .eq('registration_id', state.activeRider.registration_id)

        dispatch({ type: 'UPDATE_ACTIVE_RACE_ENTRY', payload: updateData })

        if (!isComplete) {
            // Auto-restart stopwatch for next lap
            stopwatchRef.current.startTime = Date.now()
        }

        showToast(`Lap ${lapNumber}: ${formatMs(lapTimeMs)}`, 'success')
        if (isComplete) {
            showToast('Race completed! 🏁', 'success')
            await fetchQueue()
        }
    }, [state.activeRider, state.laps, fetchQueue, showToast])

    // ── Mark lap invalid ──
    const invalidateLap = useCallback(async (lapId) => {
        const { error } = await supabase
            .from('laps')
            .update({ valid: false })
            .eq('id', lapId)
        if (error) {
            showToast('Failed to invalidate lap: ' + error.message)
            return
        }
        dispatch({ type: 'UPDATE_LAP', payload: { id: lapId, valid: false } })

        // Recalculate stats
        const validLaps = state.laps.filter(l => l.id !== lapId && l.valid !== false)
        if (validLaps.length > 0) {
            const times = validLaps.map(l => l.lap_time_ms)
            const best = Math.min(...times)
            const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length)
            await supabase
                .from('race_entries')
                .update({ rounds_completed: validLaps.length, best_lap_time_ms: best, average_lap_time_ms: avg })
                .eq('registration_id', state.activeRider.registration_id)
            dispatch({ type: 'UPDATE_ACTIVE_RACE_ENTRY', payload: { rounds_completed: validLaps.length, best_lap_time_ms: best, average_lap_time_ms: avg } })
        }
        showToast('Lap marked invalid', 'success')
    }, [state.laps, state.activeRider, showToast])

    // ── Reset last lap ──
    const resetLastLap = useCallback(async () => {
        const validLaps = state.laps.filter(l => l.valid !== false)
        if (validLaps.length === 0) return
        const lastLap = validLaps[validLaps.length - 1]
        await invalidateLap(lastLap.id)
    }, [state.laps, invalidateLap])

    // ── Edit lap time ──
    const editLapTime = useCallback(async (lapId, newTimeMs) => {
        const { error } = await supabase
            .from('laps')
            .update({ lap_time_ms: newTimeMs })
            .eq('id', lapId)
        if (error) {
            showToast('Failed to edit lap: ' + error.message)
            return
        }
        dispatch({ type: 'UPDATE_LAP', payload: { id: lapId, lap_time_ms: newTimeMs } })

        // Recalculate
        const updatedLaps = state.laps.map(l => l.id === lapId ? { ...l, lap_time_ms: newTimeMs } : l).filter(l => l.valid !== false)
        if (updatedLaps.length > 0) {
            const times = updatedLaps.map(l => l.lap_time_ms)
            const best = Math.min(...times)
            const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length)
            await supabase
                .from('race_entries')
                .update({ best_lap_time_ms: best, average_lap_time_ms: avg })
                .eq('registration_id', state.activeRider.registration_id)
            dispatch({ type: 'UPDATE_ACTIVE_RACE_ENTRY', payload: { best_lap_time_ms: best, average_lap_time_ms: avg } })
        }
        showToast('Lap time updated', 'success')
    }, [state.laps, state.activeRider, showToast])

    // ── Cancel rider ──
    const cancelRider = useCallback(async (registrationId) => {
        const { error } = await supabase
            .from('race_entries')
            .update({ race_status: 'cancelled' })
            .eq('registration_id', registrationId)
        if (error) {
            showToast('Failed to cancel: ' + error.message)
            return
        }
        if (state.activeRider?.registration_id === registrationId) {
            stopwatchRef.current.startTime = null
            dispatch({ type: 'SET_ACTIVE_RIDER', payload: null })
            dispatch({ type: 'SET_LAPS', payload: [] })
        }
        await fetchQueue()
        showToast('Rider cancelled', 'success')
    }, [state.activeRider, fetchQueue, showToast])

    // ── Disqualify ──
    const disqualifyRider = useCallback(async () => {
        if (!state.activeRider) return
        const { error } = await supabase
            .from('race_entries')
            .update({ race_status: 'disqualified' })
            .eq('registration_id', state.activeRider.registration_id)
        if (error) {
            showToast('Failed to disqualify: ' + error.message)
            return
        }
        stopwatchRef.current.startTime = null
        dispatch({ type: 'SET_ACTIVE_RIDER', payload: null })
        dispatch({ type: 'SET_LAPS', payload: [] })
        await fetchQueue()
        showToast('Rider disqualified', 'success')
    }, [state.activeRider, fetchQueue, showToast])

    const value = {
        ...state,
        stopwatchRef,
        formatMs,
        fetchQueue,
        scanRider,
        markReady,
        selectRider,
        startLap,
        stopLap,
        invalidateLap,
        resetLastLap,
        editLapTime,
        cancelRider,
        disqualifyRider,
        showToast,
    }

    return <RaceContext.Provider value={value}>{children}</RaceContext.Provider>
}

export function useRace() {
    const ctx = useContext(RaceContext)
    if (!ctx) throw new Error('useRace must be used within <RaceProvider>')
    return ctx
}
