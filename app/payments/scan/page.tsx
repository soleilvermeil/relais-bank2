import { redirect } from "next/navigation";
import { Container } from "@/components/atoms/container";
import { SectionTitle } from "@/components/atoms/section-title";
import { accounts } from "@/data/banking-mock";
import { isAuthenticated } from "@/lib/auth";
import { getServerT } from "@/lib/i18n/server";
import { ScanPaymentClient } from "./scanner-client";

export default async function ScanPaymentPage() {
  if (!(await isAuthenticated())) {
    redirect("/login");
  }

  const { t } = await getServerT();
  const firstAccount = accounts.at(0);
  if (!firstAccount) {
    redirect("/payments/pay");
  }

  return (
    <Container>
      <main id="main-content" className="space-y-8">
        <header className="space-y-2">
          <SectionTitle as="h1">{t("scanPage.title")}</SectionTitle>
          <p className="text-sm text-muted-foreground">{t("scanPage.subtitle")}</p>
        </header>
        <ScanPaymentClient defaultSourceRef={`account:${firstAccount.id}`} />
      </main>
    </Container>
  );
}
