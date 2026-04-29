import Link from "next/link";
import { logout } from "@/app/actions/auth";
import { Button } from "@/components/atoms/button";

type Props = {
  isLoggedIn: boolean;
};

export function SiteHeader({ isLoggedIn }: Props) {
  return (
    <header className="sticky top-0 z-40 border-b border-card-border bg-background/90 backdrop-blur-md print:hidden">
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
          <form action={logout}>
            <Button type="submit" variant="secondary">
              Log out
            </Button>
          </form>
        ) : null}
      </div>
    </header>
  );
}
