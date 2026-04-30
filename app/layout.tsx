import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { I18nProvider } from "@/components/providers/i18n-provider";
import { SiteHeader } from "@/components/organisms/site-header";
import { isAuthenticated } from "@/lib/auth";
import { getServerT } from "@/lib/i18n/server";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Relais Bank - E-Banking Demo",
  description: "Pedagogic Swiss e-banking mock website",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const authenticated = await isAuthenticated();
  const { locale, t } = await getServerT();

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <I18nProvider locale={locale}>
          <a
            href="#main-content"
            className="sr-only print:hidden focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:m-0 focus:inline-block focus:h-auto focus:w-auto focus:overflow-visible focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground focus:shadow-lg"
          >
            {t("layout.skipToContent")}
          </a>
          <div className="bg-primary py-2 text-center text-sm text-primary-foreground print:hidden">
            <p className="mx-auto w-full max-w-6xl px-4 sm:px-6">
              {t("layout.demoBanner")}
            </p>
          </div>
          <SiteHeader isLoggedIn={authenticated} />
          <div className="flex flex-1 flex-col pb-20 sm:pb-0">{children}</div>
          <footer className="mt-auto border-t border-card-border bg-card py-6 text-center text-sm text-muted-foreground print:hidden">
            {t("layout.footer")}
          </footer>
        </I18nProvider>
      </body>
    </html>
  );
}
