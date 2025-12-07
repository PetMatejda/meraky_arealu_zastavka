-- Add initial state fields to meters table
-- This allows setting a starting value and period for each meter

ALTER TABLE meters
ADD COLUMN IF NOT EXISTS start_value DECIMAL(12, 2),
ADD COLUMN IF NOT EXISTS start_period_id UUID REFERENCES billing_periods(id) ON DELETE SET NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_meters_start_period ON meters(start_period_id);

-- Add comment for documentation
COMMENT ON COLUMN meters.start_value IS 'Počáteční hodnota měřáku od start_period_id';
COMMENT ON COLUMN meters.start_period_id IS 'Fakturační období od kterého se počítá spotřeba (pokud je nastaveno, použije se start_value místo předchozího odečtu)';

