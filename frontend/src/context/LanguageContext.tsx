import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ar } from '../locales/ar';
import { en, type TranslationKey } from '../locales/en';

export type Language = 'ar' | 'en';

interface LanguageContextValue {
  language: Language;
  direction: 'rtl' | 'ltr';
  t: (key: TranslationKey) => string;
  toggle: () => void;
}

const STORAGE_KEY = 'shaghaf.locale';
const LanguageContext = createContext<LanguageContextValue | null>(null);

function readStoredLanguage(): Language {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === 'en' || stored === 'ar' ? stored : 'ar';
  } catch {
    return 'ar';
  }
}

export function LanguageProvider({
  children,
  initialLanguage,
}: {
  children: ReactNode;
  initialLanguage?: Language;
}) {
  const [language, setLanguage] = useState<Language>(() => initialLanguage ?? readStoredLanguage());
  const direction = language === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = direction;
    try {
      window.localStorage.setItem(STORAGE_KEY, language);
    } catch {
      // The application remains usable if storage is disabled or full.
    }
  }, [direction, language]);

  const value = useMemo<LanguageContextValue>(() => ({
    language,
    direction,
    t: (key) => language === 'ar' ? ar[key] : en[key],
    toggle: () => setLanguage((current) => current === 'ar' ? 'en' : 'ar'),
  }), [direction, language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const value = useContext(LanguageContext);
  if (!value) throw new Error('useLanguage must be used inside LanguageProvider');
  return value;
}
