"use client";

import Link from "next/link";
import { BanknoteArrowUp, House, LogOut, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { logout } from "@/app/actions/auth";
import { resetPaymentCookies } from "@/app/actions/payments";
import { Button } from "@/components/atoms/button";
import { localeCookieName, type AppLocale } from "@/lib/i18n/config";

type Props = {
  isLoggedIn: boolean;
};

export function SiteHeader({ isLoggedIn }: Props) {
  const { t, i18n } = useTranslation();

  function confirmReset(event: React.FormEvent<HTMLFormElement>) {
    const accepted = window.confirm(
      t("header.resetConfirmation"),
    );
    if (!accepted) {
      event.preventDefault();
    }
  }

  function changeLanguage(locale: AppLocale) {
    void i18n.changeLanguage(locale);
    document.documentElement.lang = locale;
    document.cookie = `${localeCookieName}=${locale};path=/;max-age=31536000;samesite=lax`;
  }

  return (
    <>
      <header className="sticky top-0 z-40 hidden border-b border-card-border bg-background/90 backdrop-blur-md print:hidden sm:block">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-5">
            <Link
              href={isLoggedIn ? "/home" : "/login"}
              className="shrink-0 text-lg font-bold tracking-tight text-primary focus-visible:rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Relais Bank
            </Link>
            {isLoggedIn ? (
              <nav aria-label={t("header.navMain")} className="flex items-center gap-3 text-sm">
                <Link
                  href="/home"
                  className="rounded-lg px-2 py-1 text-foreground hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {t("common.home")}
                </Link>
                <Link
                  href="/payments"
                  className="rounded-lg px-2 py-1 text-foreground hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {t("common.payments")}
                </Link>
              </nav>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-1 rounded-full border border-card-border bg-card p-1">
              <button
                type="button"
                onClick={() => changeLanguage("en")}
                aria-label={t("header.languageEn")}
                className={`rounded-full px-2 py-1 text-xs font-medium ${
                  i18n.language.startsWith("en")
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted/60"
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => changeLanguage("fr")}
                aria-label={t("header.languageFr")}
                className={`rounded-full px-2 py-1 text-xs font-medium ${
                  i18n.language.startsWith("fr")
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted/60"
                }`}
              >
                FR
              </button>
            </div>
            {isLoggedIn ? (
              <div className="flex items-center gap-2">
              <form action={resetPaymentCookies} onSubmit={confirmReset}>
                <Button type="submit" variant="secondary">
                  {t("header.resetCookies")}
                </Button>
              </form>
              <form action={logout}>
                <Button type="submit" variant="secondary">
                  {t("header.logout")}
                </Button>
              </form>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      {isLoggedIn ? (
        <nav
          aria-label={t("header.mobileMain")}
          className="fixed inset-x-0 bottom-0 z-50 border-t border-card-border bg-background/95 backdrop-blur-md print:hidden sm:hidden"
        >
          <div className="mx-auto flex w-full max-w-6xl items-stretch justify-around px-2 py-2">
            <Link
              href="/home"
              aria-label={t("common.home")}
              className="flex min-h-14 flex-1 flex-col items-center justify-center gap-1 rounded-lg text-foreground transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <House aria-hidden="true" size={20} />
              <span className="text-xs leading-none">{t("common.home")}</span>
            </Link>
            <Link
              href="/payments"
              aria-label={t("common.payments")}
              className="flex min-h-14 flex-1 flex-col items-center justify-center gap-1 rounded-lg text-foreground transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <BanknoteArrowUp aria-hidden="true" size={20} />
              <span className="text-xs leading-none">{t("common.payments")}</span>
            </Link>
            <form action={logout} className="flex flex-1">
              <button
                type="submit"
                aria-label={t("header.logout")}
                className="flex min-h-14 w-full flex-col items-center justify-center gap-1 rounded-lg text-foreground transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <LogOut aria-hidden="true" size={20} />
                <span className="text-xs leading-none">{t("header.logout")}</span>
              </button>
            </form>
            <form action={resetPaymentCookies} onSubmit={confirmReset} className="flex flex-1">
              <button
                type="submit"
                aria-label={t("header.resetCookies")}
                className="flex min-h-14 w-full flex-col items-center justify-center gap-1 rounded-lg text-foreground transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <Trash2 aria-hidden="true" size={20} />
                <span className="text-xs leading-none">{t("header.resetShort")}</span>
              </button>
            </form>
          </div>
        </nav>
      ) : null}
    </>
  );
}
