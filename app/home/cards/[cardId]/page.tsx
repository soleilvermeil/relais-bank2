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
import { getServerT } from "@/lib/i18n/server";

type Props = {
  params: Promise<{ cardId: string }>;
};

export default async function CardDetailPage({ params }: Props) {
  if (!(await isAuthenticated())) {
    redirect("/login");
  }
  const { t } = await getServerT();

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
            {t("cardDetail.subtitle")}
          </p>
        </header>

        <section className="rounded-2xl border border-card-border bg-card p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/payments/pay?source=${encodeURIComponent(`card:${cardId}`)}`}
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-5 py-2.5 text-base font-medium text-primary-foreground"
            >
              {t("cardDetail.makePayment")}
            </Link>
            <Button type="button" variant="secondary">
              {t("cardDetail.searchTransactions")}
            </Button>
          </div>
        </section>

        <section className="rounded-2xl border border-card-border bg-card p-5 shadow-sm sm:p-6">
          <SectionTitle>{t("cardDetail.pendingUntilNextMonth")}</SectionTitle>
          <div className="mt-4 space-y-3">
            {pendingOrders.length > 0 ? (
              pendingOrders.map((order) => (
                <ListItemCard
                  key={order.id}
                  href={order.href}
                  name={order.label}
                  metaLabel={
                    order.scheduleType === "standing"
                      ? t("paymentDetail.standingOrder")
                      : t("paymentDetail.pendingOrder")
                  }
                  metaValue={
                    order.scheduleType === "standing" && "frequency" in order
                      ? `${order.executionDate} · ${t(`cadence.${order.frequency}`)}`
                      : order.executionDate
                  }
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
                {t("cardDetail.noPendingBeforeNextMonth")}
              </p>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-card-border bg-card p-5 shadow-sm sm:p-6">
          <SectionTitle>{t("cardDetail.pastTransactions")}</SectionTitle>
          <div className="mt-4">
            <PastTransactionsList transactions={transactions} />
          </div>
        </section>
      </main>
    </Container>
  );
}
