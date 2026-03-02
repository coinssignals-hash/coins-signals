
-- Table for user-defined stock price alerts
CREATE TABLE public.stock_price_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  symbol TEXT NOT NULL,
  symbol_name TEXT,
  target_price NUMERIC NOT NULL,
  direction TEXT NOT NULL DEFAULT 'above', -- 'above' or 'below'
  is_triggered BOOLEAN NOT NULL DEFAULT false,
  triggered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.stock_price_alerts ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own stock alerts"
ON public.stock_price_alerts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own stock alerts"
ON public.stock_price_alerts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stock alerts"
ON public.stock_price_alerts FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stock alerts"
ON public.stock_price_alerts FOR DELETE
USING (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX idx_stock_price_alerts_user ON public.stock_price_alerts(user_id, is_triggered);
CREATE INDEX idx_stock_price_alerts_symbol ON public.stock_price_alerts(symbol);

-- Trigger for updated_at
CREATE TRIGGER update_stock_price_alerts_updated_at
BEFORE UPDATE ON public.stock_price_alerts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
