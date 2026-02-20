-- 002: Create laps table
-- Stores individual lap times linked to a race entry.

CREATE TABLE IF NOT EXISTS laps (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID NOT NULL REFERENCES race_entries(registration_id) ON DELETE CASCADE,
  lap_number      INTEGER NOT NULL,
  lap_time_ms     INTEGER NOT NULL,
  valid           BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fast lookup of laps for a specific rider
CREATE INDEX IF NOT EXISTS idx_laps_registration
  ON laps (registration_id, lap_number);
