import { redirect } from "next/navigation";
import { accounts, creditCards } from "@/data/banking-mock";
import { Button } from "@/components/atoms/button";
import { Container } from "@/components/atoms/container";
import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";
import { PayBeneficiaryFields } from "@/components/molecules/pay-beneficiary-fields";
import { ProductSelect } from "@/components/molecules/product-select";
import { SectionTitle } from "@/components/atoms/section-title";
import { isAuthenticated } from "@/lib/auth";
import { getLocalizedAccountNameById } from "@/lib/i18n/account-names";
import { getServerT } from "@/lib/i18n/server";

type Props = {
  searchParams: Promise<{
    source?: string;
    paymentType?: string;
    beneficiaryIban?: string;
    beneficiaryBic?: string;
    reference?: string;
    recipientName?: string;
    amount?: string;
    executionDate?: string;
  }>;
};

const chfFormatter = new Intl.NumberFormat("de-CH", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

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
  const defaultRecipientName = params.recipientName ?? "";
  const defaultAmount = params.amount ?? "";
  const defaultExecutionDate = params.executionDate ?? "";
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

            <PayBeneficiaryFields
              defaultPaymentType={defaultPaymentType}
              defaultBeneficiaryIban={defaultBeneficiaryIban}
              defaultBeneficiaryBic={defaultBeneficiaryBic}
            />

            <div className="space-y-2">
              <Label htmlFor="reference">{t("payForm.reference")}</Label>
              <Input
                id="reference"
                name="reference"
                defaultValue={defaultReference}
                placeholder={t("payForm.referencePlaceholder")}
              />
              <p className="text-sm text-muted-foreground">
                {t("payForm.referenceExample")}
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="amount">{t("payForm.amount")}</Label>
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
              <div className="space-y-2">
                <Label htmlFor="executionDate">{t("common.executionDate")}</Label>
                <Input
                  id="executionDate"
                  name="executionDate"
                  type="date"
                  defaultValue={defaultExecutionDate}
                  required
                />
              </div>
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
