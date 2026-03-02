
-- Table to cache market data (OHLC + indicators) in DB to survive edge function restarts and avoid rate limits
CREATE TABLE public.market_data_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key text NOT NULL UNIQUE,
  symbol text NOT NULL,
  interval text NOT NULL,
  indicator text NOT NULL DEFAULT 'price',
  data jsonb NOT NULL,
  source text,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '5 minutes')
);

-- Index for fast lookups and cleanup
CREATE INDEX idx_market_data_cache_key ON public.market_data_cache (cache_key);
CREATE INDEX idx_market_data_cache_expires ON public.market_data_cache (expires_at);

-- Enable RLS
ALTER TABLE public.market_data_cache ENABLE ROW LEVEL SECURITY;

-- Public read (used by edge functions with anon key)
CREATE POLICY "Anyone can read market data cache"
ON public.market_data_cache FOR SELECT USING (true);

-- Service can manage cache
CREATE POLICY "Service can manage market data cache"
ON public.market_data_cache FOR ALL USING (true) WITH CHECK (true);
