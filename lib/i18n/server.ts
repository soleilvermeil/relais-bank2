import { cookies, headers } from "next/headers";
import { createInstance, type i18n as I18nInstance, type TFunction } from "i18next";
import { initReactI18next } from "react-i18next/initReactI18next";
import {
  defaultLocale,
  getFallbackLocale,
  isAppLocale,
  localeCookieName,
  type AppLocale,
} from "@/lib/i18n/config";
import { resources } from "@/lib/i18n/resources";

function getLocaleFromAcceptLanguage(value: string | null): AppLocale {
  if (!value) {
    return defaultLocale;
  }

  const normalized = value.toLowerCase();
  if (normalized.startsWith("fr") || normalized.includes(",fr") || normalized.includes(" fr")) {
    return "fr";
  }

  return defaultLocale;
}

export async function resolveRequestLocale(): Promise<AppLocale> {
  const cookieStore = await cookies();
  const localeFromCookie = cookieStore.get(localeCookieName)?.value;
  if (localeFromCookie && isAppLocale(localeFromCookie)) {
    return localeFromCookie;
  }

  const requestHeaders = await headers();
  return getLocaleFromAcceptLanguage(requestHeaders.get("accept-language"));
}

async function createI18n(locale: AppLocale): Promise<I18nInstance> {
  const instance = createInstance();
  await instance.use(initReactI18next).init({
    resources,
    lng: locale,
    fallbackLng: defaultLocale,
    supportedLngs: ["en", "fr"],
    interpolation: {
      escapeValue: false,
    },
  });
  return instance;
}

export async function getServerT() {
  const locale = await resolveRequestLocale();
  const i18n = await createI18n(locale);

  return {
    locale,
    t: i18n.t.bind(i18n) as TFunction,
  };
}

export async function getServerTForLocale(locale: string) {
  const safeLocale = getFallbackLocale(locale);
  const i18n = await createI18n(safeLocale);
  return {
    locale: safeLocale,
    t: i18n.t.bind(i18n) as TFunction,
  };
}
