import { redirect } from "next/navigation";
import { accounts, creditCards } from "@/data/banking-mock";
import { Button } from "@/components/atoms/button";
import { Container } from "@/components/atoms/container";
import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";
import { ProductSelect } from "@/components/molecules/product-select";
import { SectionTitle } from "@/components/atoms/section-title";
import { isAuthenticated } from "@/lib/auth";

type Props = {
  searchParams: Promise<{ source?: string }>;
};

const chfFormatter = new Intl.NumberFormat("de-CH", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export default async function TransferFormPage({ searchParams }: Props) {
  if (!(await isAuthenticated())) {
    redirect("/login");
  }

  const params = await searchParams;
  const defaultSource = params.source ?? "";
  const sourceOptions = [
    ...accounts.map((account) => ({
      value: `account:${account.id}`,
      label: account.name,
      detail: account.iban ?? `Account number: ${account.id}`,
      amountLabel: `CHF ${chfFormatter.format(account.balance)}`,
    })),
    ...creditCards.map((card) => ({
      value: `card:${card.id}`,
      label: card.name,
      detail: `Card number: **** ${card.last4}`,
      amountLabel: `CHF ${chfFormatter.format(card.amount)}`,
    })),
  ];
  const destinationOptions = accounts.map((account) => ({
    value: account.id,
    label: account.name,
    detail: account.iban ?? `Account number: ${account.id}`,
    amountLabel: `CHF ${chfFormatter.format(account.balance)}`,
  }));

  return (
    <Container>
      <main id="main-content" className="space-y-8">
        <header className="space-y-2">
          <SectionTitle as="h1">Transfer</SectionTitle>
          <p className="text-sm text-muted-foreground">
            Create a transfer between your own products.
          </p>
        </header>

        <section className="rounded-2xl border border-card-border bg-card p-5 shadow-sm sm:p-6">
          <form action="/payments/transfer/preview" method="get" className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="sourceRef">Source account/card</Label>
              <ProductSelect
                id="sourceRef"
                name="sourceRef"
                defaultValue={defaultSource}
                options={sourceOptions}
                placeholder="Select source"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="destinationAccountId">Destination own account</Label>
              <ProductSelect
                id="destinationAccountId"
                name="destinationAccountId"
                options={destinationOptions}
                placeholder="Select destination"
                required
              />
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

            <div className="space-y-2">
              <Label htmlFor="reference">Note (optional)</Label>
              <Input id="reference" name="reference" placeholder="Transfer note" />
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
