import { redirect } from "next/navigation";
import { login } from "@/app/actions/auth";
import { Button } from "@/components/atoms/button";
import { Container } from "@/components/atoms/container";
import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";
import { SectionTitle } from "@/components/atoms/section-title";
import { isAuthenticated } from "@/lib/auth";
import { getServerT } from "@/lib/i18n/server";

export default async function LoginPage() {
  if (await isAuthenticated()) {
    redirect("/home");
  }
  const { t } = await getServerT();

  return (
    <Container>
      <main id="main-content" className="mx-auto w-full max-w-xl py-8 sm:py-12">
        <section className="rounded-2xl border border-card-border bg-card p-6 shadow-sm sm:p-8">
          <header className="space-y-2">
            <SectionTitle as="h1">{t("login.title")}</SectionTitle>
            <p className="text-sm text-muted-foreground">
              {t("login.subtitle")}
            </p>
          </header>
          <form action={login} className="mt-6 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="identifier">{t("login.identifier")}</Label>
              <Input
                id="identifier"
                name="identifier"
                type="text"
                autoComplete="username"
                placeholder={t("login.identifierPlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("login.password")}</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder={t("login.password")}
              />
            </div>
            <Button type="submit" wide>
              {t("login.loginButton")}
            </Button>
          </form>
        </section>
      </main>
    </Container>
  );
}
