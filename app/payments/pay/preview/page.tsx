import Link from "next/link";
import { redirect } from "next/navigation";
import { confirmPayOperation } from "@/app/actions/payments";
import { Button } from "@/components/atoms/button";
import { Container } from "@/components/atoms/container";
import { SectionTitle } from "@/components/atoms/section-title";
import { accounts, creditCards } from "@/data/banking-mock";
import { isAuthenticated } from "@/lib/auth";
import { isExecutionDateAtLeastTomorrow } from "@/lib/payment-execution-date";
import { PAY_IMMEDIATE_FEE_CHF } from "@/lib/payment-immediate";
import { getLocalizedAccountNameById } from "@/lib/i18n/account-names";
import { getServerT } from "@/lib/i18n/server";

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
    immediateExecution?: string;
  }>;
};

function required(value: string | undefined) {
  return value?.trim() ?? "";
}

export default async function PayPreviewPage({ searchParams }: Props) {
  if (!(await isAuthenticated())) {
    redirect("/login");
  }
  const { t } = await getServerT();

  const params = await searchParams;
  const sourceRef = required(params.sourceRef);
  const recipientName = required(params.recipientName);
  const paymentType = required(params.paymentType);
  const beneficiaryIban = required(params.beneficiaryIban);
  const beneficiaryBic = required(params.beneficiaryBic);
  const reference = required(params.reference);
  const amount = required(params.amount);
  const executionDate = required(params.executionDate);
  const immediateExecution = params.immediateExecution === "1";
  const isDomestic = paymentType === "domestic";
  const isInternational = paymentType === "international";
  const sourceLabel = (() => {
    const [entityType, entityId] = sourceRef.split(":", 2);
    if (!entityType || !entityId) {
      return sourceRef;
    }
    if (entityType === "account") {
      const account = accounts.find((item) => item.id === entityId);
      return account
        ? getLocalizedAccountNameById(account.id, t, account.name)
        : sourceRef;
    }
    if (entityType === "card") {
      const card = creditCards.find((item) => item.id === entityId);
      return card?.name ?? sourceRef;
    }
    return sourceRef;
  })();

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

  if (!immediateExecution && !isExecutionDateAtLeastTomorrow(executionDate)) {
    redirect("/payments/pay");
  }

  const amountNum = Number(amount);
  const immediateFee = immediateExecution ? PAY_IMMEDIATE_FEE_CHF : 0;
  const totalChf = amountNum + immediateFee;

  return (
    <Container>
      <main id="main-content" className="space-y-8">
        <header className="space-y-2">
          <SectionTitle as="h1">{t("payPreview.title")}</SectionTitle>
          <p className="text-sm text-muted-foreground">
            {t("payPreview.subtitle")}
          </p>
        </header>

        <section className="rounded-2xl border border-card-border bg-card p-5 shadow-sm sm:p-6">
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-muted-foreground">{t("common.source")}</dt>
              <dd className="font-medium">{sourceLabel}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">{t("payPreview.recipient")}</dt>
              <dd className="font-medium">{recipientName}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">{t("payPreview.paymentType")}</dt>
              <dd className="font-medium">
                {isDomestic ? t("payPreview.domestic") : t("payPreview.international")}
              </dd>
            </div>
            {isInternational ? (
              <div>
                <dt className="text-sm text-muted-foreground">{t("payPreview.beneficiaryBic")}</dt>
                <dd className="font-medium">{beneficiaryBic}</dd>
              </div>
            ) : null}
            <div>
              <dt className="text-sm text-muted-foreground">{t("payPreview.beneficiaryIban")}</dt>
              <dd className="font-medium">{beneficiaryIban}</dd>
            </div>
            {reference ? (
              <div>
                <dt className="text-sm text-muted-foreground">{t("payPreview.reference")}</dt>
                <dd className="font-medium">{reference}</dd>
              </div>
            ) : null}
            <div>
              <dt className="text-sm text-muted-foreground">{t("common.amount")}</dt>
              <dd className="font-medium">CHF {amountNum.toFixed(2)}</dd>
            </div>
            {immediateExecution ? (
              <>
                <div>
                  <dt className="text-sm text-muted-foreground">{t("payPreview.immediateExecution")}</dt>
                  <dd className="font-medium">{t("common.yes")}</dd>
                </div>
                {immediateFee > 0 ? (
                  <div>
                    <dt className="text-sm text-muted-foreground">{t("payPreview.immediateFee")}</dt>
                    <dd className="font-medium">CHF {immediateFee.toFixed(2)}</dd>
                  </div>
                ) : null}
                <div>
                  <dt className="text-sm text-muted-foreground">{t("payPreview.totalDebited")}</dt>
                  <dd className="font-medium">CHF {totalChf.toFixed(2)}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">{t("common.executionDate")}</dt>
                  <dd className="font-medium">{t("paymentScheduling.executedToday")}</dd>
                </div>
              </>
            ) : (
              <div>
                <dt className="text-sm text-muted-foreground">{t("common.executionDate")}</dt>
                <dd className="font-medium">{executionDate}</dd>
              </div>
            )}
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
            <input
              type="hidden"
              name="immediateExecution"
              value={immediateExecution ? "1" : "0"}
            />
            <Button type="submit">{t("payPreview.makePayment")}</Button>
            <Link
              href={`/payments/pay?source=${encodeURIComponent(sourceRef)}&recipientName=${encodeURIComponent(recipientName)}&paymentType=${encodeURIComponent(paymentType)}&beneficiaryIban=${encodeURIComponent(beneficiaryIban)}&beneficiaryBic=${encodeURIComponent(beneficiaryBic)}&reference=${encodeURIComponent(reference)}&amount=${encodeURIComponent(amount)}&executionDate=${encodeURIComponent(executionDate)}&immediateExecution=${immediateExecution ? "1" : "0"}`}
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-card-border bg-muted px-5 py-2.5 text-base font-medium text-foreground"
            >
              {t("common.backToEdit")}
            </Link>
          </form>
        </section>
      </main>
    </Container>
  );
}
