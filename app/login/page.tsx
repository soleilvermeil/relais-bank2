import { redirect } from "next/navigation";
import { login } from "@/app/actions/auth";
import { Button } from "@/components/atoms/button";
import { Container } from "@/components/atoms/container";
import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";
import { SectionTitle } from "@/components/atoms/section-title";
import { isAuthenticated } from "@/lib/auth";

export default async function LoginPage() {
  if (await isAuthenticated()) {
    redirect("/home");
  }

  return (
    <Container>
      <main id="main-content" className="mx-auto w-full max-w-xl py-8 sm:py-12">
        <section className="rounded-2xl border border-card-border bg-card p-6 shadow-sm sm:p-8">
          <header className="space-y-2">
            <SectionTitle as="h1">E-Banking login</SectionTitle>
            <p className="text-sm text-muted-foreground">
              Training page: any identifier/password is accepted.
            </p>
          </header>
          <form action={login} className="mt-6 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="identifier">Identifier</Label>
              <Input
                id="identifier"
                name="identifier"
                type="text"
                autoComplete="username"
                placeholder="Client number or username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="Password"
              />
            </div>
            <Button type="submit" wide>
              Log in
            </Button>
          </form>
        </section>
      </main>
    </Container>
  );
}
