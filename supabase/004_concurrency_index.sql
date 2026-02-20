-- 004: Concurrency control – only ONE rider can be 'racing' at a time
-- A unique partial index on a constant expression guarantees at most one row.

CREATE UNIQUE INDEX IF NOT EXISTS idx_only_one_racing
  ON race_entries ((TRUE))
  WHERE race_status = 'racing';
