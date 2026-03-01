
-- Add columns to store the closing data when a signal hits TP or SL
ALTER TABLE public.trading_signals
ADD COLUMN IF NOT EXISTS closed_price numeric NULL,
ADD COLUMN IF NOT EXISTS closed_result text NULL;

-- closed_result will be 'tp_hit' or 'sl_hit'
COMMENT ON COLUMN public.trading_signals.closed_price IS 'The live price when the signal was auto-closed';
COMMENT ON COLUMN public.trading_signals.closed_result IS 'Result of the signal: tp_hit or sl_hit';
