import { redirect } from "next/navigation";
import { Badge } from "@/components/atoms/badge";
import { Container } from "@/components/atoms/container";
import { SectionTitle } from "@/components/atoms/section-title";
import { pendingOrders, standingOrders } from "@/data/banking-mock";
import { isAuthenticated } from "@/lib/auth";

const paymentActions = [
  {
    id: "scan",
    title: "Scan",
    description: "Scan a QR code invoice",
  },
  {
    id: "pay",
    title: "Pay",
    description: "Create a one-time payment",
  },
  {
    id: "transfer",
    title: "Transfer",
    description: "Transfer between your accounts",
  },
];

export default async function PaymentsPage() {
  if (!(await isAuthenticated())) {
    redirect("/login");
  }

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
                className="rounded-xl border border-card-border bg-background p-4"
              >
                <h3 className="text-base font-semibold">{action.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{action.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-card-border bg-card p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <SectionTitle>Pending individual orders</SectionTitle>
            <Badge variant="accent">{pendingOrders.length} pending</Badge>
          </div>
          <div className="space-y-3">
            {pendingOrders.map((order) => (
              <article
                key={order.id}
                className="rounded-xl border border-card-border bg-background p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h3 className="text-base font-semibold">{order.label}</h3>
                  <p className="text-base font-semibold tabular-nums">{order.amountChf}</p>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Execution date:{" "}
                  <span className="font-medium text-foreground">
                    {order.executionDate}
                  </span>
                </p>
              </article>
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
              <article
                key={order.id}
                className="rounded-xl border border-card-border bg-background p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h3 className="text-base font-semibold">{order.label}</h3>
                  <p className="text-base font-semibold tabular-nums">{order.amountChf}</p>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {order.cadence} - next execution:{" "}
                  <span className="font-medium text-foreground">
                    {order.nextExecutionDate}
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
