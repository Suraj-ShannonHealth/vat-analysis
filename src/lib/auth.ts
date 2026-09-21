import { cookies } from "next/headers";

const ADMIN_SESSION_COOKIE = "vat_admin_session";
const SESSION_VALUE = "authenticated";

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get(ADMIN_SESSION_COOKIE);
  return session?.value === SESSION_VALUE;
}

export function getAdminCredentials() {
  return {
    username: process.env.ADMIN_USERNAME || "admin",
    password: process.env.ADMIN_PASSWORD || "admin123",
  };
}

export { ADMIN_SESSION_COOKIE, SESSION_VALUE };
