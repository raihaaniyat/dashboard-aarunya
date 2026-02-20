-- 005: Row Level Security policies
-- Admin (authenticated) = full access to race_entries + laps
-- Public / anon = read-only on race_entries (for realtime subscriptions)

-- Enable RLS
ALTER TABLE race_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE laps         ENABLE ROW LEVEL SECURITY;

-- race_entries policies
CREATE POLICY "Admin full access on race_entries"
  ON race_entries
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public read race_entries"
  ON race_entries
  FOR SELECT
  TO anon
  USING (true);

-- laps policies
CREATE POLICY "Admin full access on laps"
  ON laps
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public read laps"
  ON laps
  FOR SELECT
  TO anon
  USING (true);
