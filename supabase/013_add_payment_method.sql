-- 013: Add payment_method column to registrations
-- Tracks whether the registration was paid via 'online' (Razorpay) or 'cash' (Desk)

-- Step 1: Add payment_method column with default 'online'
ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS payment_method TEXT
  DEFAULT 'online';

-- Step 2: Add CHECK constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_payment_method'
  ) THEN
    ALTER TABLE registrations
      ADD CONSTRAINT check_payment_method
      CHECK (payment_method IN ('online', 'cash'));
  END IF;
END$$;

-- Step 3: Add comment for documentation
COMMENT ON COLUMN registrations.payment_method IS
  'Payment collection method: online (Razorpay) or cash (Desk proxy).';
