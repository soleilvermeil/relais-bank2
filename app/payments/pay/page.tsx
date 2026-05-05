import { redirect } from "next/navigation";
import {
  creditCards,
  getAccountsWithLiveBalances,
} from "@/data/banking-mock";
import { Button } from "@/components/atoms/button";
import { Container } from "@/components/atoms/container";
import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";
import { BeneficiaryAddressFields } from "@/components/molecules/beneficiary-address-fields";
import { PaymentAmountAndScheduling } from "@/components/molecules/payment-amount-and-scheduling";
import { PayBeneficiaryFields } from "@/components/molecules/pay-beneficiary-fields";
import { PaymentReferenceFields } from "@/components/molecules/payment-reference-fields";
import { ProductSelect } from "@/components/molecules/product-select";
import { SectionTitle } from "@/components/atoms/section-title";
import { isAuthenticated } from "@/lib/auth";
import {
  getTomorrowLocalIso,
  isExecutionDateAtLeastTomorrow,
} from "@/lib/payment-execution-date";
import { getLocalizedAccountNameById } from "@/lib/i18n/account-names";
import { getServerT } from "@/lib/i18n/server";
import {
  normalizeQrrDigits,
  normalizeScorReference,
  type PaymentReferenceType,
} from "@/lib/swiss-qr-bill/types";

type Props = {
  searchParams: Promise<{
    source?: string;
    paymentType?: string;
    beneficiaryIban?: string;
    beneficiaryBic?: string;
    reference?: string;
    referenceType?: string;
    recipientName?: string;
    amount?: string;
    executionDate?: string;
    immediateExecution?: string;
    beneficiaryStreet?: string;
    beneficiaryBuildingNumber?: string;
    beneficiaryPostalCode?: string;
    beneficiaryTown?: string;
    beneficiaryCountry?: string;
    notice?: string;
    accountingEntry?: string;
  }>;
};

const chfFormatter = new Intl.NumberFormat("de-CH", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function parseReferenceTypeFromParams(
  raw: string | undefined,
  reference: string,
): PaymentReferenceType | "" {
  const u = (raw ?? "").trim().toUpperCase();
  if (u === "QRR" || u === "SCOR" || u === "NON") {
    return u;
  }
  const r = reference.trim();
  if (!r) {
    return "";
  }
  if (normalizeScorReference(r).startsWith("RF")) {
    return "SCOR";
  }
  if (normalizeQrrDigits(r).length === 27) {
    return "QRR";
  }
  return "";
}

export default async function PayFormPage({ searchParams }: Props) {
  if (!(await isAuthenticated())) {
    redirect("/login");
  }
  const { t } = await getServerT();

  const params = await searchParams;
  const defaultSource = params.source ?? "";
  const defaultPaymentType =
    params.paymentType === "international" ? "international" : "domestic";
  const defaultBeneficiaryIban = params.beneficiaryIban ?? "";
  const defaultBeneficiaryBic = params.beneficiaryBic ?? "";
  const defaultReference = params.reference ?? "";
  const defaultReferenceType = parseReferenceTypeFromParams(
    params.referenceType,
    defaultReference,
  );
  const defaultRecipientName = params.recipientName ?? "";
  const defaultAmount = params.amount ?? "";
  const tomorrowIso = getTomorrowLocalIso();
  const rawExecutionDate = params.executionDate?.trim() ?? "";
  const defaultExecutionDate =
    rawExecutionDate && isExecutionDateAtLeastTomorrow(rawExecutionDate)
      ? rawExecutionDate
      : tomorrowIso;
  const defaultImmediate = params.immediateExecution === "1";
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

  const textareaClass =
    "box-border min-h-[88px] w-full rounded-xl border border-card-border bg-card px-3 py-2.5 text-base text-foreground shadow-inner placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <Container>
      <main id="main-content" className="space-y-8">
        <header className="space-y-2">
          <SectionTitle as="h1">{t("payForm.title")}</SectionTitle>
          <p className="text-sm text-muted-foreground">
            {t("payForm.subtitle")}
          </p>
        </header>

        <section className="rounded-2xl border border-card-border bg-card p-5 shadow-sm sm:p-6">
          <form action="/payments/pay/preview" method="get" className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="sourceRef">{t("payForm.source")}</Label>
              <ProductSelect
                id="sourceRef"
                name="sourceRef"
                defaultValue={defaultSource}
                options={sourceOptions}
                placeholder={t("payForm.sourcePlaceholder")}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipientName">{t("payForm.recipient")}</Label>
              <Input
                id="recipientName"
                name="recipientName"
                required
                defaultValue={defaultRecipientName}
                placeholder={t("payForm.recipientPlaceholder")}
              />
            </div>

            <BeneficiaryAddressFields
              defaults={{
                street: params.beneficiaryStreet,
                buildingNumber: params.beneficiaryBuildingNumber,
                postalCode: params.beneficiaryPostalCode,
                town: params.beneficiaryTown,
                country: params.beneficiaryCountry,
              }}
            />

            <PayBeneficiaryFields
              defaultPaymentType={defaultPaymentType}
              defaultBeneficiaryIban={defaultBeneficiaryIban}
              defaultBeneficiaryBic={defaultBeneficiaryBic}
            />

            <PaymentReferenceFields
              defaultReferenceType={defaultReferenceType}
              defaultReference={defaultReference}
            />

            <PaymentAmountAndScheduling
              mode="pay"
              amountDefaultValue={defaultAmount}
              tomorrowIso={tomorrowIso}
              executionDefaultValue={defaultExecutionDate}
              defaultImmediate={defaultImmediate}
            />

            <div className="space-y-2">
              <Label htmlFor="notice">{t("payForm.notice")}</Label>
              <textarea
                id="notice"
                name="notice"
                rows={3}
                defaultValue={params.notice ?? ""}
                placeholder={t("payForm.noticePlaceholder")}
                className={textareaClass}
              />
              <p className="text-xs text-muted-foreground">{t("payForm.noticeHint")}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountingEntry">{t("payForm.accountingEntry")}</Label>
              <textarea
                id="accountingEntry"
                name="accountingEntry"
                rows={2}
                defaultValue={params.accountingEntry ?? ""}
                placeholder={t("payForm.accountingEntryPlaceholder")}
                className={textareaClass}
              />
              <p className="text-xs text-muted-foreground">{t("payForm.accountingEntryPrivateNote")}</p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button type="submit">{t("common.continue")}</Button>
            </div>
          </form>
        </section>
      </main>
    </Container>
  );
}
