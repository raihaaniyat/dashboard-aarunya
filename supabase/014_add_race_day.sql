-- 014: Add race_day support for multi-day event
-- Run this in Supabase SQL Editor before deploying frontend changes.

-- Step 1: Add race_day columns first
ALTER TABLE race_entries ADD COLUMN IF NOT EXISTS race_day INTEGER NOT NULL DEFAULT 1;
ALTER TABLE laps ADD COLUMN IF NOT EXISTS race_day INTEGER NOT NULL DEFAULT 1;

-- Step 2: Drop the laps FK FIRST (it depends on the PK we're about to drop)
ALTER TABLE laps DROP CONSTRAINT IF EXISTS laps_registration_id_fkey;

-- Step 3: Now safe to drop the old primary key
ALTER TABLE race_entries DROP CONSTRAINT race_entries_pkey;

-- Step 4: Create composite PK so same rider can race on different days
ALTER TABLE race_entries ADD PRIMARY KEY (registration_id, race_day);

-- Step 5: Add new composite FK on laps -> race_entries(registration_id, race_day)
ALTER TABLE laps ADD CONSTRAINT laps_race_entry_fkey
  FOREIGN KEY (registration_id, race_day)
  REFERENCES race_entries(registration_id, race_day)
  ON DELETE CASCADE;

-- Step 7: Update indexes
DROP INDEX IF EXISTS idx_race_entries_queued;
CREATE INDEX idx_race_entries_queued
  ON race_entries (queued_at ASC)
  WHERE race_status = 'queued';

DROP INDEX IF EXISTS idx_race_entries_racing;
CREATE INDEX idx_race_entries_racing
  ON race_entries (registration_id, race_day)
  WHERE race_status = 'racing';

-- Step 8: Update the live_leaderboard view
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
  re.race_status,
  re.race_day
FROM registrations r
JOIN race_entries re ON r.id = re.registration_id
WHERE r.is_paid = true
  AND r.status = 'PAID'
ORDER BY re.best_lap_time_ms ASC NULLS LAST;
