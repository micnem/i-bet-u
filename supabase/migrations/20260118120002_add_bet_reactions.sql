-- Bet reactions table (for emoji reactions on bets)
CREATE TABLE bet_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bet_id UUID NOT NULL REFERENCES bets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    emoji VARCHAR(10) NOT NULL CHECK (char_length(emoji) > 0),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    -- Each user can only have one reaction of each emoji type per bet
    UNIQUE(bet_id, user_id, emoji)
);

-- Indexes for performance
CREATE INDEX idx_bet_reactions_bet_id ON bet_reactions(bet_id);
CREATE INDEX idx_bet_reactions_user_id ON bet_reactions(user_id);

-- Enable RLS
ALTER TABLE bet_reactions ENABLE ROW LEVEL SECURITY;

-- RLS policies (only bet participants can view/add reactions)
CREATE POLICY "Bet participants can view reactions"
    ON bet_reactions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM bets
            WHERE bets.id = bet_reactions.bet_id
            AND (bets.creator_id = auth.uid() OR bets.opponent_id = auth.uid())
        )
    );

CREATE POLICY "Bet participants can add reactions"
    ON bet_reactions FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1 FROM bets
            WHERE bets.id = bet_reactions.bet_id
            AND (bets.creator_id = auth.uid() OR bets.opponent_id = auth.uid())
        )
    );

CREATE POLICY "Users can remove their own reactions"
    ON bet_reactions FOR DELETE
    USING (auth.uid() = user_id);
