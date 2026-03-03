
-- Add multiple take profit levels and notes to trading_signals
ALTER TABLE public.trading_signals
  ADD COLUMN IF NOT EXISTS take_profit_2 numeric NULL,
  ADD COLUMN IF NOT EXISTS take_profit_3 numeric NULL,
  ADD COLUMN IF NOT EXISTS notes text NULL;
