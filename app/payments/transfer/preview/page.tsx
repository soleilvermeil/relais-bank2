import Link from "next/link";
import { redirect } from "next/navigation";
import { confirmTransferOperation } from "@/app/actions/payments";
import { Button } from "@/components/atoms/button";
import { Container } from "@/components/atoms/container";
import { SectionTitle } from "@/components/atoms/section-title";
import { isAuthenticated } from "@/lib/auth";

type Props = {
  searchParams: Promise<{
    sourceRef?: string;
    destinationAccountId?: string;
    amount?: string;
    executionDate?: string;
    reference?: string;
  }>;
};

function required(value: string | undefined) {
  return value?.trim() ?? "";
}

export default async function TransferPreviewPage({ searchParams }: Props) {
  if (!(await isAuthenticated())) {
    redirect("/login");
  }

  const params = await searchParams;
  const sourceRef = required(params.sourceRef);
  const destinationAccountId = required(params.destinationAccountId);
  const amount = required(params.amount);
  const executionDate = required(params.executionDate);
  const reference = required(params.reference);

  if (!sourceRef || !destinationAccountId || !amount || !executionDate) {
    redirect("/payments/transfer");
  }

  return (
    <Container>
      <main id="main-content" className="space-y-8">
        <header className="space-y-2">
          <SectionTitle as="h1">Transfer - Preview</SectionTitle>
          <p className="text-sm text-muted-foreground">
            Verify details before final confirmation.
          </p>
        </header>

        <section className="rounded-2xl border border-card-border bg-card p-5 shadow-sm sm:p-6">
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-muted-foreground">Source</dt>
              <dd className="font-medium">{sourceRef}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Destination account</dt>
              <dd className="font-medium">{destinationAccountId}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Amount</dt>
              <dd className="font-medium">CHF {Number(amount).toFixed(2)}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Execution date</dt>
              <dd className="font-medium">{executionDate}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Note</dt>
              <dd className="font-medium">{reference || "-"}</dd>
            </div>
          </dl>

          <form action={confirmTransferOperation} className="mt-6 flex flex-wrap gap-3">
            <input type="hidden" name="sourceRef" value={sourceRef} />
            <input type="hidden" name="destinationAccountId" value={destinationAccountId} />
            <input type="hidden" name="amount" value={amount} />
            <input type="hidden" name="executionDate" value={executionDate} />
            <input type="hidden" name="reference" value={reference} />
            <Button type="submit">Make transfer</Button>
            <Link
              href={`/payments/transfer?source=${encodeURIComponent(sourceRef)}`}
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-card-border bg-muted px-5 py-2.5 text-base font-medium text-foreground"
            >
              Back to edit
            </Link>
          </form>
        </section>
      </main>
    </Container>
  );
}
