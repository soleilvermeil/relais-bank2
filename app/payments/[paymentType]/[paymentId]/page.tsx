import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Container } from "@/components/atoms/container";
import { SectionTitle } from "@/components/atoms/section-title";
import { accounts } from "@/data/banking-mock";
import { getPaymentDetail } from "@/data/banking-mock";
import { isAuthenticated } from "@/lib/auth";
import { getLocalizedAccountNameById } from "@/lib/i18n/account-names";
import { getServerT } from "@/lib/i18n/server";
import { formatSwissAddressLines } from "@/lib/swiss-qr-bill/types";

type Props = {
  params: Promise<{
    paymentType: string;
    paymentId: string;
  }>;
};

const chfFormatter = new Intl.NumberFormat("de-CH", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export default async function PaymentDetailPage({ params }: Props) {
  if (!(await isAuthenticated())) {
    redirect("/login");
  }
  const { t } = await getServerT();

  const { paymentType, paymentId } = await params;
  if (
    !paymentId ||
    (paymentType !== "pending" &&
      paymentType !== "standing" &&
      paymentType !== "posted")
  ) {
    notFound();
  }

  const payment = await getPaymentDetail(paymentType, paymentId);
  if (!payment) {
    notFound();
  }

  const sourceAccount = payment.sourceRef.entityType === "account"
    ? accounts.find((account) => account.id === payment.sourceRef.entityId)
    : null;
  const destinationAccount = payment.destinationRef.entityType === "account"
    ? accounts.find((account) => account.id === payment.destinationRef.entityId)
    : null;
  const sourceLabel = sourceAccount
    ? getLocalizedAccountNameById(sourceAccount.id, t, payment.sourceLabel)
    : payment.sourceLabel;
  const destinationLabel = destinationAccount
    ? getLocalizedAccountNameById(destinationAccount.id, t, payment.destinationLabel)
    : payment.destinationLabel;

  const addressLines =
    payment.beneficiaryAddress &&
    (payment.beneficiaryAddress.street ||
      payment.beneficiaryAddress.town ||
      payment.beneficiaryAddress.postalCode)
      ? formatSwissAddressLines(payment.beneficiaryAddress).join("\n")
      : "";

  return (
    <Container>
      <main id="main-content" className="space-y-8">
        <header className="space-y-2">
          <SectionTitle as="h1">{t("paymentDetail.title")}</SectionTitle>
          <p className="text-sm text-muted-foreground">
            {t("paymentDetail.subtitle")}
          </p>
        </header>

        <section className="rounded-2xl border border-card-border bg-card p-5 shadow-sm sm:p-6">
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-muted-foreground">{t("paymentDetail.paymentType")}</dt>
              <dd className="font-medium">
                {payment.paymentType === "pending"
                  ? t("paymentDetail.pendingOrder")
                  : payment.paymentType === "standing"
                    ? t("paymentDetail.standingOrder")
                    : t("paymentDetail.postedTransaction")}
              </dd>
            </div>
            {payment.paymentType === "posted" &&
            payment.immediateExecutionFeeChf != null &&
            payment.immediateExecutionFeeChf > 0 ? (
              <>
                <div>
                  <dt className="text-sm text-muted-foreground">
                    {t("paymentDetail.paymentAmount")}
                  </dt>
                  <dd className="font-medium">
                    CHF{" "}
                    {chfFormatter.format(
                      payment.amount - payment.immediateExecutionFeeChf,
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">
                    {t("paymentDetail.immediateExecutionFee")}
                  </dt>
                  <dd className="font-medium">
                    CHF {chfFormatter.format(payment.immediateExecutionFeeChf)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">
                    {t("paymentDetail.totalDebited")}
                  </dt>
                  <dd className="font-medium">CHF {chfFormatter.format(payment.amount)}</dd>
                </div>
              </>
            ) : (
              <div>
                <dt className="text-sm text-muted-foreground">{t("common.amount")}</dt>
                <dd className="font-medium">CHF {chfFormatter.format(payment.amount)}</dd>
              </div>
            )}
            <div>
              <dt className="text-sm text-muted-foreground">{t("common.source")}</dt>
              <dd className="font-medium">{sourceLabel}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">{t("paymentDetail.destination")}</dt>
              <dd className="font-medium">{destinationLabel}</dd>
            </div>
            {payment.destinationIban ? (
              <div>
                <dt className="text-sm text-muted-foreground">{t("paymentDetail.destinationIban")}</dt>
                <dd className="font-medium">{payment.destinationIban}</dd>
              </div>
            ) : null}
            {addressLines ? (
              <div className="sm:col-span-2">
                <dt className="text-sm text-muted-foreground">{t("paymentDetail.address")}</dt>
                <dd className="font-medium whitespace-pre-line">{addressLines}</dd>
              </div>
            ) : null}
            {payment.referenceType === "QRR" && payment.reference ? (
              <div>
                <dt className="text-sm text-muted-foreground">{t("paymentDetail.referenceQrr")}</dt>
                <dd className="font-medium">{payment.reference}</dd>
              </div>
            ) : payment.referenceType === "SCOR" && payment.reference ? (
              <div>
                <dt className="text-sm text-muted-foreground">{t("paymentDetail.referenceScor")}</dt>
                <dd className="font-medium">{payment.reference}</dd>
              </div>
            ) : payment.reference ? (
              <div>
                <dt className="text-sm text-muted-foreground">{t("paymentDetail.reference")}</dt>
                <dd className="font-medium">{payment.reference}</dd>
              </div>
            ) : null}
            {payment.notice ? (
              <div className="sm:col-span-2">
                <dt className="text-sm text-muted-foreground">{t("paymentDetail.notice")}</dt>
                <dd className="font-medium whitespace-pre-wrap">{payment.notice}</dd>
              </div>
            ) : null}
            {payment.accountingEntry ? (
              <div className="sm:col-span-2">
                <dt className="text-sm text-muted-foreground">{t("paymentDetail.accountingEntry")}</dt>
                <dd className="font-medium whitespace-pre-wrap">{payment.accountingEntry}</dd>
              </div>
            ) : null}
            {payment.paymentType === "posted" && payment.debitCardMaskedNumber ? (
              <div>
                <dt className="text-sm text-muted-foreground">{t("paymentDetail.debitCard")}</dt>
                <dd className="font-medium">{payment.debitCardMaskedNumber}</dd>
              </div>
            ) : null}
            {payment.paymentType === "pending" ? (
              <div>
                <dt className="text-sm text-muted-foreground">{t("common.executionDate")}</dt>
                <dd className="font-medium">{payment.executionDate}</dd>
              </div>
            ) : payment.paymentType === "posted" ? (
              <div>
                <dt className="text-sm text-muted-foreground">{t("paymentDetail.bookingDate")}</dt>
                <dd className="font-medium">{payment.bookingDate}</dd>
              </div>
            ) : (
              <>
                <div>
                  <dt className="text-sm text-muted-foreground">{t("paymentDetail.cadence")}</dt>
                  <dd className="font-medium">
                    {payment.cadence === "Monthly" ? t("cadence.monthly") : payment.cadence}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">{t("paymentDetail.nextExecutionDate")}</dt>
                  <dd className="font-medium">{payment.nextExecutionDate}</dd>
                </div>
              </>
            )}
          </dl>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/payments"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-card-border bg-muted px-5 py-2.5 text-base font-medium text-foreground"
            >
              {t("paymentDetail.backToPayments")}
            </Link>
          </div>
        </section>
      </main>
    </Container>
  );
}
