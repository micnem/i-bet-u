-- Migration: Add payment reminders table
-- This migration adds a table to track when users send payment reminders to friends

-- Create payment_reminders table
CREATE TABLE IF NOT EXISTS payment_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CHECK (sender_id != recipient_id)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_payment_reminders_sender_id ON payment_reminders(sender_id);
CREATE INDEX IF NOT EXISTS idx_payment_reminders_recipient_id ON payment_reminders(recipient_id);

-- Enable RLS
ALTER TABLE payment_reminders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then recreate
DROP POLICY IF EXISTS "Users can view their sent reminders" ON payment_reminders;
DROP POLICY IF EXISTS "Users can view reminders sent to them" ON payment_reminders;
DROP POLICY IF EXISTS "Users can send reminders" ON payment_reminders;

-- Add RLS policies
CREATE POLICY "Users can view their sent reminders"
    ON payment_reminders FOR SELECT
    USING (auth.uid() = sender_id);

CREATE POLICY "Users can view reminders sent to them"
    ON payment_reminders FOR SELECT
    USING (auth.uid() = recipient_id);

CREATE POLICY "Users can send reminders"
    ON payment_reminders FOR INSERT
    WITH CHECK (auth.uid() = sender_id);
