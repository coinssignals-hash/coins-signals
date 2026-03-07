import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { loadTranslations, getTranslationsSync, type Language, LANGUAGE_LABELS, LANGUAGE_FLAGS } from './translations';

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

const STORAGE_KEY = 'app-language';

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && ['es', 'en', 'pt', 'fr'].includes(stored)) return stored as Language;
    return 'es';
  });

  const [, setReady] = useState(0);

  // Pre-load the active language on mount / change
  useEffect(() => {
    loadTranslations(language).then(() => setReady(r => r + 1));
  }, [language]);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEY, lang);
  }, []);

  const t = useCallback((key: string): string => {
    const dict = getTranslationsSync(language) as Record<string, string>;
    return dict[key] ?? key;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useTranslation must be used within LanguageProvider');
  return ctx;
}

export { LANGUAGE_LABELS, LANGUAGE_FLAGS };
export type { Language };
