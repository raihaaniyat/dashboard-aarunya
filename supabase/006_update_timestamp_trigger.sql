-- 006: Auto-update updated_at on race_entries

CREATE OR REPLACE FUNCTION update_race_entries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_race_entries_updated_at ON race_entries;

CREATE TRIGGER trg_race_entries_updated_at
  BEFORE UPDATE ON race_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_race_entries_updated_at();
