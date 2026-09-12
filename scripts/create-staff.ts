/**
 * Création manuelle d'un compte personnel (§10.1 — pas d'auto-inscription).
 * Génère aussi le secret 2FA, obligatoire dès la première connexion.
 *
 * Usage : npx tsx scripts/create-staff.ts <email> <mot-de-passe> <OWNER|STAFF>
 */
import "dotenv/config";
import { prisma } from "@/lib/prisma";
import { hashPassword, generateTotpSecret } from "@/lib/auth";

async function main() {
  const [email, password, role] = process.argv.slice(2);
  if (!email || !password || (role !== "OWNER" && role !== "STAFF")) {
    console.error("Usage : npx tsx scripts/create-staff.ts <email> <mot-de-passe> <OWNER|STAFF>");
    process.exit(1);
  }

  const passwordHash = await hashPassword(password);
  const { base32Secret, otpauthUrl } = generateTotpSecret(email);

  const staff = await prisma.staffUser.upsert({
    where: { email },
    update: { passwordHash, role, totpSecret: base32Secret, totpEnabled: true, isActive: true },
    create: { email, passwordHash, role, totpSecret: base32Secret, totpEnabled: true },
  });

  console.log(`\nCompte ${role} créé : ${staff.email}`);
  console.log(`\nÀ scanner dans une application d'authentification (Google Authenticator, 1Password, …) :`);
  console.log(otpauthUrl);
  console.log(`\nOu à saisir manuellement, secret : ${base32Secret}\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
