import { NextResponse } from "next/server";
import { z } from "zod";
import { readAccountToken, setPassword, passwordProblem, customerSessionCookie } from "@/lib/customer-auth";

const schema = z.object({ token: z.string().min(10), password: z.string() });

/** Choisir un nouveau mot de passe via le lien reçu par e-mail : prouve aussi la propriété de l'adresse → e-mail confirmé et connexion. */
export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Requête invalide." }, { status: 400 });

  const problem = passwordProblem(parsed.data.password);
  if (problem) return NextResponse.json({ error: problem }, { status: 400 });

  const customer = await readAccountToken(parsed.data.token, "reset");
  if (!customer) return NextResponse.json({ error: "Ce lien a expiré ou a déjà servi. Demandez-en un nouveau." }, { status: 410 });

  const updated = await setPassword(customer.id, parsed.data.password, true);
  const c = customerSessionCookie(updated);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(c.name, c.value, c.options);
  return res;
}
