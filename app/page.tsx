import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";

export default async function Page() {
  const authenticated = await isAuthenticated();
  redirect(authenticated ? "/home" : "/login");
}
