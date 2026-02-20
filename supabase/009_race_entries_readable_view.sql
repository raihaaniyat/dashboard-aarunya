-- Readable view for race_entries with rider names
-- Run this in your Supabase SQL Editor
-- After running, you'll see a "race_entries_view" in your Supabase Table Editor

CREATE OR REPLACE VIEW public.race_entries_readable AS
SELECT
    re.id,
    re.registration_id,
    r.registration_id AS human_id,
    r.full_name,
    r.enrollment_no,
    r.college,
    r.rounds AS total_rounds,
    re.race_status,
    re.rounds_completed,
    re.best_lap_time_ms,
    re.average_lap_time_ms,
    re.race_started_at,
    re.race_finished_at,
    re.queued_at,
    re.created_at
FROM public.race_entries re
JOIN public.registrations r ON r.id = re.registration_id
ORDER BY re.created_at DESC;

-- Grant access
GRANT SELECT ON public.race_entries_readable TO anon;
GRANT SELECT ON public.race_entries_readable TO authenticated;
