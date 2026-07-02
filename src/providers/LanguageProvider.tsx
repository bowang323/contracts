import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  interpolate,
  LOCALE_STORAGE_KEY,
  translations,
  type Locale,
  type TranslationKey,
} from "@/lib/i18n";

type LanguageContextValue = {
  locale: Locale;
  hasChosenLocale: boolean;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey, values?: Record<string, string | number>) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function readStoredLocale(): Locale {
  if (typeof window === "undefined") return "en";
  return localStorage.getItem(LOCALE_STORAGE_KEY) === "zh" ? "zh" : "en";
}

function readHasChosenLocale(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(LOCALE_STORAGE_KEY) !== null;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(readStoredLocale);
  const [hasChosenLocale, setHasChosenLocale] = useState(readHasChosenLocale);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    localStorage.setItem(LOCALE_STORAGE_KEY, next);
    setHasChosenLocale(true);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
  }, [locale]);

  const t = useCallback(
    (key: TranslationKey, values?: Record<string, string | number>) => {
      const message = translations[locale][key];
      return values ? interpolate(message, values) : message;
    },
    [locale],
  );

  const value = useMemo(
    () => ({ locale, hasChosenLocale, setLocale, t }),
    [locale, hasChosenLocale, setLocale, t],
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}
