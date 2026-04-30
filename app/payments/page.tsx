import Link from "next/link";
import { redirect } from "next/navigation";
import { HandCoins, QrCode, RefreshCw } from "lucide-react";
import { Badge } from "@/components/atoms/badge";
import { Container } from "@/components/atoms/container";
import { SectionTitle } from "@/components/atoms/section-title";
import { ListItemCard } from "@/components/molecules/list-item-card";
import {
  getConfirmedOperations,
  getPendingOrders,
  getStandingOrders,
} from "@/data/banking-mock";
import { isAuthenticated } from "@/lib/auth";

const paymentActions = [
  {
    id: "scan",
    title: "Scan",
    description: "Scan a QR code invoice",
    href: undefined,
    icon: QrCode,
  },
  {
    id: "pay",
    title: "Pay",
    description: "Create a one-time payment",
    href: "/payments/pay",
    icon: HandCoins,
  },
  {
    id: "transfer",
    title: "Transfer",
    description: "Transfer between your accounts",
    href: "/payments/transfer",
    icon: RefreshCw,
  },
];

export default async function PaymentsPage() {
  if (!(await isAuthenticated())) {
    redirect("/login");
  }
  const [operations, pendingOrders, standingOrders] = await Promise.all([
    getConfirmedOperations(),
    getPendingOrders(),
    getStandingOrders(),
  ]);

  return (
    <Container>
      <main id="main-content" className="space-y-8">
        <header className="space-y-2">
          <SectionTitle as="h1">Payments</SectionTitle>
          <p className="text-sm text-muted-foreground">
            Main payment actions and your order overview.
          </p>
        </header>

        <section className="rounded-2xl border border-card-border bg-card p-5 shadow-sm sm:p-6">
          <SectionTitle>Main actions</SectionTitle>
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
            <SectionTitle>Pending individual orders</SectionTitle>
            <Badge variant="accent">{pendingOrders.length} pending</Badge>
          </div>
          <div className="space-y-3">
            {pendingOrders.map((order) => (
              <ListItemCard
                key={order.id}
                href={`/payments/pending/${encodeURIComponent(order.id)}`}
                name={order.label}
                metaLabel="Execution date"
                metaValue={order.executionDate}
                amount={order.amount}
              />
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-card-border bg-card p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <SectionTitle>Standing orders</SectionTitle>
            <Badge>{standingOrders.length} active</Badge>
          </div>
          <div className="space-y-3">
            {standingOrders.map((order) => (
              <ListItemCard
                key={order.id}
                href={`/payments/standing/${encodeURIComponent(order.id)}`}
                name={order.label}
                metaLabel={`${order.cadence} - next execution`}
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
