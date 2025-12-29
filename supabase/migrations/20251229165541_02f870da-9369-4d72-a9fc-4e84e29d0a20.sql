-- Create trading signals table
CREATE TABLE public.trading_signals (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    currency_pair TEXT NOT NULL,
    datetime TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    status TEXT NOT NULL DEFAULT 'pending',
    probability INTEGER NOT NULL DEFAULT 50,
    trend TEXT NOT NULL DEFAULT 'bullish',
    action TEXT NOT NULL DEFAULT 'BUY',
    entry_price DECIMAL(20, 8) NOT NULL,
    take_profit DECIMAL(20, 8) NOT NULL,
    stop_loss DECIMAL(20, 8) NOT NULL,
    support DECIMAL(20, 8),
    resistance DECIMAL(20, 8),
    session_data JSONB DEFAULT '[]'::jsonb,
    analysis_data JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.trading_signals ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (signals are visible to everyone)
CREATE POLICY "Anyone can view trading signals" 
ON public.trading_signals 
FOR SELECT 
USING (true);

-- Create policy for authenticated users to insert (for admin/backend)
CREATE POLICY "Authenticated users can insert signals" 
ON public.trading_signals 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Create policy for authenticated users to update
CREATE POLICY "Authenticated users can update signals" 
ON public.trading_signals 
FOR UPDATE 
TO authenticated
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_trading_signals_updated_at
BEFORE UPDATE ON public.trading_signals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for trading signals
ALTER PUBLICATION supabase_realtime ADD TABLE public.trading_signals;

-- Insert sample data
INSERT INTO public.trading_signals (currency_pair, datetime, status, probability, trend, action, entry_price, take_profit, stop_loss, support, resistance, session_data, analysis_data) VALUES
('EUR/USD', now() - interval '2 hours', 'active', 85, 'bullish', 'BUY', 1.0875, 1.0920, 1.0850, 1.0850, 1.0920, '[{"session": "London", "volume": "Alto", "volatility": "Media"}, {"session": "New York", "volume": "Muy Alto", "volatility": "Alta"}]', '[{"label": "RSI", "value": 65}, {"label": "MACD", "value": 78}, {"label": "BB", "value": 55}, {"label": "EMA", "value": 82}]'),
('GBP/USD', now() - interval '4 hours', 'active', 72, 'bearish', 'SELL', 1.2650, 1.2580, 1.2700, 1.2580, 1.2700, '[{"session": "London", "volume": "Medio", "volatility": "Alta"}]', '[{"label": "RSI", "value": 35}, {"label": "MACD", "value": 42}, {"label": "BB", "value": 60}, {"label": "EMA", "value": 38}]'),
('USD/JPY', now() - interval '1 hour', 'pending', 68, 'bullish', 'BUY', 149.50, 150.20, 148.90, 148.90, 150.20, '[{"session": "Tokyo", "volume": "Alto", "volatility": "Baja"}]', '[{"label": "RSI", "value": 58}, {"label": "MACD", "value": 62}, {"label": "BB", "value": 70}, {"label": "EMA", "value": 65}]'),
('XAU/USD', now() - interval '30 minutes', 'active', 91, 'bullish', 'BUY', 2045.50, 2065.00, 2035.00, 2035.00, 2065.00, '[{"session": "London", "volume": "Muy Alto", "volatility": "Alta"}, {"session": "New York", "volume": "Alto", "volatility": "Media"}]', '[{"label": "RSI", "value": 72}, {"label": "MACD", "value": 85}, {"label": "BB", "value": 68}, {"label": "EMA", "value": 88}]'),
('BTC/USD', now(), 'active', 78, 'bullish', 'BUY', 43250.00, 44500.00, 42800.00, 42800.00, 44500.00, '[{"session": "24/7", "volume": "Alto", "volatility": "Muy Alta"}]', '[{"label": "RSI", "value": 62}, {"label": "MACD", "value": 70}, {"label": "BB", "value": 55}, {"label": "EMA", "value": 75}]');