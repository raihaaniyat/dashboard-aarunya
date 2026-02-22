-- 012: Add registration_mode column to registrations
-- Tracks whether registration was made online (website) or offline (venue desk).

-- Step 1: Add registration_mode column with default 'online'
ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS registration_mode TEXT
  DEFAULT 'online';

-- Step 2: Add CHECK constraint (separate command for backward compat)
-- Only if constraint doesn't already exist:
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_registration_mode'
  ) THEN
    ALTER TABLE registrations
      ADD CONSTRAINT check_registration_mode
      CHECK (registration_mode IN ('online', 'offline'));
  END IF;
END$$;

-- Step 3: Add comment for documentation
COMMENT ON COLUMN registrations.registration_mode IS
  'Registration channel: online (website) or offline (venue desk).';
