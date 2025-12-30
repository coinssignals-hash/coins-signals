-- Create table for favorite symbols
CREATE TABLE public.favorite_symbols (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  symbol TEXT NOT NULL,
  symbol_name TEXT,
  symbol_type TEXT NOT NULL DEFAULT 'Forex',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add unique constraint to prevent duplicates
ALTER TABLE public.favorite_symbols 
ADD CONSTRAINT unique_user_symbol UNIQUE (user_id, symbol);

-- Enable RLS
ALTER TABLE public.favorite_symbols ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own favorite symbols"
ON public.favorite_symbols
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can add favorite symbols"
ON public.favorite_symbols
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their favorite symbols"
ON public.favorite_symbols
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_favorite_symbols_user_id ON public.favorite_symbols(user_id);