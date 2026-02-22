-- 012: Fix RLS policies for race_entries and laps
-- The dashboard uses the anon key, so we need to allow anon to
-- SELECT, INSERT, UPDATE, and DELETE on these tables.
-- These tables only contain race-day operational data (not personal/payment data),
-- so open access is acceptable.

-- ── race_entries ──
-- Enable RLS if not already enabled
ALTER TABLE race_entries ENABLE ROW LEVEL SECURITY;

-- Allow full access for anon and authenticated roles
CREATE POLICY "Allow full access to race_entries"
  ON race_entries
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ── laps ──
ALTER TABLE laps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow full access to laps"
  ON laps
  FOR ALL
  USING (true)
  WITH CHECK (true);
