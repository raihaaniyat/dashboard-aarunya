-- 010: Add secure QR token column to registrations
-- Used for QR-based pass system. Token is cryptographically random,
-- contains no personal data, and maps securely to a registration record.

-- Step 1: Add qr_token column (nullable initially for backward compat)
ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS qr_token TEXT UNIQUE;

-- Step 2: Create index for O(1) lookup performance
CREATE INDEX IF NOT EXISTS idx_qr_token
  ON registrations(qr_token)
  WHERE qr_token IS NOT NULL;

-- Step 3: Backfill existing paid registrations with secure tokens
-- gen_random_bytes(16) produces 16 cryptographically random bytes
-- encode(..., 'hex') converts to 32-char hex string
-- Prefixed with 'dxk_' for easy identification (36 chars total)
UPDATE registrations
SET qr_token = 'dxk_' || encode(gen_random_bytes(16), 'hex')
WHERE is_paid = true AND qr_token IS NULL;

-- Step 4: Add comment for documentation
COMMENT ON COLUMN registrations.qr_token IS
  'Cryptographically random token for QR-based passes. Format: dxk_ + 32 hex chars. Never contains personal data.';
