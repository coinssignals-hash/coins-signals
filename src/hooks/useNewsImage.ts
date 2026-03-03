import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useNewsImage(
  newsId: string | undefined,
  title: string | undefined,
  category: string | undefined,
  sentiment: string | undefined,
  originalImageUrl: string | null | undefined
) {
  const [imageUrl, setImageUrl] = useState<string | null>(originalImageUrl || null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (originalImageUrl) {
      setImageUrl(originalImageUrl);
      setImageError(false);
      return;
    }

    if (!newsId || !title) return;

    // No original image, try to generate
    generateImage();
  }, [newsId, title, originalImageUrl]);

  const generateImage = async () => {
    if (!newsId || !title || isGenerating) return;
    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-news-image', {
        body: { newsId, title, category, sentiment },
      });

      if (!error && data?.success && data?.imageUrl) {
        setImageUrl(data.imageUrl);
      }
    } catch (err) {
      console.error('[useNewsImage] Error generating:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImageError = () => {
    setImageError(true);
    if (!isGenerating && newsId && title) {
      setImageUrl(null);
      generateImage();
    }
  };

  return { imageUrl: imageError ? null : imageUrl, isGenerating, handleImageError, generateImage };
}
