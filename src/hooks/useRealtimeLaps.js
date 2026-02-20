import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useRace } from '../context/RaceContext'

export default function useRealtimeLaps() {
    const { activeRider, selectRider } = useRace()

    useEffect(() => {
        if (!activeRider) return

        const channel = supabase
            .channel('laps-realtime')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'laps',
                    filter: `registration_id=eq.${activeRider.registration_id}`,
                },
                () => {
                    // Re-fetch the active rider's data
                    selectRider(activeRider.registration_id)
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [activeRider?.registration_id, selectRider])
}
