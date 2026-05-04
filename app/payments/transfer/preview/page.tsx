import Link from "next/link";
import { redirect } from "next/navigation";
import { confirmTransferOperation } from "@/app/actions/payments";
import { Button } from "@/components/atoms/button";
import { Container } from "@/components/atoms/container";
import { SectionTitle } from "@/components/atoms/section-title";
import { accounts, creditCards } from "@/data/banking-mock";
import { isAuthenticated } from "@/lib/auth";
import { isExecutionDateAtLeastTomorrow } from "@/lib/payment-execution-date";
import { getLocalizedAccountNameById } from "@/lib/i18n/account-names";
import { getServerT } from "@/lib/i18n/server";

type Props = {
  searchParams: Promise<{
    sourceRef?: string;
    destinationAccountId?: string;
    amount?: string;
    executionDate?: string;
    reference?: string;
    immediateExecution?: string;
  }>;
};

function required(value: string | undefined) {
  return value?.trim() ?? "";
}

export default async function TransferPreviewPage({ searchParams }: Props) {
  if (!(await isAuthenticated())) {
    redirect("/login");
  }
  const { t } = await getServerT();

  const params = await searchParams;
  const sourceRef = required(params.sourceRef);
  const destinationAccountId = required(params.destinationAccountId);
  const amount = required(params.amount);
  const executionDate = required(params.executionDate);
  const reference = required(params.reference);
  const immediateExecution = params.immediateExecution !== "0";
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
  const destinationLabel = (() => {
    const destinationAccount = accounts.find((item) => item.id === destinationAccountId);
    return destinationAccount
      ? getLocalizedAccountNameById(destinationAccount.id, t, destinationAccount.name)
      : destinationAccountId;
  })();

  if (!sourceRef || !destinationAccountId || !amount || !executionDate) {
    redirect("/payments/transfer");
  }

  if (!immediateExecution && !isExecutionDateAtLeastTomorrow(executionDate)) {
    redirect("/payments/transfer");
  }

  return (
    <Container>
      <main id="main-content" className="space-y-8">
        <header className="space-y-2">
          <SectionTitle as="h1">{t("transferPreview.title")}</SectionTitle>
          <p className="text-sm text-muted-foreground">
            {t("transferPreview.subtitle")}
          </p>
        </header>

        <section className="rounded-2xl border border-card-border bg-card p-5 shadow-sm sm:p-6">
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-muted-foreground">{t("common.source")}</dt>
              <dd className="font-medium">{sourceLabel}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">{t("transferPreview.destinationAccount")}</dt>
              <dd className="font-medium">{destinationLabel}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">{t("common.amount")}</dt>
              <dd className="font-medium">CHF {Number(amount).toFixed(2)}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">{t("payPreview.immediateExecution")}</dt>
              <dd className="font-medium">
                {immediateExecution ? t("common.yes") : t("common.no")}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">{t("common.executionDate")}</dt>
              <dd className="font-medium">
                {immediateExecution
                  ? t("paymentScheduling.executedToday")
                  : executionDate}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">{t("transferPreview.note")}</dt>
              <dd className="font-medium">{reference || "-"}</dd>
            </div>
          </dl>

          <form action={confirmTransferOperation} className="mt-6 flex flex-wrap gap-3">
            <input type="hidden" name="sourceRef" value={sourceRef} />
            <input type="hidden" name="destinationAccountId" value={destinationAccountId} />
            <input type="hidden" name="amount" value={amount} />
            <input type="hidden" name="executionDate" value={executionDate} />
            <input type="hidden" name="reference" value={reference} />
            <input
              type="hidden"
              name="immediateExecution"
              value={immediateExecution ? "1" : "0"}
            />
            <Button type="submit">{t("transferPreview.makeTransfer")}</Button>
            <Link
              href={`/payments/transfer?source=${encodeURIComponent(sourceRef)}&immediateExecution=${immediateExecution ? "1" : "0"}`}
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
