ALTER TABLE public.trading_signals ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'server';

COMMENT ON COLUMN public.trading_signals.source IS 'Origin of the signal: server, ai-center, admin';