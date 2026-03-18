import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

const translationCache = new Map<string, string>();

export function useTopicTranslation() {
  const [translating, setTranslating] = useState(false);

  const translateText = useCallback(async (text: string, targetLang: string): Promise<string> => {
    if (!text || targetLang === 'es') return text; // Original is Spanish

    const cacheKey = `${text.slice(0, 40)}_${targetLang}`;
    if (translationCache.has(cacheKey)) return translationCache.get(cacheKey)!;

    try {
      setTranslating(true);
      const { data, error } = await supabase.functions.invoke('translate-news', {
        body: { text, targetLang },
      });

      if (error || !data?.translation) return text;
      translationCache.set(cacheKey, data.translation);
      return data.translation;
    } catch {
      return text;
    } finally {
      setTranslating(false);
    }
  }, []);

  const translateTopic = useCallback(async (
    topic: { title: string; description: string | null; option_a: string; option_b: string },
    lang: string
  ) => {
    if (lang === 'es') return topic;

    const [title, description, option_a, option_b] = await Promise.all([
      translateText(topic.title, lang),
      topic.description ? translateText(topic.description, lang) : Promise.resolve(null),
      translateText(topic.option_a, lang),
      translateText(topic.option_b, lang),
    ]);

    return { title, description, option_a, option_b };
  }, [translateText]);

  return { translateTopic, translating };
}
