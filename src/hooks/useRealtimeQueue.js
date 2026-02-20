import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useRace } from '../context/RaceContext'

export default function useRealtimeQueue() {
    const { fetchQueue } = useRace()

    useEffect(() => {
        const channel = supabase
            .channel('queue-realtime')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'race_entries' },
                () => {
                    fetchQueue()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [fetchQueue])
}
