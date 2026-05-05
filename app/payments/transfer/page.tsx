import { redirect } from "next/navigation";
import {
  creditCards,
  getAccountsWithLiveBalances,
} from "@/data/banking-mock";
import type { HolidayShift, StandingFrequency } from "@/data/banking/types";
import { Button } from "@/components/atoms/button";
import { Container } from "@/components/atoms/container";
import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";
import { PaymentScheduleFields } from "@/components/molecules/payment-schedule-fields";
import { ProductSelect } from "@/components/molecules/product-select";
import { SectionTitle } from "@/components/atoms/section-title";
import { isAuthenticated } from "@/lib/auth";
import {
  getTomorrowLocalIso,
  isExecutionDateAtLeastTomorrow,
} from "@/lib/payment-execution-date";
import { getLocalizedAccountNameById } from "@/lib/i18n/account-names";
import { getServerT } from "@/lib/i18n/server";

type Props = {
  searchParams: Promise<{
    source?: string;
    destination?: string;
    immediateExecution?: string;
    accountingEntry?: string;
    amount?: string;
    executionDate?: string;
    paymentSchedule?: string;
    standingFirstExecutionDate?: string;
    standingFrequency?: string;
    standingHolidayShift?: string;
    standingHasEnd?: string;
    standingEndDate?: string;
  }>;
};

const chfFormatter = new Intl.NumberFormat("de-CH", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const FREQUENCIES: StandingFrequency[] = [
  "weekly",
  "monthly",
  "quarterly",
  "semiAnnual",
  "yearly",
];

function parseSchedule(raw: string | undefined): "one_time" | "standing" {
  return raw === "standing" ? "standing" : "one_time";
}

function parseFrequency(raw: string | undefined): StandingFrequency | undefined {
  const v = (raw ?? "").trim() as StandingFrequency;
  return FREQUENCIES.includes(v) ? v : undefined;
}

function parseHolidayShift(raw: string | undefined): HolidayShift | undefined {
  return raw === "before" || raw === "after" ? raw : undefined;
}

export default async function TransferFormPage({ searchParams }: Props) {
  if (!(await isAuthenticated())) {
    redirect("/login");
  }
  const { t } = await getServerT();

  const params = await searchParams;
  const defaultSource = params.source ?? "";
  const defaultDestination = params.destination ?? "";
  const defaultAccountingEntry = params.accountingEntry ?? "";
  const tomorrowIso = getTomorrowLocalIso();
  const rawExecutionDate = params.executionDate?.trim() ?? "";
  const defaultExecutionDate =
    rawExecutionDate && isExecutionDateAtLeastTomorrow(rawExecutionDate)
      ? rawExecutionDate
      : tomorrowIso;
  const defaultImmediate = params.immediateExecution !== "0";
  const defaultAmount = params.amount ?? "";
  const defaultPaymentSchedule = parseSchedule(params.paymentSchedule);
  const defaultStandingFirst =
    params.standingFirstExecutionDate &&
    params.standingFirstExecutionDate >= tomorrowIso
      ? params.standingFirstExecutionDate
      : tomorrowIso;
  const defaultStandingFreq = parseFrequency(params.standingFrequency) ?? "monthly";
  const defaultStandingShift = parseHolidayShift(params.standingHolidayShift) ?? "before";
  const defaultStandingHasEnd = params.standingHasEnd === "1";

  const accounts = await getAccountsWithLiveBalances();
  const sourceOptions = [
    ...accounts.map((account) => ({
      value: `account:${account.id}`,
      label: getLocalizedAccountNameById(account.id, t, account.name),
      detail: account.iban ?? t("products.accountNumber", { id: account.id }),
      amountLabel: `CHF ${chfFormatter.format(account.balance)}`,
    })),
    ...creditCards.map((card) => ({
      value: `card:${card.id}`,
      label: card.name,
      detail: t("products.cardNumberMasked", { last4: card.last4 }),
      amountLabel: `CHF ${chfFormatter.format(card.amount)}`,
    })),
  ];
  const destinationOptions = accounts.map((account) => ({
    value: account.id,
    label: getLocalizedAccountNameById(account.id, t, account.name),
    detail: account.iban ?? t("products.accountNumber", { id: account.id }),
    amountLabel: `CHF ${chfFormatter.format(account.balance)}`,
  }));

  const sectionTitleClass = "text-base font-semibold text-foreground";

  return (
    <Container>
      <main id="main-content" className="space-y-8">
        <header className="space-y-2">
          <SectionTitle as="h1">{t("transferForm.title")}</SectionTitle>
          <p className="text-sm text-muted-foreground">
            {t("transferForm.subtitle")}
          </p>
        </header>

        <section className="rounded-2xl border border-card-border bg-card p-5 shadow-sm sm:p-6">
          <form action="/payments/transfer/preview" method="get" className="space-y-8">
            <div className="space-y-4">
              <h2 className={sectionTitleClass}>{t("payForm.sections.beneficiary")}</h2>
              <div className="space-y-2">
                <Label htmlFor="destinationAccountId">{t("transferForm.destination")}</Label>
                <ProductSelect
                  id="destinationAccountId"
                  name="destinationAccountId"
                  defaultValue={defaultDestination}
                  options={destinationOptions}
                  placeholder={t("transferForm.destinationPlaceholder")}
                  required
                />
              </div>
            </div>

            <div className="space-y-4 border-t border-card-border pt-6">
              <h2 className={sectionTitleClass}>{t("payForm.sections.paymentDetails")}</h2>
              <PaymentScheduleFields
                mode="transfer"
                tomorrowIso={tomorrowIso}
                executionDefaultValue={defaultExecutionDate}
                defaultImmediate={defaultImmediate}
                defaults={{
                  paymentSchedule: defaultPaymentSchedule,
                  standingFirstExecutionDate: defaultStandingFirst,
                  standingFrequency: defaultStandingFreq,
                  standingHolidayShift: defaultStandingShift,
                  standingHasEnd: defaultStandingHasEnd,
                  standingEndDate: params.standingEndDate,
                }}
              />
              <div className="space-y-2">
                <Label htmlFor="sourceRef">{t("transferForm.source")}</Label>
                <ProductSelect
                  id="sourceRef"
                  name="sourceRef"
                  defaultValue={defaultSource}
                  options={sourceOptions}
                  placeholder={t("transferForm.sourcePlaceholder")}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">{t("transferForm.amount")}</Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  defaultValue={defaultAmount}
                  required
                />
              </div>
            </div>

            <div className="space-y-4 border-t border-card-border pt-6">
              <h2 className={sectionTitleClass}>{t("payForm.sections.details")}</h2>
              <div className="space-y-2">
                <Label htmlFor="accountingEntry">{t("transferForm.accountingEntry")}</Label>
                <Input
                  id="accountingEntry"
                  name="accountingEntry"
                  defaultValue={defaultAccountingEntry}
                  placeholder={t("transferForm.accountingEntryPlaceholder")}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3 border-t border-card-border pt-6">
              <Button type="submit">{t("common.continue")}</Button>
            </div>
          </form>
        </section>
      </main>
    </Container>
  );
}
