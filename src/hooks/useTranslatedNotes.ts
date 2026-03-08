import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from '@/i18n/LanguageContext';

// In-memory cache: "lang:hash" -> translated text
const cache = new Map<string, string>();

function hashText(text: string): string {
  let h = 0;
  for (let i = 0; i < text.length; i++) {
    h = ((h << 5) - h + text.charCodeAt(i)) | 0;
  }
  return h.toString(36);
}

export function useTranslatedNotes(notes: string | null | undefined) {
  const { language } = useTranslation();
  const [translated, setTranslated] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fetchedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!notes) {
      setTranslated(null);
      return;
    }

    // Spanish is the original language — no translation needed
    if (language === 'es') {
      setTranslated(notes);
      fetchedRef.current = null;
      return;
    }

    const key = `${language}:${hashText(notes)}`;

    if (fetchedRef.current === key) return;

    const cached = cache.get(key);
    if (cached) {
      setTranslated(cached);
      fetchedRef.current = key;
      return;
    }

    let cancelled = false;
    setLoading(true);
    fetchedRef.current = key;

    supabase.functions.invoke('translate-news', {
      body: { text: notes, targetLang: language },
    }).then(({ data, error }) => {
      if (cancelled) return;
      if (error || !data?.translated) {
        setTranslated(notes); // fallback to original
      } else {
        cache.set(key, data.translated);
        setTranslated(data.translated);
      }
    }).catch(() => {
      if (!cancelled) setTranslated(notes);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => { cancelled = true; };
  }, [notes, language]);

  return { translated: translated ?? notes ?? '', loading };
}
