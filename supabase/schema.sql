-- IBetU Database Schema for Supabase
-- Run this in the Supabase SQL editor to create the database structure

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types (enums)
CREATE TYPE bet_status AS ENUM ('pending', 'active', 'completed', 'declined', 'expired');
CREATE TYPE bet_outcome AS ENUM ('win', 'loss', 'pending', 'disputed');
CREATE TYPE verification_method AS ENUM ('mutual_agreement', 'third_party', 'photo_proof', 'honor_system');
CREATE TYPE transaction_type AS ENUM ('deposit', 'withdrawal', 'bet_win', 'bet_loss', 'bet_hold', 'bet_refund');
CREATE TYPE friend_request_status AS ENUM ('pending', 'accepted', 'declined');
CREATE TYPE added_via_type AS ENUM ('qr', 'phone', 'nickname');
CREATE TYPE card_type AS ENUM ('credit_card', 'debit_card');

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    avatar_url TEXT,
    wallet_balance DECIMAL(10, 2) DEFAULT 0.00 NOT NULL,
    total_bets INTEGER DEFAULT 0 NOT NULL,
    bets_won INTEGER DEFAULT 0 NOT NULL,
    bets_lost INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Friendships table (bidirectional relationship)
CREATE TABLE friendships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Transactions table
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type transaction_type NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    bet_id UUID REFERENCES bets(id) ON DELETE SET NULL,
    description VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Payment methods table
CREATE TABLE payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type card_type NOT NULL,
    last4 VARCHAR(4) NOT NULL,
    brand VARCHAR(20) NOT NULL,
    expiry_month INTEGER NOT NULL CHECK (expiry_month >= 1 AND expiry_month <= 12),
    expiry_year INTEGER NOT NULL,
    is_default BOOLEAN DEFAULT FALSE NOT NULL,
    stripe_payment_method_id VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_friendships_user_id ON friendships(user_id);
CREATE INDEX idx_friendships_friend_id ON friendships(friend_id);
CREATE INDEX idx_friendships_status ON friendships(status);
CREATE INDEX idx_bets_creator_id ON bets(creator_id);
CREATE INDEX idx_bets_opponent_id ON bets(opponent_id);
CREATE INDEX idx_bets_status ON bets(status);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_bet_id ON transactions(bet_id);
CREATE INDEX idx_payment_methods_user_id ON payment_methods(user_id);

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

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

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

-- Transactions policies
CREATE POLICY "Users can view their transactions"
    ON transactions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "System can insert transactions"
    ON transactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Payment methods policies
CREATE POLICY "Users can view their payment methods"
    ON payment_methods FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their payment methods"
    ON payment_methods FOR ALL
    USING (auth.uid() = user_id);

-- Function to add balance to user wallet
CREATE OR REPLACE FUNCTION add_balance(user_id UUID, amount DECIMAL)
RETURNS DECIMAL AS $$
DECLARE
    new_balance DECIMAL;
BEGIN
    UPDATE users
    SET wallet_balance = wallet_balance + amount
    WHERE id = user_id
    RETURNING wallet_balance INTO new_balance;

    RETURN new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to deduct balance from user wallet
CREATE OR REPLACE FUNCTION deduct_balance(user_id UUID, amount DECIMAL)
RETURNS DECIMAL AS $$
DECLARE
    new_balance DECIMAL;
BEGIN
    UPDATE users
    SET wallet_balance = wallet_balance - amount
    WHERE id = user_id AND wallet_balance >= amount
    RETURNING wallet_balance INTO new_balance;

    IF new_balance IS NULL THEN
        RAISE EXCEPTION 'Insufficient balance';
    END IF;

    RETURN new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
