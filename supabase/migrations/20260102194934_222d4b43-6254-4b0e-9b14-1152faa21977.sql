-- Create table for AI analysis cache
CREATE TABLE public.ai_analysis_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL,
  analysis_type TEXT NOT NULL,
  analysis_data JSONB NOT NULL,
  current_price NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '1 hour'),
  
  -- Unique constraint for symbol + type combination
  CONSTRAINT unique_symbol_analysis UNIQUE (symbol, analysis_type)
);

-- Enable RLS
ALTER TABLE public.ai_analysis_cache ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read cache (public data)
CREATE POLICY "Anyone can read AI analysis cache"
ON public.ai_analysis_cache
FOR SELECT
USING (true);

-- Allow service role to insert/update/delete
CREATE POLICY "Service can manage AI analysis cache"
ON public.ai_analysis_cache
FOR ALL
USING (true)
WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX idx_ai_analysis_symbol_type ON public.ai_analysis_cache (symbol, analysis_type);
CREATE INDEX idx_ai_analysis_expires ON public.ai_analysis_cache (expires_at);

-- Add comment
COMMENT ON TABLE public.ai_analysis_cache IS 'Cache for AI-generated market analysis to reduce API calls and improve UX';