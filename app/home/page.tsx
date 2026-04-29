import { redirect } from "next/navigation";
import { Badge } from "@/components/atoms/badge";
import { Container } from "@/components/atoms/container";
import { SectionTitle } from "@/components/atoms/section-title";
import { accounts, creditCards } from "@/data/banking-mock";
import { isAuthenticated } from "@/lib/auth";

export default async function HomePage() {
  if (!(await isAuthenticated())) {
    redirect("/login");
  }

  return (
    <Container>
      <main id="main-content" className="space-y-8">
        <header className="space-y-2">
          <SectionTitle as="h1">Home</SectionTitle>
          <p className="text-sm text-muted-foreground">
            Overview of your accounts and credit cards.
          </p>
        </header>

        <section className="rounded-2xl border border-card-border bg-card p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <SectionTitle>My accounts</SectionTitle>
            <Badge variant="accent">{accounts.length} accounts</Badge>
          </div>
          <div className="space-y-4">
            {accounts.map((account) => (
              <article
                key={account.id}
                className="rounded-xl border border-card-border bg-background p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h3 className="text-base font-semibold text-foreground">
                    {account.name}
                  </h3>
                  <p className="text-base font-semibold tabular-nums">
                    {account.balanceChf}
                  </p>
                </div>
                {account.iban ? (
                  <p className="mt-2 text-sm text-muted-foreground">
                    IBAN: <span className="font-medium text-foreground">{account.iban}</span>
                  </p>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">No IBAN available</p>
                )}
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-card-border bg-card p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <SectionTitle>My credit cards</SectionTitle>
            <Badge>{creditCards.length} cards</Badge>
          </div>
          <div className="space-y-4">
            {creditCards.map((card) => (
              <article
                key={card.id}
                className="rounded-xl border border-card-border bg-background p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h3 className="text-base font-semibold text-foreground">
                    {card.name}
                  </h3>
                  <p className="text-base font-semibold tabular-nums">{card.amountChf}</p>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Card number:{" "}
                  <span className="font-medium text-foreground tabular-nums">
                    XXXX XXXX XXXX {card.last4}
                  </span>
                </p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </Container>
  );
}
