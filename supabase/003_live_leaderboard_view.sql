-- 003: Create live_leaderboard VIEW
-- JOINs registrations + race_entries for the public leaderboard.
-- The public dashboard subscribes to this via Supabase Realtime.

CREATE OR REPLACE VIEW live_leaderboard AS
SELECT
  r.id,
  r.full_name,
  r.enrollment_no,
  r.college,
  r.rounds         AS rounds_purchased,
  re.rounds_completed,
  re.best_lap_time_ms,
  re.average_lap_time_ms,
  re.race_status
FROM registrations r
JOIN race_entries re ON r.id = re.registration_id
WHERE r.is_paid = true
  AND r.status = 'PAID'
ORDER BY re.best_lap_time_ms ASC NULLS LAST;
