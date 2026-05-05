import Link from "next/link";
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
import { getLocalizedAccountNameById } from "@/lib/i18n/account-names";
import { getServerT } from "@/lib/i18n/server";

type Props = {
  params: Promise<{ accountId: string }>;
};

export default async function AccountDetailPage({ params }: Props) {
  if (!(await isAuthenticated())) {
    redirect("/login");
  }
  const { t } = await getServerT();

  const { accountId } = await params;
  const account = accounts.find((item) => item.id === accountId);
  if (!account) {
    notFound();
  }

  const [pendingOrders, transactions] = await Promise.all([
    getPendingOrdersUntilNextMonth("account", accountId),
    getPastTransactionsForSource("account", accountId),
  ]);

  return (
    <Container>
      <main id="main-content" className="space-y-8">
        <header className="space-y-2">
          <SectionTitle as="h1">
            {getLocalizedAccountNameById(account.id, t, account.name)}
          </SectionTitle>
          <p className="text-sm text-muted-foreground">
            {t("accountDetail.subtitle")}
          </p>
        </header>

        <section className="rounded-2xl border border-card-border bg-card p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/payments/pay?source=${encodeURIComponent(`account:${accountId}`)}`}
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-5 py-2.5 text-base font-medium text-primary-foreground"
            >
              {t("accountDetail.makePayment")}
            </Link>
            <Button type="button" variant="secondary">
              {t("accountDetail.searchTransactions")}
            </Button>
          </div>
        </section>

        <section className="rounded-2xl border border-card-border bg-card p-5 shadow-sm sm:p-6">
          <SectionTitle>{t("accountDetail.pendingUntilNextMonth")}</SectionTitle>
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
                    order.destinationRef.entityType === "account" &&
                    order.destinationRef.entityId === accountId
                      ? "positive"
                      : "negative"
                  }
                />
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                {t("accountDetail.noPendingBeforeNextMonth")}
              </p>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-card-border bg-card p-5 shadow-sm sm:p-6">
          <SectionTitle>{t("accountDetail.pastTransactions")}</SectionTitle>
          <div className="mt-4">
            <PastTransactionsList transactions={transactions} />
          </div>
        </section>
      </main>
    </Container>
  );
}
