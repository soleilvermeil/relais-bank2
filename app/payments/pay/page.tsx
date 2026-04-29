import { redirect } from "next/navigation";
import { accounts, creditCards } from "@/data/banking-mock";
import { Button } from "@/components/atoms/button";
import { Container } from "@/components/atoms/container";
import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";
import { SectionTitle } from "@/components/atoms/section-title";
import { isAuthenticated } from "@/lib/auth";

type Props = {
  searchParams: Promise<{ source?: string }>;
};

export default async function PayFormPage({ searchParams }: Props) {
  if (!(await isAuthenticated())) {
    redirect("/login");
  }

  const params = await searchParams;
  const defaultSource = params.source ?? "";

  return (
    <Container>
      <main id="main-content" className="space-y-8">
        <header className="space-y-2">
          <SectionTitle as="h1">Pay</SectionTitle>
          <p className="text-sm text-muted-foreground">
            Create a payment order and continue to preview.
          </p>
        </header>

        <section className="rounded-2xl border border-card-border bg-card p-5 shadow-sm sm:p-6">
          <form action="/payments/pay/preview" method="get" className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="sourceRef">Source account/card</Label>
              <select
                id="sourceRef"
                name="sourceRef"
                defaultValue={defaultSource}
                required
                className="box-border min-h-11 w-full rounded-xl border border-card-border bg-card px-3 py-2.5 text-base text-foreground shadow-inner focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Select source</option>
                {accounts.map((account) => (
                  <option key={`account:${account.id}`} value={`account:${account.id}`}>
                    {account.name}
                  </option>
                ))}
                {creditCards.map((card) => (
                  <option key={`card:${card.id}`} value={`card:${card.id}`}>
                    {card.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipientName">Recipient</Label>
              <Input id="recipientName" name="recipientName" required placeholder="Organization or person name" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reference">IBAN or reference</Label>
              <Input id="reference" name="reference" required placeholder="CH.. or invoice reference" />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (CHF)</Label>
                <Input id="amount" name="amount" type="number" min="0.01" step="0.01" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="executionDate">Execution date</Label>
                <Input id="executionDate" name="executionDate" type="date" required />
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button type="submit">Continue</Button>
            </div>
          </form>
        </section>
      </main>
    </Container>
  );
}
