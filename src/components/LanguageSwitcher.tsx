"use client";
import { useI18n } from "@/hooks/useI18n";

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();

  return (
    <div className="px-5 py-5 border-b border-border">
      <p className="text-xs tracking-widest uppercase text-textDim font-sans mb-4">{t("settings.language")}</p>
      <div className="flex gap-2">
        {(["de", "en"] as const).map((lang) => (
          <button
            key={lang}
            onClick={() => setLocale(lang)}
            className={`flex-1 border py-2 text-xs tracking-widest uppercase font-sans transition-colors ${
              locale === lang
                ? "border-blue text-blue bg-blueDim"
                : "border-border text-textDim hover:border-textDim"
            }`}
          >
            {lang === "de" ? "Deutsch" : "English"}
          </button>
        ))}
      </div>
    </div>
  );
}
