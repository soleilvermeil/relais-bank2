import Link from "next/link";
import { redirect } from "next/navigation";
import { confirmTransferOperation } from "@/app/actions/payments";
import type { HolidayShift, StandingFrequency } from "@/data/banking/types";
import { Button } from "@/components/atoms/button";
import { Container } from "@/components/atoms/container";
import { SectionTitle } from "@/components/atoms/section-title";
import { accounts, creditCards } from "@/data/banking-mock";
import { isAuthenticated } from "@/lib/auth";
import {
  isExecutionDateAtLeastTomorrow,
  parseExecutionDate,
} from "@/lib/payment-execution-date";
import { getLocalizedAccountNameById } from "@/lib/i18n/account-names";
import { getServerT } from "@/lib/i18n/server";

type Props = {
  searchParams: Promise<{
    sourceRef?: string;
    destinationAccountId?: string;
    amount?: string;
    executionDate?: string;
    accountingEntry?: string;
    immediateExecution?: string;
    paymentSchedule?: string;
    standingFirstExecutionDate?: string;
    standingFrequency?: string;
    standingHolidayShift?: string;
    standingHasEnd?: string;
    standingEndDate?: string;
  }>;
};

const FREQUENCIES: StandingFrequency[] = [
  "weekly",
  "monthly",
  "quarterly",
  "semiAnnual",
  "yearly",
];

function required(value: string | undefined) {
  return value?.trim() ?? "";
}

function parsePaymentSchedule(raw: string | undefined): "one_time" | "standing" {
  return raw === "standing" ? "standing" : "one_time";
}

function parseStandingPreview(params: Awaited<Props["searchParams"]>) {
  const first = required(params.standingFirstExecutionDate);
  const freq = required(params.standingFrequency).toLowerCase() as StandingFrequency;
  const shift = required(params.standingHolidayShift).toLowerCase() as HolidayShift;
  const hasEnd = params.standingHasEnd === "1";
  const endDate = required(params.standingEndDate);
  if (!first || !FREQUENCIES.includes(freq)) {
    return null;
  }
  if (shift !== "before" && shift !== "after") {
    return null;
  }
  if (!isExecutionDateAtLeastTomorrow(first)) {
    return null;
  }
  if (hasEnd) {
    if (!endDate) {
      return null;
    }
    const d0 = parseExecutionDate(first);
    const d1 = parseExecutionDate(endDate);
    if (!d0 || !d1 || d1.getTime() < d0.getTime()) {
      return null;
    }
  }
  return { first, freq, shift, hasEnd, endDate };
}

