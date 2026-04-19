"use client";
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { getLocale, setLocale as saveLocale, t as translate, type Locale } from "@/lib/i18n";

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string>) => string;
}

const I18nContext = createContext<I18nContextType>({
  locale: "de",
  setLocale: () => {},
  t: (key) => key,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("de");

  useEffect(() => {
    setLocaleState(getLocale());
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    saveLocale(newLocale);
    setLocaleState(newLocale);
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string>) => translate(key, locale, params),
    [locale]
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
