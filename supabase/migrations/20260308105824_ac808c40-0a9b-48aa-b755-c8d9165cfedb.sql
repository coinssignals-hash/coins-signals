
-- Add user_id to push_subscriptions for targeted notifications
ALTER TABLE public.push_subscriptions ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for efficient user-based lookups
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON public.push_subscriptions(user_id);

-- Add unique constraint on user_id to allow one subscription per user (latest wins)
-- Not adding unique since a user could have multiple devices
