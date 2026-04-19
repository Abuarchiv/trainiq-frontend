import de from "@/messages/de.json";
import en from "@/messages/en.json";

export type Locale = "de" | "en";

const messages = { de, en } as Record<Locale, Record<string, unknown>>;

export function getLocale(): Locale {
  if (typeof window === "undefined") return "de";
  const stored = localStorage.getItem("trainiq-locale");
  if (stored === "de" || stored === "en") return stored;
  return navigator.language.startsWith("de") ? "de" : "en";
}

export function setLocale(locale: Locale) {
  localStorage.setItem("trainiq-locale", locale);
  document.cookie = `NEXT_LOCALE=${locale};path=/;max-age=31536000`;
}

export function t(key: string, locale?: Locale, params?: Record<string, string>): string {
  const loc = locale ?? getLocale();
  const msg = messages[loc] ?? messages.de;

  const parts = key.split(".");
  let current: unknown = msg;
  for (const part of parts) {
    if (current && typeof current === "object" && part in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return key;
    }
  }

  if (typeof current !== "string") return key;

  if (params) {
    return Object.entries(params).reduce(
      (str, [k, v]) => str.replace(`{${k}}`, v),
      current
    );
  }

  return current;
}
