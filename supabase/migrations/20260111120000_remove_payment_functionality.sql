-- Migration: Remove payment functionality
-- This migration removes wallet, transactions, and payment methods
-- to simplify the MVP to just show amounts owed/won from bets

-- Drop RLS policies first
DROP POLICY IF EXISTS "Users can view their transactions" ON transactions;
DROP POLICY IF EXISTS "System can insert transactions" ON transactions;
DROP POLICY IF EXISTS "Users can view their payment methods" ON payment_methods;
DROP POLICY IF EXISTS "Users can manage their payment methods" ON payment_methods;

-- Drop indexes
DROP INDEX IF EXISTS idx_transactions_user_id;
DROP INDEX IF EXISTS idx_transactions_bet_id;
DROP INDEX IF EXISTS idx_payment_methods_user_id;

-- Drop tables
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS payment_methods;

-- Drop balance-related functions
DROP FUNCTION IF EXISTS add_balance(UUID, DECIMAL);
DROP FUNCTION IF EXISTS deduct_balance(UUID, DECIMAL);

-- Remove wallet_balance column from users
ALTER TABLE users DROP COLUMN IF EXISTS wallet_balance;

-- Drop unused enum types
DROP TYPE IF EXISTS transaction_type;
DROP TYPE IF EXISTS card_type;
