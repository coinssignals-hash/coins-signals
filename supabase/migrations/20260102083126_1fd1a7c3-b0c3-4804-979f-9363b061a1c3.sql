-- Create table for favorite currencies
CREATE TABLE public.favorite_currencies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  currency TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, currency)
);

-- Enable Row Level Security
ALTER TABLE public.favorite_currencies ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own favorite currencies"
ON public.favorite_currencies
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can add favorite currencies"
ON public.favorite_currencies
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorite currencies"
ON public.favorite_currencies
FOR DELETE
USING (auth.uid() = user_id);

-- Add index for faster lookups
CREATE INDEX idx_favorite_currencies_user_id ON public.favorite_currencies(user_id);