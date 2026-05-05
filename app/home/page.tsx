import { redirect } from "next/navigation";
import { Badge } from "@/components/atoms/badge";
import { Container } from "@/components/atoms/container";
import { SectionTitle } from "@/components/atoms/section-title";
import { ListItemCard } from "@/components/molecules/list-item-card";
import { creditCards, getAccountsWithLiveBalances } from "@/data/banking-mock";
import { isAuthenticated } from "@/lib/auth";
import { getLocalizedAccountNameById } from "@/lib/i18n/account-names";
import { getServerT } from "@/lib/i18n/server";

export default async function HomePage() {
  if (!(await isAuthenticated())) {
    redirect("/login");
  }
  const { t } = await getServerT();
  const accounts = await getAccountsWithLiveBalances();

  return (
    <Container>
      <main id="main-content" className="space-y-8">
        <header className="space-y-2">
          <SectionTitle as="h1">{t("home.title")}</SectionTitle>
          <p className="text-sm text-muted-foreground">
            {t("home.subtitle")}
          </p>
        </header>

        <section className="rounded-2xl border border-card-border bg-card p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <SectionTitle>{t("home.myAccounts")}</SectionTitle>
            <Badge variant="accent">{t("home.accountsCount", { count: accounts.length })}</Badge>
          </div>
          <div className="space-y-4">
            {accounts.map((account) => (
              <ListItemCard
                key={account.id}
                href={`/home/accounts/${account.id}`}
                name={getLocalizedAccountNameById(account.id, t, account.name)}
                metaLabel={t("home.iban")}
                metaValue={account.iban ?? t("home.noIban")}
                amount={account.balance}
              />
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-card-border bg-card p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <SectionTitle>{t("home.myCards")}</SectionTitle>
            <Badge>{t("home.cardsCount", { count: creditCards.length })}</Badge>
          </div>
          <div className="space-y-4">
            {creditCards.map((card) => (
              <ListItemCard
                key={card.id}
                href={`/home/cards/${card.id}`}
                name={card.name}
                metaLabel={t("home.cardNumber")}
                metaValue={`XXXX XXXX XXXX ${card.last4}`}
                amount={card.amount}
              />
            ))}
          </div>
        </section>
      </main>
    </Container>
  );
}
