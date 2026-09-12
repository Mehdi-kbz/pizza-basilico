import { cookies } from "next/headers";
import { verifyCustomerSession, type CustomerSessionPayload } from "@/lib/auth";

/** À utiliser dans les pages/routes de l'espace « Mon compte » client (§3.1, §8). */
export async function getCustomerSession(): Promise<CustomerSessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("customer_session")?.value;
  if (!token) return null;
  return verifyCustomerSession(token);
}
