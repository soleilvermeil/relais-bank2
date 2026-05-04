import Link from "next/link";
import { redirect } from "next/navigation";
import { HandCoins, QrCode, RefreshCw } from "lucide-react";
import { Badge } from "@/components/atoms/badge";
import { Container } from "@/components/atoms/container";
import { SectionTitle } from "@/components/atoms/section-title";
import { ListItemCard } from "@/components/molecules/list-item-card";
import {
  getPendingOrders,
  getStandingOrders,
} from "@/data/banking-mock";
import { isAuthenticated } from "@/lib/auth";
import { getLocalizedAccountNameById } from "@/lib/i18n/account-names";
import { getServerT } from "@/lib/i18n/server";

export default async function PaymentsPage() {
  if (!(await isAuthenticated())) {
    redirect("/login");
  }
  const { t } = await getServerT();

  const paymentActions = [
    {
      id: "scan",
      title: t("paymentsPage.actionScanTitle"),
      description: t("paymentsPage.actionScanDescription"),
      href: "/payments/scan",
      icon: QrCode,
    },
    {
      id: "pay",
      title: t("paymentsPage.actionPayTitle"),
      description: t("paymentsPage.actionPayDescription"),
      href: "/payments/pay",
      icon: HandCoins,
    },
    {
      id: "transfer",
      title: t("paymentsPage.actionTransferTitle"),
      description: t("paymentsPage.actionTransferDescription"),
      href: "/payments/transfer",
      icon: RefreshCw,
    },
  ];

  const [pendingOrders, standingOrders] = await Promise.all([
    getPendingOrders(),
    getStandingOrders(),
  ]);

  return (
    <Container>
      <main id="main-content" className="space-y-8">
        <header className="space-y-2">
          <SectionTitle as="h1">{t("paymentsPage.title")}</SectionTitle>
          <p className="text-sm text-muted-foreground">
            {t("paymentsPage.subtitle")}
          </p>
        </header>

        <section className="rounded-2xl border border-card-border bg-card p-5 shadow-sm sm:p-6">
          <SectionTitle>{t("paymentsPage.mainActions")}</SectionTitle>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {paymentActions.map((action) => (
              <article
                key={action.id}
                className="rounded-xl border border-card-border bg-background"
              >
                {action.href ? (
                  <Link
                    href={action.href}
                    className="flex cursor-pointer items-center gap-3 rounded-xl p-4 transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <action.icon
                      aria-hidden="true"
                      size={20}
                      className="shrink-0 text-primary"
                    />
                    <div>
                      <h3 className="text-base font-semibold">{action.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{action.description}</p>
                    </div>
                  </Link>
                ) : null}
                {!action.href ? (
                  <div className="flex items-center gap-3 p-4">
                    <action.icon
                      aria-hidden="true"
                      size={20}
                      className="shrink-0 text-primary"
                    />
                    <div>
                      <h3 className="text-base font-semibold">{action.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{action.description}</p>
                    </div>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </section>

        {/*
        <section className="rounded-2xl border border-card-border bg-card p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <SectionTitle>Confirmed operations</SectionTitle>
            <Badge>{operations.length}</Badge>
          </div>
          <div className="space-y-3">
            {operations.length > 0 ? (
              operations.map((operation) => (
                <article
                  key={operation.id}
                  className="rounded-xl border border-card-border bg-background p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h3 className="text-base font-semibold uppercase text-foreground">
                      {operation.type}
                    </h3>
                    <p className="text-base font-semibold tabular-nums">
                      CHF {operation.amount.toFixed(2)}
                    </p>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {operation.sourceRef.entityType}:{operation.sourceRef.entityId} {"→"}{" "}
                    {operation.destinationRef.entityType}:{operation.destinationRef.entityId}
                  </p>
                </article>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No confirmed operations yet.
              </p>
            )}
          </div>
        </section>
        */}

        <section className="rounded-2xl border border-card-border bg-card p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <SectionTitle>{t("paymentsPage.pendingOrders")}</SectionTitle>
            <Badge variant="accent">
              {t("paymentsPage.pendingCount", { count: pendingOrders.length })}
            </Badge>
          </div>
          <div className="space-y-3">
            {pendingOrders.map((order) => (
              <ListItemCard
                key={order.id}
                href={`/payments/pending/${encodeURIComponent(order.id)}`}
                name={
                  order.destinationRef.entityType === "account"
                    ? getLocalizedAccountNameById(
                        order.destinationRef.entityId,
                        t,
                        order.label,
                      )
                    : order.label
                }
                metaLabel={t("common.executionDate")}
                metaValue={order.executionDate}
                amount={order.amount}
              />
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-card-border bg-card p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <SectionTitle>{t("paymentsPage.standingOrders")}</SectionTitle>
            <Badge>{t("paymentsPage.activeCount", { count: standingOrders.length })}</Badge>
          </div>
          <div className="space-y-3">
            {standingOrders.map((order) => (
              <ListItemCard
                key={order.id}
                href={`/payments/standing/${encodeURIComponent(order.id)}`}
                name={
                  order.destinationRef.entityType === "account"
                    ? getLocalizedAccountNameById(
                        order.destinationRef.entityId,
                        t,
                        order.label,
                      )
                    : order.label
                }
                metaLabel={t("paymentsPage.monthlyNextExecution", {
                  cadence: order.cadence === "Monthly" ? t("cadence.monthly") : order.cadence,
                })}
                metaValue={order.nextExecutionDate}
                amount={order.amount}
              />
            ))}
          </div>
        </section>
      </main>
    </Container>
  );
}
