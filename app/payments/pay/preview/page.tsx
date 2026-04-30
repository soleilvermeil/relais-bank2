import Link from "next/link";
import { redirect } from "next/navigation";
import { confirmPayOperation } from "@/app/actions/payments";
import { Button } from "@/components/atoms/button";
import { Container } from "@/components/atoms/container";
import { SectionTitle } from "@/components/atoms/section-title";
import { isAuthenticated } from "@/lib/auth";

type Props = {
  searchParams: Promise<{
    sourceRef?: string;
    recipientName?: string;
    paymentType?: string;
    beneficiaryIban?: string;
    beneficiaryBic?: string;
    reference?: string;
    amount?: string;
    executionDate?: string;
  }>;
};

function required(value: string | undefined) {
  return value?.trim() ?? "";
}

export default async function PayPreviewPage({ searchParams }: Props) {
  if (!(await isAuthenticated())) {
    redirect("/login");
  }

  const params = await searchParams;
  const sourceRef = required(params.sourceRef);
  const recipientName = required(params.recipientName);
  const paymentType = required(params.paymentType);
  const beneficiaryIban = required(params.beneficiaryIban);
  const beneficiaryBic = required(params.beneficiaryBic);
  const reference = required(params.reference);
  const amount = required(params.amount);
  const executionDate = required(params.executionDate);
  const isDomestic = paymentType === "domestic";
  const isInternational = paymentType === "international";

  if (
    !sourceRef ||
    !recipientName ||
    !beneficiaryIban ||
    !amount ||
    !executionDate ||
    (!isDomestic && !isInternational) ||
    (isInternational && !beneficiaryBic)
  ) {
    redirect("/payments/pay");
  }

  return (
    <Container>
      <main id="main-content" className="space-y-8">
        <header className="space-y-2">
          <SectionTitle as="h1">Pay - Preview</SectionTitle>
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
              <dt className="text-sm text-muted-foreground">Recipient</dt>
              <dd className="font-medium">{recipientName}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Payment type</dt>
              <dd className="font-medium">{isDomestic ? "Domestic" : "International"}</dd>
            </div>
            {isInternational ? (
              <div>
                <dt className="text-sm text-muted-foreground">Beneficiary bank BIC</dt>
                <dd className="font-medium">{beneficiaryBic}</dd>
              </div>
            ) : null}
            <div>
              <dt className="text-sm text-muted-foreground">Beneficiary IBAN</dt>
              <dd className="font-medium">{beneficiaryIban}</dd>
            </div>
            {reference ? (
              <div>
                <dt className="text-sm text-muted-foreground">Reference</dt>
                <dd className="font-medium">{reference}</dd>
              </div>
            ) : null}
            <div>
              <dt className="text-sm text-muted-foreground">Amount</dt>
              <dd className="font-medium">CHF {Number(amount).toFixed(2)}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Execution date</dt>
              <dd className="font-medium">{executionDate}</dd>
            </div>
          </dl>

          <form action={confirmPayOperation} className="mt-6 flex flex-wrap gap-3">
            <input type="hidden" name="sourceRef" value={sourceRef} />
            <input type="hidden" name="recipientName" value={recipientName} />
            <input type="hidden" name="paymentType" value={paymentType} />
            <input type="hidden" name="beneficiaryIban" value={beneficiaryIban} />
            <input type="hidden" name="beneficiaryBic" value={beneficiaryBic} />
            <input type="hidden" name="reference" value={reference} />
            <input type="hidden" name="amount" value={amount} />
            <input type="hidden" name="executionDate" value={executionDate} />
            <Button type="submit">Make payment</Button>
            <Link
              href={`/payments/pay?source=${encodeURIComponent(sourceRef)}&paymentType=${encodeURIComponent(paymentType)}&beneficiaryIban=${encodeURIComponent(beneficiaryIban)}&beneficiaryBic=${encodeURIComponent(beneficiaryBic)}&reference=${encodeURIComponent(reference)}`}
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
