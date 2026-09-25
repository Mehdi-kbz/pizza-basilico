import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendApplicationConfirmationEmail } from "@/lib/email";
import { MAX_CV_BYTES, detectCvType, safeFileName } from "@/lib/recruitment";

/**
 * Candidature spontanée (page « Rejoignez-nous »). Le CV est vérifié sur sa
 * signature réelle, plafonné à 5 Mo, puis stocké en base.
 */

const fieldsSchema = z.object({
  name: z.string().trim().min(2, "Indiquez votre nom.").max(80),
  phone: z
    .string()
    .trim()
    .regex(/^[+()\d][\d\s().-]{6,20}$/, "Numéro de téléphone invalide."),
  email: z.string().trim().email("Adresse e-mail invalide.").max(120),
  message: z.string().trim().max(600).optional(),
});

// Limite simple par adresse IP (en mémoire, suffisante pour un seul conteneur) : 10 tentatives / heure.
const hits = new Map<string, number[]>();
function rateLimited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 60 * 60 * 1000);
  if (recent.length >= 10) {
    hits.set(ip, recent);
    return true;
  }
  hits.set(ip, [...recent, now]);
  return false;
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (rateLimited(ip)) {
    return NextResponse.json({ error: "Trop de candidatures depuis cette connexion. Réessayez plus tard." }, { status: 429 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  // Champ piège invisible : seuls les robots le remplissent. On répond « ok » sans rien enregistrer.
  if (String(form.get("website") ?? "").length > 0) return NextResponse.json({ ok: true });

  const parsed = fieldsSchema.safeParse({
    name: form.get("name"),
    phone: form.get("phone"),
    email: form.get("email"),
    message: (form.get("message") as string | null) || undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Formulaire invalide." }, { status: 400 });
  }

  const file = form.get("cv");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Joignez votre CV." }, { status: 400 });
  }
  if (file.size > MAX_CV_BYTES) {
    return NextResponse.json({ error: "Votre CV dépasse 5 Mo." }, { status: 413 });
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = detectCvType(bytes);
  if (!type) {
    return NextResponse.json({ error: "Format non accepté : envoyez un PDF, DOC ou DOCX." }, { status: 415 });
  }

  const { name, phone, email, message } = parsed.data;
  await prisma.jobApplication.create({
    data: {
      name,
      phone,
      email,
      message: message || null,
      cvFileName: safeFileName(file.name, type.ext),
      cvMime: type.mime,
      cvSize: bytes.byteLength,
      cvData: bytes,
    },
  });

  await sendApplicationConfirmationEmail(email, name).catch((e) => console.error("Échec de l'accusé de candidature :", e));

  return NextResponse.json({ ok: true });
}
