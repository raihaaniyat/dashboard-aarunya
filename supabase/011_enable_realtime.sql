-- 011: Enable Realtime for Race Tables
-- This ensures the MiniLeaderboard and PublicLeaderboard update automatically when rows are inserted, updated, or deleted.

begin;
  -- Remove the tables from the publication just in case they're already there to prevent errors
  -- (Ignore errors if they aren't there)
  alter publication supabase_realtime drop table race_entries;
  alter publication supabase_realtime drop table laps;
commit;

begin;
  -- Add tables to the realtime publication
  alter publication supabase_realtime add table race_entries;
  alter publication supabase_realtime add table laps;
commit;
