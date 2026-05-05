import Link from "next/link";
import { redirect } from "next/navigation";
import { confirmPayOperation } from "@/app/actions/payments";
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
    beneficiaryIban?: string;
    beneficiaryBic?: string;
    reference?: string;
    referenceType?: string;
    amount?: string;
    executionDate?: string;
    immediateExecution?: string;
    paymentSchedule?: string;
    standingFirstExecutionDate?: string;
    standingFrequency?: string;
    standingHolidayShift?: string;
    standingHasEnd?: string;
    standingEndDate?: string;
    beneficiaryStreet?: string;
    beneficiaryBuildingNumber?: string;
    beneficiaryPostalCode?: string;
    beneficiaryTown?: string;
    beneficiaryCountry?: string;
    notice?: string;
    accountingEntry?: string;
    debtorName?: string;
    debtorCountry?: string;
    debtorTown?: string;
    debtorPostalCode?: string;
    debtorStreet?: string;
    debtorBuildingNumber?: string;
    hasUltimateDebtor?: string;
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
  if (!postalCode || !town || !/^[A-Z]{2}$/.test(country)) {
    return null;
  }
  return { street, buildingNumber, postalCode, town, country };
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

function payFormQuery(params: Awaited<Props["searchParams"]>) {
  const q = new URLSearchParams();
  const sourceRef = required(params.sourceRef);
  const ref = required(params.reference);
  const refType = parseRefType(params.referenceType, ref);
  if (sourceRef) {
    q.set("source", sourceRef);
  }
  q.set("recipientName", required(params.recipientName));
  q.set("beneficiaryIban", required(params.beneficiaryIban));
  q.set("beneficiaryBic", required(params.beneficiaryBic));
  q.set("referenceType", refType);
  q.set("reference", ref);
  q.set("amount", required(params.amount));
  q.set("paymentSchedule", parsePaymentSchedule(params.paymentSchedule));
  q.set("standingFirstExecutionDate", required(params.standingFirstExecutionDate));
  q.set("standingFrequency", required(params.standingFrequency));
  q.set("standingHolidayShift", required(params.standingHolidayShift));
  q.set("standingHasEnd", params.standingHasEnd === "1" ? "1" : "0");
  q.set("standingEndDate", required(params.standingEndDate));
  q.set("executionDate", required(params.executionDate));
  q.set("immediateExecution", params.immediateExecution === "1" ? "1" : "0");
  q.set("beneficiaryStreet", required(params.beneficiaryStreet));
  q.set("beneficiaryBuildingNumber", required(params.beneficiaryBuildingNumber));
  q.set("beneficiaryPostalCode", required(params.beneficiaryPostalCode));
  q.set("beneficiaryTown", required(params.beneficiaryTown));
  q.set("beneficiaryCountry", required(params.beneficiaryCountry) || "CH");
  q.set("notice", required(params.notice));
  q.set("accountingEntry", required(params.accountingEntry));
  q.set("hasUltimateDebtor", params.hasUltimateDebtor === "1" ? "1" : "0");
  q.set("debtorName", required(params.debtorName));
  q.set("debtorCountry", required(params.debtorCountry) || "CH");
  q.set("debtorTown", required(params.debtorTown));
  q.set("debtorPostalCode", required(params.debtorPostalCode));
  q.set("debtorStreet", required(params.debtorStreet));
  q.set("debtorBuildingNumber", required(params.debtorBuildingNumber));
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
  const beneficiaryIban = required(params.beneficiaryIban);
  const beneficiaryBic = required(params.beneficiaryBic);
  const reference = required(params.reference);
  const referenceType = parseRefType(params.referenceType, reference);
  const amount = required(params.amount);
  const notice = required(params.notice);
  const accountingEntry = required(params.accountingEntry);
  const address = parseAddress(params);
  const backQuery = payFormQuery(params);
  const paymentSchedule = parsePaymentSchedule(params.paymentSchedule);
  const executionDate = required(params.executionDate);
  const immediateExecution = params.immediateExecution === "1";
  const standingPreview =
    paymentSchedule === "standing" ? parseStandingPreview(params) : null;

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

  const baseInvalid =
    !sourceRef ||
    !recipientName ||
    !beneficiaryIban ||
    !amount ||
    !address ||
    (paymentSchedule === "one_time" &&
      !immediateExecution &&
      (!executionDate || !isExecutionDateAtLeastTomorrow(executionDate))) ||
    (paymentSchedule === "standing" && !standingPreview);

  if (baseInvalid) {
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

  const amountNum = Number(amount);
  const immediateFee =
    paymentSchedule === "one_time" && immediateExecution ? PAY_IMMEDIATE_FEE_CHF : 0;
  const totalChf = amountNum + immediateFee;
  const addressLines = formatSwissAddressLines(address);

  const hasDebtor = params.hasUltimateDebtor === "1";
  const debtorName = required(params.debtorName);
  const debtorCountry = (required(params.debtorCountry) || "CH").toUpperCase().slice(0, 2);
  const debtorTown = required(params.debtorTown);
  const debtorPostal = required(params.debtorPostalCode);
  const debtorStreet = required(params.debtorStreet);
  const debtorBuilding = required(params.debtorBuildingNumber);
  const debtorAddressLines =
    hasDebtor && debtorName && debtorTown && debtorPostal && /^[A-Z]{2}$/.test(debtorCountry)
      ? formatSwissAddressLines({
          street: debtorStreet,
          buildingNumber: debtorBuilding,
          postalCode: debtorPostal,
          town: debtorTown,
          country: debtorCountry,
        })
      : null;

  if (hasDebtor && (!debtorName || !debtorTown || !debtorPostal || !/^[A-Z]{2}$/.test(debtorCountry))) {
    redirect(`/payments/pay?${backQuery}`);
  }

  const bicTrimmed = beneficiaryBic.trim();

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
          <h2 className="mb-3 text-base font-semibold">{t("payForm.sections.beneficiary")}</h2>
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-muted-foreground">{t("payPreview.recipient")}</dt>
              <dd className="font-medium">{recipientName}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm text-muted-foreground">{t("payPreview.address")}</dt>
              <dd className="font-medium whitespace-pre-line">{addressLines.join("\n")}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">{t("payPreview.beneficiaryIban")}</dt>
              <dd className="font-medium">{beneficiaryIban}</dd>
            </div>
            {bicTrimmed ? (
              <div>
                <dt className="text-sm text-muted-foreground">{t("payPreview.beneficiaryBic")}</dt>
                <dd className="font-medium">{bicTrimmed}</dd>
              </div>
            ) : null}
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
              <dd className="font-medium">CHF {amountNum.toFixed(2)}</dd>
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
              immediateExecution ? (
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
              )
            ) : null}
          </dl>

          <h2 className="mb-3 mt-8 text-base font-semibold border-t border-card-border pt-6">
            {t("payForm.sections.details")}
          </h2>
          <dl className="grid gap-4 sm:grid-cols-2">
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
            {referenceType === "NON" ? (
              <div>
                <dt className="text-sm text-muted-foreground">{t("payPreview.reference")}</dt>
                <dd className="font-medium">—</dd>
              </div>
            ) : null}
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
          </dl>

          {hasDebtor && debtorAddressLines ? (
            <>
              <h2 className="mb-3 mt-8 text-base font-semibold border-t border-card-border pt-6">
                {t("payForm.sections.debtor")}
              </h2>
              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm text-muted-foreground">{t("paymentDetail.debtorName")}</dt>
                  <dd className="font-medium">{debtorName}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-sm text-muted-foreground">{t("paymentDetail.debtorAddress")}</dt>
                  <dd className="font-medium whitespace-pre-line">{debtorAddressLines.join("\n")}</dd>
                </div>
              </dl>
            </>
          ) : null}

          <form action={confirmPayOperation} className="mt-6 flex flex-wrap gap-3">
            <input type="hidden" name="sourceRef" value={sourceRef} />
            <input type="hidden" name="recipientName" value={recipientName} />
            <input type="hidden" name="beneficiaryIban" value={beneficiaryIban} />
            <input type="hidden" name="beneficiaryBic" value={bicTrimmed} />
            <input type="hidden" name="referenceType" value={referenceType} />
            <input type="hidden" name="reference" value={reference} />
            <input type="hidden" name="amount" value={amount} />
            <input type="hidden" name="paymentSchedule" value={paymentSchedule} />
            <input type="hidden" name="notice" value={notice} />
            <input type="hidden" name="accountingEntry" value={accountingEntry} />
            <input type="hidden" name="beneficiaryStreet" value={address.street} />
            <input type="hidden" name="beneficiaryBuildingNumber" value={address.buildingNumber} />
            <input type="hidden" name="beneficiaryPostalCode" value={address.postalCode} />
            <input type="hidden" name="beneficiaryTown" value={address.town} />
            <input type="hidden" name="beneficiaryCountry" value={address.country} />
            <input type="hidden" name="hasUltimateDebtor" value={hasDebtor ? "1" : "0"} />
            <input type="hidden" name="debtorName" value={debtorName} />
            <input type="hidden" name="debtorCountry" value={debtorCountry} />
            <input type="hidden" name="debtorTown" value={debtorTown} />
            <input type="hidden" name="debtorPostalCode" value={debtorPostal} />
            <input type="hidden" name="debtorStreet" value={debtorStreet} />
            <input type="hidden" name="debtorBuildingNumber" value={debtorBuilding} />
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
