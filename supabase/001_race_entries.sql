-- 001: Create race_entries table
-- Tracks race lifecycle separately from payment/registration.
-- FK references registrations.id

CREATE TABLE IF NOT EXISTS race_entries (
  registration_id UUID PRIMARY KEY REFERENCES registrations(id) ON DELETE CASCADE,
  race_status     TEXT NOT NULL DEFAULT 'not_checked_in'
    CHECK (race_status IN (
      'not_checked_in', 'queued', 'ready', 'racing',
      'completed', 'disqualified', 'cancelled'
    )),
  rounds_completed    INTEGER NOT NULL DEFAULT 0,
  best_lap_time_ms    INTEGER,
  average_lap_time_ms INTEGER,
  queued_at           TIMESTAMPTZ,
  race_started_at     TIMESTAMPTZ,
  race_completed_at   TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for queue ordering
CREATE INDEX IF NOT EXISTS idx_race_entries_queued
  ON race_entries (queued_at ASC)
  WHERE race_status = 'queued';

-- Index for finding in-progress rider
CREATE INDEX IF NOT EXISTS idx_race_entries_racing
  ON race_entries (registration_id)
  WHERE race_status = 'racing';
