-- Create forum-images storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('forum-images', 'forum-images', true);

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload forum images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'forum-images');

-- Allow anyone to view forum images
CREATE POLICY "Anyone can view forum images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'forum-images');

-- Allow users to delete their own uploads
CREATE POLICY "Users can delete own forum images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'forum-images' AND (storage.foldername(name))[1] = auth.uid()::text);