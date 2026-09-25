/**
 * Création (ou réinitialisation) d'un compte personnel — pas d'auto-inscription (§10.1).
 * Connexion par e-mail + mot de passe ; la double authentification est optionnelle
 * (voir ADMIN_REQUIRE_2FA dans src/app/api/admin/login/route.ts).
 *
 * À lancer DANS le conteneur (la base n'est joignable que depuis le réseau Docker) :
 *   docker compose exec app npx tsx scripts/create-staff.ts <email> '<mot-de-passe>' <OWNER|STAFF>
 */
import "dotenv/config";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

async function main() {
  const [rawEmail, password, role] = process.argv.slice(2);
  if (!rawEmail || !password || (role !== "OWNER" && role !== "STAFF")) {
    console.error("Usage : npx tsx scripts/create-staff.ts <email> '<mot-de-passe>' <OWNER|STAFF>");
    process.exit(1);
  }
  if (password.length < 8) {
    console.error("Mot de passe trop court (8 caractères minimum).");
    process.exit(1);
  }

  const email = rawEmail.trim().toLowerCase();
  const passwordHash = await hashPassword(password);

  const existing = await prisma.staffUser.findFirst({ where: { email: { equals: email, mode: "insensitive" } } });
  const staff = existing
    ? await prisma.staffUser.update({ where: { id: existing.id }, data: { passwordHash, role, isActive: true } })
    : await prisma.staffUser.create({ data: { email, passwordHash, role } });

  console.log(`\nCompte ${role} ${existing ? "mis à jour" : "créé"} : ${staff.email}`);
  console.log("Connexion : e-mail + mot de passe sur /admin/login\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
