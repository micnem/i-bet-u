-- IBetU Database Schema for Supabase
-- Run this in the Supabase SQL editor to create the database structure

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types (enums)
CREATE TYPE bet_status AS ENUM ('pending', 'active', 'completed', 'declined', 'expired');
CREATE TYPE bet_outcome AS ENUM ('win', 'loss', 'pending', 'disputed');
CREATE TYPE verification_method AS ENUM ('mutual_agreement', 'third_party', 'photo_proof', 'honor_system');
CREATE TYPE friend_request_status AS ENUM ('pending', 'accepted', 'declined');
CREATE TYPE added_via_type AS ENUM ('qr', 'phone', 'nickname');

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    avatar_url TEXT,
    payment_link TEXT,
    total_bets INTEGER DEFAULT 0 NOT NULL,
    bets_won INTEGER DEFAULT 0 NOT NULL,
    bets_lost INTEGER DEFAULT 0 NOT NULL,
    email_notifications_enabled BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Friendships table (bidirectional relationship)
CREATE TABLE friendships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    friend_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status friend_request_status DEFAULT 'pending' NOT NULL,
    added_via added_via_type NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, friend_id),
    CHECK (user_id != friend_id)
);

-- Bets table
CREATE TABLE bets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) DEFAULT 'USD' NOT NULL,
    creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    opponent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status bet_status DEFAULT 'pending' NOT NULL,
    outcome bet_outcome,
    winner_id UUID REFERENCES users(id),
    verification_method verification_method NOT NULL,
    deadline TIMESTAMPTZ NOT NULL,
    creator_approved BOOLEAN DEFAULT FALSE NOT NULL,
    opponent_approved BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    accepted_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    CHECK (creator_id != opponent_id)
);

-- Payment reminders table (for tracking when users nudge others about owed amounts)
CREATE TABLE payment_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CHECK (sender_id != recipient_id)
);

-- Comments table (for bet discussions)
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bet_id UUID NOT NULL REFERENCES bets(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 1000),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_friendships_user_id ON friendships(user_id);
CREATE INDEX idx_friendships_friend_id ON friendships(friend_id);
CREATE INDEX idx_friendships_status ON friendships(status);
CREATE INDEX idx_bets_creator_id ON bets(creator_id);
CREATE INDEX idx_bets_opponent_id ON bets(opponent_id);
CREATE INDEX idx_bets_status ON bets(status);
CREATE INDEX idx_payment_reminders_sender_id ON payment_reminders(sender_id);
CREATE INDEX idx_payment_reminders_recipient_id ON payment_reminders(recipient_id);
CREATE INDEX idx_comments_bet_id ON comments(bet_id);
CREATE INDEX idx_comments_author_id ON comments(author_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_friendships_updated_at
    BEFORE UPDATE ON friendships
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at
    BEFORE UPDATE ON comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile"
    ON users FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can view friends profiles"
    ON users FOR SELECT
    USING (
        id IN (
            SELECT friend_id FROM friendships
            WHERE user_id = auth.uid() AND status = 'accepted'
        )
    );

CREATE POLICY "Users can update their own profile"
    ON users FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
    ON users FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Friendships policies
CREATE POLICY "Users can view their friendships"
    ON friendships FOR SELECT
    USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can create friend requests"
    ON friendships FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update friendships they're part of"
    ON friendships FOR UPDATE
    USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can delete their friendships"
    ON friendships FOR DELETE
    USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Bets policies
CREATE POLICY "Users can view their bets"
    ON bets FOR SELECT
    USING (auth.uid() = creator_id OR auth.uid() = opponent_id);

CREATE POLICY "Users can create bets"
    ON bets FOR INSERT
    WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Participants can update bets"
    ON bets FOR UPDATE
    USING (auth.uid() = creator_id OR auth.uid() = opponent_id);

-- Payment reminders policies
CREATE POLICY "Users can view their sent reminders"
    ON payment_reminders FOR SELECT
    USING (auth.uid() = sender_id);

CREATE POLICY "Users can view reminders sent to them"
    ON payment_reminders FOR SELECT
    USING (auth.uid() = recipient_id);

CREATE POLICY "Users can send reminders"
    ON payment_reminders FOR INSERT
    WITH CHECK (auth.uid() = sender_id);

-- Comments policies (only bet participants can view/create comments)
CREATE POLICY "Bet participants can view comments"
    ON comments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM bets
            WHERE bets.id = comments.bet_id
            AND (bets.creator_id = auth.uid() OR bets.opponent_id = auth.uid())
        )
    );

CREATE POLICY "Bet participants can create comments"
    ON comments FOR INSERT
    WITH CHECK (
        auth.uid() = author_id
        AND EXISTS (
            SELECT 1 FROM bets
            WHERE bets.id = comments.bet_id
            AND (bets.creator_id = auth.uid() OR bets.opponent_id = auth.uid())
        )
    );

CREATE POLICY "Users can delete their own comments"
    ON comments FOR DELETE
    USING (auth.uid() = author_id);

-- User achievements table (for tracking unlocked badges)
CREATE TABLE user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_id VARCHAR(50) NOT NULL,
    unlocked_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, achievement_id)
);

-- Index for fast lookups by user
CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX idx_user_achievements_achievement_id ON user_achievements(achievement_id);

-- Enable RLS on user_achievements
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Users can view their own achievements
CREATE POLICY "Users can view their own achievements"
    ON user_achievements FOR SELECT
    USING (auth.uid() = user_id);

-- Users can view friends' achievements
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

-- Function to increment wins count
CREATE OR REPLACE FUNCTION increment_wins(user_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE users
    SET bets_won = bets_won + 1,
        total_bets = total_bets + 1
    WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment losses count
CREATE OR REPLACE FUNCTION increment_losses(user_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE users
    SET bets_lost = bets_lost + 1,
        total_bets = total_bets + 1
    WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
