-- Add updated_at column to bets table for tracking when bets are modified
-- This is needed for the notification center to show recent activity

ALTER TABLE bets ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL;

-- Create trigger to auto-update the updated_at timestamp
CREATE TRIGGER update_bets_updated_at
    BEFORE UPDATE ON bets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Update existing rows to have updated_at set to created_at
UPDATE bets SET updated_at = created_at WHERE updated_at IS NULL;
