-- Fix 1: Restrict trading_signals INSERT/UPDATE to admin role only
DROP POLICY IF EXISTS "Authenticated users can insert signals" ON public.trading_signals;
DROP POLICY IF EXISTS "Authenticated users can update signals" ON public.trading_signals;

CREATE POLICY "Only admins can insert signals"
ON public.trading_signals FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update signals"
ON public.trading_signals FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Fix 2: Restrict market_data_cache writes to service_role only
DROP POLICY IF EXISTS "Service can manage market data cache" ON public.market_data_cache;

CREATE POLICY "Service can manage market data cache"
ON public.market_data_cache FOR ALL
TO service_role
USING (true) WITH CHECK (true);