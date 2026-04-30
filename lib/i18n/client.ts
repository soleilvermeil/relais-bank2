"use client";

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { defaultLocale, getFallbackLocale } from "@/lib/i18n/config";
import { resources } from "@/lib/i18n/resources";

let initialized = false;

export function initClientI18n(initialLocale: string) {
  if (!initialized) {
    i18n.use(initReactI18next).init({
      resources,
      lng: getFallbackLocale(initialLocale),
      fallbackLng: defaultLocale,
      interpolation: {
        escapeValue: false,
      },
    });
    initialized = true;
    return i18n;
  }

  const nextLocale = getFallbackLocale(initialLocale);
  if (i18n.language !== nextLocale) {
    void i18n.changeLanguage(nextLocale);
  }

  return i18n;
}
