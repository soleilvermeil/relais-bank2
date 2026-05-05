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
import {
  formatSwissAddressLines,
  isValidQrrReference,
  isValidScorReference,
  normalizeQrrDigits,
  normalizeScorReference,
  type PaymentReferenceType,
  type SwissAddress,
} from "@/lib/swiss-qr-bill/types";

type Props = {
  searchParams: Promise<{
    sourceRef?: string;
    recipientName?: string;
    paymentType?: string;
    beneficiaryIban?: string;
    beneficiaryBic?: string;
    reference?: string;
    referenceType?: string;
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

function required(value: string | undefined) {
  return value?.trim() ?? "";
}

function parseRefType(
  raw: string | undefined,
  referenceValue: string,
): PaymentReferenceType {
  const u = (raw ?? "").trim().toUpperCase();
  if (u === "QRR" || u === "SCOR" || u === "NON") {
    return u;
  }
  const r = referenceValue.trim();
  if (!r) {
    return "NON";
  }
  if (normalizeScorReference(r).startsWith("RF")) {
    return "SCOR";
  }
  if (normalizeQrrDigits(r).length === 27) {
    return "QRR";
  }
  return "NON";
}

function parseAddress(params: Awaited<Props["searchParams"]>): SwissAddress | null {
  const street = required(params.beneficiaryStreet);
  const buildingNumber = required(params.beneficiaryBuildingNumber);
  const postalCode = required(params.beneficiaryPostalCode);
  const town = required(params.beneficiaryTown);
  const countryRaw = required(params.beneficiaryCountry).toUpperCase() || "CH";
  const country = countryRaw.length >= 2 ? countryRaw.slice(0, 2) : "";
  if (!street || !postalCode || !town || !/^[A-Z]{2}$/.test(country)) {
    return null;
  }
  return { street, buildingNumber, postalCode, town, country };
}

function payFormQuery(params: Awaited<Props["searchParams"]>) {
  const q = new URLSearchParams();
  const sourceRef = required(params.sourceRef);
  const ref = required(params.reference);
  const refType = parseRefType(params.referenceType, ref);
  if (sourceRef) {
    q.set("source", sourceRef);
  }
  q.set("recipientName", required(params.recipientName));
  q.set("paymentType", required(params.paymentType));
  q.set("beneficiaryIban", required(params.beneficiaryIban));
  q.set("beneficiaryBic", required(params.beneficiaryBic));
  q.set("referenceType", refType);
  q.set("reference", ref);
  q.set("amount", required(params.amount));
  q.set("executionDate", required(params.executionDate));
  q.set("immediateExecution", params.immediateExecution === "1" ? "1" : "0");
  q.set("beneficiaryStreet", required(params.beneficiaryStreet));
  q.set("beneficiaryBuildingNumber", required(params.beneficiaryBuildingNumber));
  q.set("beneficiaryPostalCode", required(params.beneficiaryPostalCode));
  q.set("beneficiaryTown", required(params.beneficiaryTown));
  q.set("beneficiaryCountry", required(params.beneficiaryCountry) || "CH");
  q.set("notice", required(params.notice));
  q.set("accountingEntry", required(params.accountingEntry));
  return q.toString();
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
  const referenceType = parseRefType(params.referenceType, reference);
  const amount = required(params.amount);
  const executionDate = required(params.executionDate);
  const immediateExecution = params.immediateExecution === "1";
  const notice = required(params.notice);
  const accountingEntry = required(params.accountingEntry);
  const address = parseAddress(params);
  const backQuery = payFormQuery(params);

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
    (isInternational && !beneficiaryBic) ||
    !address
  ) {
    redirect(`/payments/pay?${backQuery}`);
  }

  if (referenceType === "QRR") {
    const digits = normalizeQrrDigits(reference);
    if (!isValidQrrReference(digits)) {
      redirect(`/payments/pay?${backQuery}`);
    }
  } else if (referenceType === "SCOR") {
    const scor = normalizeScorReference(reference);
    if (!isValidScorReference(scor)) {
      redirect(`/payments/pay?${backQuery}`);
    }
  } else if (referenceType === "NON" && reference) {
    redirect(`/payments/pay?${backQuery}`);
  }

  if (!immediateExecution && !isExecutionDateAtLeastTomorrow(executionDate)) {
    redirect(`/payments/pay?${backQuery}`);
  }

  const amountNum = Number(amount);
  const immediateFee = immediateExecution ? PAY_IMMEDIATE_FEE_CHF : 0;
  const totalChf = amountNum + immediateFee;
  const addressLines = formatSwissAddressLines(address);

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
            <div className="sm:col-span-2">
              <dt className="text-sm text-muted-foreground">{t("payPreview.address")}</dt>
              <dd className="font-medium whitespace-pre-line">{addressLines.join("\n")}</dd>
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
            {referenceType === "QRR" ? (
              <div>
                <dt className="text-sm text-muted-foreground">{t("payPreview.referenceQrr")}</dt>
                <dd className="font-medium">{normalizeQrrDigits(reference)}</dd>
              </div>
            ) : null}
            {referenceType === "SCOR" ? (
              <div>
                <dt className="text-sm text-muted-foreground">{t("payPreview.referenceScor")}</dt>
                <dd className="font-medium">{normalizeScorReference(reference)}</dd>
              </div>
            ) : null}
            <div>
              <dt className="text-sm text-muted-foreground">{t("common.amount")}</dt>
              <dd className="font-medium">CHF {amountNum.toFixed(2)}</dd>
            </div>
            {notice ? (
              <div className="sm:col-span-2">
                <dt className="text-sm text-muted-foreground">{t("payPreview.notice")}</dt>
                <dd className="font-medium whitespace-pre-wrap">{notice}</dd>
              </div>
            ) : null}
            {accountingEntry ? (
              <div className="sm:col-span-2">
                <dt className="text-sm text-muted-foreground">{t("payPreview.accountingEntry")}</dt>
                <dd className="font-medium whitespace-pre-wrap">{accountingEntry}</dd>
              </div>
            ) : null}
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
            <input type="hidden" name="referenceType" value={referenceType} />
            <input type="hidden" name="reference" value={reference} />
            <input type="hidden" name="amount" value={amount} />
            <input type="hidden" name="executionDate" value={executionDate} />
            <input type="hidden" name="notice" value={notice} />
            <input type="hidden" name="accountingEntry" value={accountingEntry} />
            <input type="hidden" name="beneficiaryStreet" value={address.street} />
            <input type="hidden" name="beneficiaryBuildingNumber" value={address.buildingNumber} />
            <input type="hidden" name="beneficiaryPostalCode" value={address.postalCode} />
            <input type="hidden" name="beneficiaryTown" value={address.town} />
            <input type="hidden" name="beneficiaryCountry" value={address.country} />
            <input
              type="hidden"
              name="immediateExecution"
              value={immediateExecution ? "1" : "0"}
            />
            <Button type="submit">{t("payPreview.makePayment")}</Button>
            <Link
              href={`/payments/pay?${backQuery}`}
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
