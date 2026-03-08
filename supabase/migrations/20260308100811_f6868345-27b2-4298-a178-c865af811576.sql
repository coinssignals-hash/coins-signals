
CREATE TABLE public.trading_journal (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  trade_date DATE NOT NULL DEFAULT CURRENT_DATE,
  pair TEXT NOT NULL,
  action TEXT NOT NULL DEFAULT 'BUY',
  entry_price NUMERIC NOT NULL,
  exit_price NUMERIC NOT NULL,
  lot_size NUMERIC NOT NULL DEFAULT 0.1,
  stop_loss NUMERIC,
  take_profit NUMERIC,
  result TEXT NOT NULL DEFAULT 'win',
  pips NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.trading_journal ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own journal entries"
  ON public.trading_journal FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own journal entries"
  ON public.trading_journal FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own journal entries"
  ON public.trading_journal FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own journal entries"
  ON public.trading_journal FOR DELETE
  USING (auth.uid() = user_id);
