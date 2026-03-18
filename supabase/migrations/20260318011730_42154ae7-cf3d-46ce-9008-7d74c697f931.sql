
CREATE TABLE public.imported_trades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  broker_source text NOT NULL DEFAULT 'generic',
  connection_id uuid REFERENCES public.user_broker_connections(id) ON DELETE SET NULL,
  external_trade_id text,
  symbol text NOT NULL,
  side text NOT NULL DEFAULT 'buy',
  quantity numeric NOT NULL DEFAULT 0,
  entry_price numeric NOT NULL DEFAULT 0,
  exit_price numeric,
  entry_time timestamptz NOT NULL DEFAULT now(),
  exit_time timestamptz,
  commission numeric DEFAULT 0,
  swap numeric DEFAULT 0,
  profit numeric DEFAULT 0,
  net_profit numeric GENERATED ALWAYS AS (COALESCE(profit, 0) - COALESCE(commission, 0) - COALESCE(swap, 0)) STORED,
  status text NOT NULL DEFAULT 'closed',
  notes text,
  raw_data jsonb DEFAULT '{}'::jsonb,
  import_batch_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, broker_source, external_trade_id)
);

ALTER TABLE public.imported_trades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own imported trades" ON public.imported_trades FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own imported trades" ON public.imported_trades FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own imported trades" ON public.imported_trades FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own imported trades" ON public.imported_trades FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_imported_trades_user ON public.imported_trades(user_id);
CREATE INDEX idx_imported_trades_symbol ON public.imported_trades(symbol);
CREATE INDEX idx_imported_trades_entry_time ON public.imported_trades(entry_time);
CREATE INDEX idx_imported_trades_batch ON public.imported_trades(import_batch_id);
