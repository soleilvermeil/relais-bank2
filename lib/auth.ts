import { cookies } from "next/headers";

export const AUTH_COOKIE = "ebanking_auth";

export async function isAuthenticated() {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_COOKIE)?.value === "1";
}
