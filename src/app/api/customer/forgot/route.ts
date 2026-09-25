import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { resetUrlFor } from "@/lib/customer-auth";
import { sendPasswordResetEmail } from "@/lib/email";
import { tooManyAttempts, recordAttempt } from "@/lib/rate-limit";

const schema = z.object({ email: z.string().trim().email() });

/**
 * « Mot de passe oublié » / « activer mon compte » : envoie un lien valable 1 h.
 * Réponse identique que l'adresse soit connue ou non. Sert aussi aux clients qui ont
 * commandé sans mot de passe et veulent activer leur carte de fidélité.
 */
export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "E-mail invalide." }, { status: 400 });
  const email = parsed.data.email.toLowerCase();

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const keys = [`forgot:ip:${ip}`, `forgot:mail:${email}`];
  if (keys.some((k) => tooManyAttempts(k, k.includes(":ip:") ? 15 : 4, 60 * 60_000))) {
    return NextResponse.json({ ok: true }); // on ne révèle pas la limite non plus
  }
  keys.forEach(recordAttempt);

  const customer = await prisma.customer.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    include: { _count: { select: { orders: true } } },
  });
  let devLink: string | undefined;
  if (customer && (customer.passwordHash || customer._count.orders > 0)) {
    const url = resetUrlFor(customer);
    await sendPasswordResetEmail(customer.email, url).catch((e) => console.error("Échec d'envoi du lien de réinitialisation :", e));
    if (process.env.NODE_ENV !== "production") {
      console.log("[dev] lien de réinitialisation :", url);
      devLink = url;
    }
  }
  return NextResponse.json({ ok: true, ...(devLink ? { devLink } : {}) });
}
