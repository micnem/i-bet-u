-- Add payment_link column to users table
-- This allows users to add a payment link (Venmo, PayPal, Cash App, etc.) to their profile
-- The payment link will be shown to winners on completed bets to make payments easier

ALTER TABLE users ADD COLUMN payment_link TEXT;

-- Add comment for documentation
COMMENT ON COLUMN users.payment_link IS 'User payment link (e.g., Venmo, PayPal, Cash App URL) shown to bet winners for easy payment';
