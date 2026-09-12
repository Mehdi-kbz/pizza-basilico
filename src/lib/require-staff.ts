import { cookies } from "next/headers";
import { verifyStaffSession, type StaffSessionPayload } from "@/lib/auth";

/** À utiliser dans les routes API et Server Components de l'espace admin. */
export async function getStaffSession(): Promise<StaffSessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("staff_session")?.value;
  if (!token) return null;
  return verifyStaffSession(token);
}
