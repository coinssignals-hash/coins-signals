
-- Create storage bucket for generated news images
INSERT INTO storage.buckets (id, name, public) VALUES ('news-images', 'news-images', true)
ON CONFLICT (id) DO NOTHING;

-- Public read policy
CREATE POLICY "Anyone can view news images"
ON storage.objects FOR SELECT
USING (bucket_id = 'news-images');

-- Service can upload news images
CREATE POLICY "Service can upload news images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'news-images');
