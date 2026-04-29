import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/atoms/button";
import { Container } from "@/components/atoms/container";
import { SectionTitle } from "@/components/atoms/section-title";
import { ListItemCard } from "@/components/molecules/list-item-card";
import { PastTransactionsList } from "@/components/molecules/past-transactions-list";
import {
  creditCards,
  getPastTransactionsForSource,
  getPendingOrdersUntilNextMonth,
} from "@/data/banking-mock";
import { isAuthenticated } from "@/lib/auth";

type Props = {
  params: Promise<{ cardId: string }>;
};

export default async function CardDetailPage({ params }: Props) {
  if (!(await isAuthenticated())) {
    redirect("/login");
  }

  const { cardId } = await params;
  const card = creditCards.find((item) => item.id === cardId);
  if (!card) {
    notFound();
  }

  const [pendingOrders, transactions] = await Promise.all([
    getPendingOrdersUntilNextMonth("card", cardId),
    getPastTransactionsForSource("card", cardId),
  ]);

  return (
    <Container>
      <main id="main-content" className="space-y-8">
        <header className="space-y-2">
          <SectionTitle as="h1">{card.name}</SectionTitle>
          <p className="text-sm text-muted-foreground">
            Card details and transaction history.
          </p>
        </header>

        <section className="rounded-2xl border border-card-border bg-card p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/payments/pay?source=${encodeURIComponent(`card:${cardId}`)}`}
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-5 py-2.5 text-base font-medium text-primary-foreground"
            >
              Make payment
            </Link>
            <Button type="button" variant="secondary">
              Search transactions
            </Button>
          </div>
        </section>

        <section className="rounded-2xl border border-card-border bg-card p-5 shadow-sm sm:p-6">
          <SectionTitle>Pending orders until next month</SectionTitle>
          <div className="mt-4 space-y-3">
            {pendingOrders.length > 0 ? (
              pendingOrders.map((order) => (
                <ListItemCard
                  key={order.id}
                  href="/home"
                  name={order.label}
                  metaLabel="Execution date"
                  metaValue={order.executionDate}
                  amount={order.amount}
                  sign={
                    order.destinationRef.entityType === "card" &&
                    order.destinationRef.entityId === cardId
                      ? "positive"
                      : "negative"
                  }
                />
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No pending orders scheduled before next month.
              </p>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-card-border bg-card p-5 shadow-sm sm:p-6">
          <SectionTitle>Past transactions</SectionTitle>
          <div className="mt-4">
            <PastTransactionsList transactions={transactions} />
          </div>
        </section>
      </main>
    </Container>
  );
}
