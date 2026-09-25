import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth";
import { customerSessionCookie } from "@/lib/customer-auth";
import { tooManyAttempts, recordAttempt, clearAttempts } from "@/lib/rate-limit";

const schema = z.object({ email: z.string().trim().email(), password: z.string().min(1).max(100) });

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  const { email, password } = parsed.data;

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const keys = [`clogin:ip:${ip}`, `clogin:mail:${email.toLowerCase()}`];
  if (keys.some((k) => tooManyAttempts(k, k.includes(":ip:") ? 20 : 8, 15 * 60_000))) {
    return NextResponse.json({ error: "Trop d'essais. Réessayez dans quelques minutes." }, { status: 429 });
  }

  const customer = await prisma.customer.findFirst({ where: { email: { equals: email, mode: "insensitive" } } });
  const ok = customer?.passwordHash ? await verifyPassword(password, customer.passwordHash) : false;
  if (!customer || !ok) {
    keys.forEach(recordAttempt);
    return NextResponse.json({ error: "E-mail ou mot de passe incorrect." }, { status: 401 });
  }
  if (!customer.emailVerifiedAt) {
    // Mot de passe juste mais e-mail pas encore confirmé : l'espace client contient l'historique, on ne l'ouvre pas.
    return NextResponse.json({ error: "Confirmez d'abord votre e-mail.", code: "NOT_VERIFIED" }, { status: 403 });
  }

  keys.forEach(clearAttempts);
  const c = customerSessionCookie(customer);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(c.name, c.value, c.options);
  return res;
}
