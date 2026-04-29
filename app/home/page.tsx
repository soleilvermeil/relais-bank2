import { redirect } from "next/navigation";
import { Badge } from "@/components/atoms/badge";
import { Container } from "@/components/atoms/container";
import { SectionTitle } from "@/components/atoms/section-title";
import { ListItemCard } from "@/components/molecules/list-item-card";
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
              <ListItemCard
                key={account.id}
                name={account.name}
                metaLabel="IBAN"
                metaValue={account.iban ?? "No IBAN available"}
                amount={account.balance}
              />
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
              <ListItemCard
                key={card.id}
                name={card.name}
                metaLabel="Card number"
                metaValue={`XXXX XXXX XXXX ${card.last4}`}
                amount={card.amount}
              />
            ))}
          </div>
        </section>
      </main>
    </Container>
  );
}