function transferFormQuery(params: Awaited<Props["searchParams"]>) {
  const q = new URLSearchParams();
  q.set("source", required(params.sourceRef));
  q.set("destination", required(params.destinationAccountId));
  q.set("amount", required(params.amount));
  q.set("paymentSchedule", parsePaymentSchedule(params.paymentSchedule));
  q.set("standingFirstExecutionDate", required(params.standingFirstExecutionDate));
  q.set("standingFrequency", required(params.standingFrequency));
  q.set("standingHolidayShift", required(params.standingHolidayShift));
  q.set("standingHasEnd", params.standingHasEnd === "1" ? "1" : "0");
  q.set("standingEndDate", required(params.standingEndDate));
  q.set("executionDate", required(params.executionDate));
  q.set("immediateExecution", params.immediateExecution !== "0" ? "1" : "0");
  const acc = required(params.accountingEntry);
  if (acc) {
    q.set("accountingEntry", acc);
  }
  return q.toString();
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
  const accountingEntry = required(params.accountingEntry);
  const immediateExecution = params.immediateExecution !== "0";
  const paymentSchedule = parsePaymentSchedule(params.paymentSchedule);
  const standingPreview =
    paymentSchedule === "standing" ? parseStandingPreview(params) : null;
  const backQuery = transferFormQuery(params);

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

  const invalid =
    !sourceRef ||
    !destinationAccountId ||
    !amount ||
    (paymentSchedule === "one_time" &&
      !immediateExecution &&
      (!executionDate || !isExecutionDateAtLeastTomorrow(executionDate))) ||
    (paymentSchedule === "standing" && !standingPreview);

  if (invalid) {
    redirect(`/payments/transfer?${backQuery}`);
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
          <h2 className="mb-3 text-base font-semibold">{t("payForm.sections.beneficiary")}</h2>
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-muted-foreground">{t("transferPreview.destinationAccount")}</dt>
              <dd className="font-medium">{destinationLabel}</dd>
            </div>
          </dl>

          <h2 className="mb-3 mt-8 text-base font-semibold border-t border-card-border pt-6">
            {t("payForm.sections.paymentDetails")}
          </h2>
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-muted-foreground">{t("common.source")}</dt>
              <dd className="font-medium">{sourceLabel}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">{t("payForm.paymentSchedule.label")}</dt>
              <dd className="font-medium">
                {paymentSchedule === "standing"
                  ? t("payForm.paymentSchedule.standing")
                  : t("payForm.paymentSchedule.oneTime")}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">{t("common.amount")}</dt>
              <dd className="font-medium">CHF {Number(amount).toFixed(2)}</dd>
            </div>
            {paymentSchedule === "standing" && standingPreview ? (
              <>
                <div>
                  <dt className="text-sm text-muted-foreground">
                    {t("payForm.paymentSchedule.firstExecutionDate")}
                  </dt>
                  <dd className="font-medium">{standingPreview.first}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">{t("payForm.paymentSchedule.frequency")}</dt>
                  <dd className="font-medium">{t(`cadence.${standingPreview.freq}`)}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">{t("payForm.paymentSchedule.holidayShift")}</dt>
                  <dd className="font-medium">
                    {standingPreview.shift === "before"
                      ? t("payForm.paymentSchedule.holidayShiftBefore")
                      : t("payForm.paymentSchedule.holidayShiftAfter")}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">{t("payForm.paymentSchedule.period")}</dt>
                  <dd className="font-medium">
                    {standingPreview.hasEnd && standingPreview.endDate
                      ? standingPreview.endDate
                      : t("payForm.paymentSchedule.unlimited")}
                  </dd>
                </div>
              </>
            ) : null}
            {paymentSchedule === "one_time" ? (
              <>
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
              </>
            ) : null}
          </dl>

          <h2 className="mb-3 mt-8 text-base font-semibold border-t border-card-border pt-6">
            {t("payForm.sections.details")}
          </h2>
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-muted-foreground">{t("transferPreview.accountingEntry")}</dt>
              <dd className="font-medium">{accountingEntry || "—"}</dd>
            </div>
          </dl>

          <form action={confirmTransferOperation} className="mt-6 flex flex-wrap gap-3">
            <input type="hidden" name="sourceRef" value={sourceRef} />
            <input type="hidden" name="destinationAccountId" value={destinationAccountId} />
            <input type="hidden" name="amount" value={amount} />
            <input type="hidden" name="accountingEntry" value={accountingEntry} />
            <input type="hidden" name="paymentSchedule" value={paymentSchedule} />
            {paymentSchedule === "one_time" ? (
              <>
                <input type="hidden" name="executionDate" value={executionDate} />
                <input
                  type="hidden"
                  name="immediateExecution"
                  value={immediateExecution ? "1" : "0"}
                />
              </>
            ) : standingPreview ? (
              <>
                <input type="hidden" name="immediateExecution" value="0" />
                <input type="hidden" name="standingFirstExecutionDate" value={standingPreview.first} />
                <input type="hidden" name="standingFrequency" value={standingPreview.freq} />
                <input type="hidden" name="standingHolidayShift" value={standingPreview.shift} />
                <input
                  type="hidden"
                  name="standingHasEnd"
                  value={standingPreview.hasEnd ? "1" : "0"}
                />
                <input type="hidden" name="standingEndDate" value={standingPreview.endDate} />
              </>
            ) : null}
            <Button type="submit">{t("transferPreview.makeTransfer")}</Button>
            <Link
              href={`/payments/transfer?${backQuery}`}
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
