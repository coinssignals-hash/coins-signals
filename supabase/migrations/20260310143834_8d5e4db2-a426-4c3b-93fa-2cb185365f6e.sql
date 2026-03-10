-- Table to track API and AI usage per provider
CREATE TABLE public.api_usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,           -- e.g. 'lovable_ai', 'alpha_vantage', 'polygon', 'twelve_data', 'fmp', 'finnhub', 'newsapi', 'marketaux', 'rapidapi', 'yahoo_finance'
  function_name text NOT NULL,      -- edge function that made the call
  model text,                       -- AI model used (null for non-AI APIs)
  tokens_input integer DEFAULT 0,   -- prompt tokens (AI only)
  tokens_output integer DEFAULT 0,  -- completion tokens (AI only)
  tokens_total integer DEFAULT 0,   -- total tokens
  estimated_cost numeric(10,6) DEFAULT 0, -- estimated cost in USD
  response_status integer,          -- HTTP status code
  latency_ms integer,               -- response time
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for efficient querying
CREATE INDEX idx_api_usage_provider_date ON public.api_usage_logs (provider, created_at DESC);
CREATE INDEX idx_api_usage_function ON public.api_usage_logs (function_name, created_at DESC);

-- Enable RLS
ALTER TABLE public.api_usage_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can read usage logs
CREATE POLICY "Admins can view API usage logs"
ON public.api_usage_logs FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Only service role can insert (edge functions use service role)
CREATE POLICY "Service can insert API usage logs"
ON public.api_usage_logs FOR ALL TO service_role
USING (true) WITH CHECK (true);