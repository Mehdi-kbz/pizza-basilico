import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStaffSession } from "@/lib/require-staff";

/** Téléchargement du CV — réservé au personnel connecté. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const staff = await getStaffSession();
  if (!staff) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const { id } = await params;
  const app = await prisma.jobApplication.findUnique({
    where: { id },
    select: { cvData: true, cvMime: true, cvFileName: true, name: true },
  });
  if (!app) return NextResponse.json({ error: "Introuvable." }, { status: 404 });

  return new NextResponse(new Uint8Array(app.cvData), {
    headers: {
      "Content-Type": app.cvMime,
      "Content-Disposition": `attachment; filename="${app.cvFileName}"`,
      "Content-Length": String(app.cvData.byteLength),
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
