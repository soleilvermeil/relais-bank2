import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/organisms/site-header";
import { isAuthenticated } from "@/lib/auth";

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

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <a
          href="#main-content"
          className="sr-only print:hidden focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:m-0 focus:inline-block focus:h-auto focus:w-auto focus:overflow-visible focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground focus:shadow-lg"
        >
          Skip to main content
        </a>
        <div className="bg-primary py-2 text-center text-sm text-primary-foreground print:hidden">
          <p className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            Demo training environment - no real banking operations
          </p>
        </div>
        <SiteHeader isLoggedIn={authenticated} />
        <div className="flex flex-1 flex-col">{children}</div>
        <footer className="mt-auto border-t border-card-border bg-card py-6 text-center text-sm text-muted-foreground print:hidden">
          Relais Bank pedagogic mock website
        </footer>
      </body>
    </html>
  );
}
