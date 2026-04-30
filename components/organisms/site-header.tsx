"use client";

import Link from "next/link";
import { BanknoteArrowUp, House, LogOut, Trash2 } from "lucide-react";
import { logout } from "@/app/actions/auth";
import { resetPaymentCookies } from "@/app/actions/payments";
import { Button } from "@/components/atoms/button";

type Props = {
  isLoggedIn: boolean;
};

export function SiteHeader({ isLoggedIn }: Props) {
  function confirmReset(event: React.FormEvent<HTMLFormElement>) {
    const accepted = window.confirm(
      "Reset all payment cookies and return to base state?",
    );
    if (!accepted) {
      event.preventDefault();
    }
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
              <nav aria-label="Main" className="flex items-center gap-3 text-sm">
                <Link
                  href="/home"
                  className="rounded-lg px-2 py-1 text-foreground hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  Home
                </Link>
                <Link
                  href="/payments"
                  className="rounded-lg px-2 py-1 text-foreground hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  Payments
                </Link>
              </nav>
            ) : null}
          </div>

          {isLoggedIn ? (
            <div className="flex items-center gap-2">
              <form action={resetPaymentCookies} onSubmit={confirmReset}>
                <Button type="submit" variant="secondary">
                  Reset cookies
                </Button>
              </form>
              <form action={logout}>
                <Button type="submit" variant="secondary">
                  Log out
                </Button>
              </form>
            </div>
          ) : null}
        </div>
      </header>

      {isLoggedIn ? (
        <nav
          aria-label="Mobile main"
          className="fixed inset-x-0 bottom-0 z-50 border-t border-card-border bg-background/95 backdrop-blur-md print:hidden sm:hidden"
        >
          <div className="mx-auto flex w-full max-w-6xl items-stretch justify-around px-2 py-2">
            <Link
              href="/home"
              aria-label="Home"
              className="flex min-h-14 flex-1 flex-col items-center justify-center gap-1 rounded-lg text-foreground transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <House aria-hidden="true" size={20} />
              <span className="text-xs leading-none">Home</span>
            </Link>
            <Link
              href="/payments"
              aria-label="Payments"
              className="flex min-h-14 flex-1 flex-col items-center justify-center gap-1 rounded-lg text-foreground transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <BanknoteArrowUp aria-hidden="true" size={20} />
              <span className="text-xs leading-none">Payments</span>
            </Link>
            <form action={logout} className="flex flex-1">
              <button
                type="submit"
                aria-label="Log out"
                className="flex min-h-14 w-full flex-col items-center justify-center gap-1 rounded-lg text-foreground transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <LogOut aria-hidden="true" size={20} />
                <span className="text-xs leading-none">Log out</span>
              </button>
            </form>
            <form action={resetPaymentCookies} onSubmit={confirmReset} className="flex flex-1">
              <button
                type="submit"
                aria-label="Reset cookies"
                className="flex min-h-14 w-full flex-col items-center justify-center gap-1 rounded-lg text-foreground transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <Trash2 aria-hidden="true" size={20} />
                <span className="text-xs leading-none">Reset</span>
              </button>
            </form>
          </div>
        </nav>
      ) : null}
    </>
  );
}
