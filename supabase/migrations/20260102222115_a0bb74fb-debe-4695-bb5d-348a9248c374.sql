-- Create a table for caching news AI analysis
CREATE TABLE public.news_ai_analysis_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  news_id TEXT NOT NULL UNIQUE,
  news_title TEXT NOT NULL,
  analysis_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '7 days')
);

-- Create index for faster lookups
CREATE INDEX idx_news_ai_analysis_cache_news_id ON public.news_ai_analysis_cache(news_id);
CREATE INDEX idx_news_ai_analysis_cache_expires_at ON public.news_ai_analysis_cache(expires_at);

-- Enable RLS
ALTER TABLE public.news_ai_analysis_cache ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read cached analysis (public data)
CREATE POLICY "Anyone can read news AI analysis cache"
ON public.news_ai_analysis_cache
FOR SELECT
USING (true);

-- Allow service to manage cache (edge functions use service role)
CREATE POLICY "Service can manage news AI analysis cache"
ON public.news_ai_analysis_cache
FOR ALL
USING (true)
WITH CHECK (true);

-- Add comment for documentation
COMMENT ON TABLE public.news_ai_analysis_cache IS 'Cache for AI-generated news analysis to avoid redundant API calls';