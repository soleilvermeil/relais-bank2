import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/atoms/button";
import { Container } from "@/components/atoms/container";
import { SectionTitle } from "@/components/atoms/section-title";
import { ListItemCard } from "@/components/molecules/list-item-card";
import { PastTransactionsList } from "@/components/molecules/past-transactions-list";
import {
  accounts,
  getPastTransactionsForSource,
  getPendingOrdersUntilNextMonth,
} from "@/data/banking-mock";
import { isAuthenticated } from "@/lib/auth";

type Props = {
  params: Promise<{ accountId: string }>;
};

export default async function AccountDetailPage({ params }: Props) {
  if (!(await isAuthenticated())) {
    redirect("/login");
  }

  const { accountId } = await params;
  const account = accounts.find((item) => item.id === accountId);
  if (!account) {
    notFound();
  }

  const pendingOrders = getPendingOrdersUntilNextMonth("account", accountId);
  const transactions = getPastTransactionsForSource("account", accountId);

  return (
    <Container>
      <main id="main-content" className="space-y-8">
        <header className="space-y-2">
          <SectionTitle as="h1">{account.name}</SectionTitle>
          <p className="text-sm text-muted-foreground">
            Account details and transaction history.
          </p>
        </header>

        <section className="rounded-2xl border border-card-border bg-card p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap gap-3">
            <Button type="button">Make payment</Button>
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
                    order.destinationRef.entityType === "account" &&
                    order.destinationRef.entityId === accountId
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
