-- Add user achievements table for tracking unlocked badges
-- Achievement definitions are stored in application code for flexibility

-- Create user_achievements table to track which achievements each user has unlocked
CREATE TABLE user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_id VARCHAR(50) NOT NULL,
    unlocked_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    -- Ensure each user can only have each achievement once
    UNIQUE(user_id, achievement_id)
);

-- Index for fast lookups by user
CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);

-- Index for querying specific achievements across users
CREATE INDEX idx_user_achievements_achievement_id ON user_achievements(achievement_id);

-- Enable RLS
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Users can view their own achievements
CREATE POLICY "Users can view their own achievements"
    ON user_achievements FOR SELECT
    USING (auth.uid() = user_id);

-- Users can view friends' achievements (for profile viewing)
CREATE POLICY "Users can view friends achievements"
    ON user_achievements FOR SELECT
    USING (
        user_id IN (
            SELECT friend_id FROM friendships
            WHERE user_id = auth.uid() AND status = 'accepted'
            UNION
            SELECT user_id FROM friendships
            WHERE friend_id = auth.uid() AND status = 'accepted'
        )
    );

-- Only the system (via service role) can insert achievements
-- This is enforced by not having an INSERT policy for authenticated users
