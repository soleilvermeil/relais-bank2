export const supportedLocales = ["en", "fr"] as const;

export type AppLocale = (typeof supportedLocales)[number];

export const defaultLocale: AppLocale = "en";
export const localeCookieName = "locale";

export function isAppLocale(value: string): value is AppLocale {
  return supportedLocales.includes(value as AppLocale);
}

export function getFallbackLocale(locale: string | null | undefined): AppLocale {
  if (locale && isAppLocale(locale)) {
    return locale;
  }
  return defaultLocale;
}
