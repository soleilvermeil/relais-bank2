"use client";

import { useEffect, useMemo } from "react";
import { I18nextProvider } from "react-i18next";
import { initClientI18n } from "@/lib/i18n/client";
import { localeCookieName } from "@/lib/i18n/config";

type Props = {
  locale: string;
  children: React.ReactNode;
};

export function I18nProvider({ locale, children }: Props) {
  const i18n = useMemo(() => initClientI18n(locale), [locale]);

  useEffect(() => {
    document.documentElement.lang = i18n.language;
    document.cookie = `${localeCookieName}=${i18n.language};path=/;max-age=31536000;samesite=lax`;
  }, [i18n, i18n.language]);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
