
ALTER TABLE public.trading_journal
  ADD COLUMN IF NOT EXISTS signal_id uuid REFERENCES public.trading_signals(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS signal_arrived_at timestamptz,
  ADD COLUMN IF NOT EXISTS executed_at timestamptz,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz;
