import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { readAccountToken, customerSessionCookie } from "@/lib/customer-auth";

const schema = z.object({ token: z.string().min(10) });

/** Confirmation de l'e-mail (bouton du reçu). Action explicite (POST) pour qu'un simple aperçu du lien par un logiciel de messagerie ne la déclenche pas. */
export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Requête invalide." }, { status: 400 });

  const customer = await readAccountToken(parsed.data.token, "verify");
  if (!customer) return NextResponse.json({ error: "Ce lien a expiré ou n'est plus valable. Utilisez « Mot de passe oublié »." }, { status: 410 });

  const updated = await prisma.customer.update({ where: { id: customer.id }, data: { emailVerifiedAt: customer.emailVerifiedAt ?? new Date(), hasAccount: true } });
  const c = customerSessionCookie(updated);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(c.name, c.value, c.options);
  return res;
}
