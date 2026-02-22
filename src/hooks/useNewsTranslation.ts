import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from '@/i18n/LanguageContext';
import { toast } from 'sonner';

interface TranslationCache {
  [key: string]: string;
}

const translationCache: TranslationCache = {};

function getCacheKey(text: string, lang: string): string {
  return `${lang}:${text.slice(0, 100)}`;
}

export function useNewsTranslation() {
  const { language } = useTranslation();
  const [translating, setTranslating] = useState<Record<string, boolean>>({});
  const [translations, setTranslations] = useState<Record<string, string>>({});

  const translateText = useCallback(async (newsId: string, text: string, targetLang?: string) => {
    const lang = targetLang || (language === 'es' ? 'en' : 'es');
    const cacheKey = getCacheKey(text, lang);

    // Check cache first
    if (translationCache[cacheKey]) {
      setTranslations(prev => ({ ...prev, [newsId]: translationCache[cacheKey] }));
      return translationCache[cacheKey];
    }

    setTranslating(prev => ({ ...prev, [newsId]: true }));

    try {
      const { data, error } = await supabase.functions.invoke('translate-news', {
        body: { text, targetLang: lang },
      });

      if (error) throw error;

      const translated = data?.translatedText || text;
      translationCache[cacheKey] = translated;
      setTranslations(prev => ({ ...prev, [newsId]: translated }));
      return translated;
    } catch (err: any) {
      console.error('Translation error:', err);
      if (err?.message?.includes('429')) {
        toast.error('Límite de traducción alcanzado. Intenta más tarde.');
      } else if (err?.message?.includes('402')) {
        toast.error('Créditos insuficientes para traducción.');
      } else {
        toast.error('Error al traducir la noticia.');
      }
      return null;
    } finally {
      setTranslating(prev => ({ ...prev, [newsId]: false }));
    }
  }, [language]);

  const clearTranslation = useCallback((newsId: string) => {
    setTranslations(prev => {
      const next = { ...prev };
      delete next[newsId];
      return next;
    });
  }, []);

  return { translateText, clearTranslation, translations, translating };
}
