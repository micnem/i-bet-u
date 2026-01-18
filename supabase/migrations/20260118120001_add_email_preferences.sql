-- Add email notification preferences to users table
ALTER TABLE users ADD COLUMN email_notifications_enabled BOOLEAN DEFAULT TRUE NOT NULL;

-- Add comment explaining the column
COMMENT ON COLUMN users.email_notifications_enabled IS 'Whether the user wants to receive email notifications (bet invites, reminders, comments, etc.)';
