
-- Add chart_image_url column to trading_signals
ALTER TABLE public.trading_signals ADD COLUMN IF NOT EXISTS chart_image_url text;

-- Create signal-charts storage bucket (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('signal-charts', 'signal-charts', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to read signal charts
CREATE POLICY "Anyone can view signal charts"
ON storage.objects FOR SELECT
USING (bucket_id = 'signal-charts');

-- Allow service role to upload signal charts
CREATE POLICY "Service can upload signal charts"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'signal-charts');

-- Allow service role to update signal charts
CREATE POLICY "Service can update signal charts"
ON storage.objects FOR UPDATE
USING (bucket_id = 'signal-charts');
