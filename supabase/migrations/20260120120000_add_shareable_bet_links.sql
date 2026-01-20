-- Migration: Add shareable bet links
-- This allows bets to be created without an opponent and shared via unique tokens

-- Add share_token column for shareable links
ALTER TABLE bets ADD COLUMN share_token VARCHAR(32) UNIQUE;

-- Make opponent_id nullable for shareable bets
ALTER TABLE bets ALTER COLUMN opponent_id DROP NOT NULL;

-- Drop the old constraint that requires creator != opponent (since opponent can now be null)
ALTER TABLE bets DROP CONSTRAINT IF EXISTS bets_creator_id_opponent_id_check;
ALTER TABLE bets DROP CONSTRAINT IF EXISTS bets_check;

-- Add new constraint that only applies when opponent_id is not null
ALTER TABLE bets ADD CONSTRAINT bets_creator_opponent_different
    CHECK (opponent_id IS NULL OR creator_id != opponent_id);

-- Create index on share_token for fast lookups
CREATE INDEX idx_bets_share_token ON bets(share_token) WHERE share_token IS NOT NULL;

-- Function to generate a unique share token
CREATE OR REPLACE FUNCTION generate_share_token()
RETURNS VARCHAR(32) AS $$
DECLARE
    chars TEXT := 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result VARCHAR(32) := '';
    i INTEGER;
BEGIN
    FOR i IN 1..16 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Update RLS policy for bets to allow viewing bets via share_token
-- First drop the existing policy
DROP POLICY IF EXISTS "Users can view their bets" ON bets;

-- Create new policy that allows viewing own bets OR bets with share_token (for public access)
CREATE POLICY "Users can view their bets or shared bets"
    ON bets FOR SELECT
    USING (
        auth.uid() = creator_id
        OR auth.uid() = opponent_id
        OR share_token IS NOT NULL
    );

-- Policy for updating: participants only (with NULL handling for opponent_id)
DROP POLICY IF EXISTS "Participants can update bets" ON bets;

CREATE POLICY "Participants can update bets"
    ON bets FOR UPDATE
    USING (auth.uid() = creator_id OR auth.uid() = opponent_id);
