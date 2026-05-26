import { getLocales } from "expo-localization";

export const SUPPORTED_APP_LANGUAGES = ["tr", "en", "de", "fr", "es", "ar", "ru"] as const;
export type AppLanguage = (typeof SUPPORTED_APP_LANGUAGES)[number];

export const DEFAULT_APP_LANGUAGE: AppLanguage = "en";

const SUPPORTED_LANGUAGE_SET = new Set<string>(SUPPORTED_APP_LANGUAGES);

export function normalizeAppLanguageCode(value?: string | null): AppLanguage | undefined {
  const language = value?.trim().toLowerCase().replace("_", "-").split("-")[0];
  return language && SUPPORTED_LANGUAGE_SET.has(language) ? (language as AppLanguage) : undefined;
}

export function getSystemLanguageTag(): string | undefined {
  return getLocales()[0]?.languageTag;
}

export function getSystemAppLanguage(): AppLanguage {
  return normalizeAppLanguageCode(getSystemLanguageTag()) ?? DEFAULT_APP_LANGUAGE;
}

export function getSystemLanguagePayload(): { language: AppLanguage; locale: string } {
  const locale = getSystemLanguageTag();
  const language = normalizeAppLanguageCode(locale) ?? DEFAULT_APP_LANGUAGE;

  return {
    language,
    locale: locale && normalizeAppLanguageCode(locale) ? locale : language,
  };
}

export function getLanguageDisplayName(language: AppLanguage): string {
  switch (language) {
    case "tr":
      return "Türkçe";
    case "de":
      return "Deutsch";
    case "fr":
      return "Français";
    case "es":
      return "Español";
    case "ar":
      return "العربية";
    case "ru":
      return "Русский";
    case "en":
    default:
      return "English";
  }
}
