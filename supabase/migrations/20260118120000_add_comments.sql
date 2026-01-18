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
CREATE INDEX idx_comments_bet_id ON comments(bet_id);
CREATE INDEX idx_comments_author_id ON comments(author_id);

-- Trigger for updated_at
CREATE TRIGGER update_comments_updated_at
    BEFORE UPDATE ON comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- RLS policies (only bet participants can view/create comments)
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

CREATE POLICY "Users can update their own comments"
    ON comments FOR UPDATE
    USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own comments"
    ON comments FOR DELETE
    USING (auth.uid() = author_id);
