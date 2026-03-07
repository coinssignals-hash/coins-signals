import { useMemo } from 'react';
import { es } from 'date-fns/locale';
import { useTranslation } from '@/i18n/LanguageContext';
import type { Locale } from 'date-fns';

// Lazy-load non-default locales
const localeLoaders: Record<string, () => Promise<Locale>> = {
  en: () => import('date-fns/locale/en-US').then(m => m.enUS),
  pt: () => import('date-fns/locale/pt-BR').then(m => m.ptBR),
  fr: () => import('date-fns/locale/fr').then(m => m.fr),
};

const localeCache: Record<string, Locale> = { es };

/**
 * Returns the date-fns locale matching the current app language.
 * Spanish is bundled; others are loaded on demand and cached.
 */
export function useDateLocale(): Locale {
  const { language } = useTranslation();

  useMemo(() => {
    if (!localeCache[language] && localeLoaders[language]) {
      localeLoaders[language]().then(loc => { localeCache[language] = loc; });
    }
  }, [language]);

  return localeCache[language] ?? es;
}
