# Pizza Basilico — plateforme de commande en ligne

Implémentation du [cahier des spécifications](#) (voir l'artifact partagé séparément) :
commande en ligne, moteur intelligent de gestion des créneaux, tableau de bord
d'administration. Hébergement prévu sur VPS, sous-domaine `pizza.mehdi.website`.

## Stack

- **Next.js 16** (TypeScript, App Router) — site client + tableau de bord admin
- **PostgreSQL** auto-hébergé + **Prisma 7** (adaptateur `@prisma/adapter-pg`)
- **Stripe** derrière une couche d'abstraction (`src/lib/payments`) — prestataire swappable
- **Docker Compose** + **Caddy** (HTTPS automatique) pour le déploiement VPS

## État actuel — ce qui est fait, ce qui reste à faire

Le cœur transactionnel du système (le plus risqué, le moins tolérant à l'erreur)
est écrit et **vérifié sous concurrence réelle** — voir `scripts/verify-slots.ts`.
Le reste est une base fonctionnelle de bout en bout (menu → panier → paiement
→ file admin), pas encore la totalité des fonctionnalités du cahier des charges.

**Fait et testé :**
- Schéma de données complet (`prisma/schema.prisma`) reflétant le cahier des spécifications
- Moteur de créneaux : fenêtres fixes, double plafond (unités/commandes), réservation
  atomique par verrouillage de ligne, hold + libération automatique — `src/lib/slots.ts`
- Menu réel chargé (`prisma/seed.ts`) : 28 articles, suppléments universels, poids de
  préparation (Panuozzo=1, Plaque Pizza=3, boissons/desserts=0)
- Parcours de commande client (`/commander/[sessionId]`) : panier, suppléments,
  paiement Stripe (Payment Element)
- Création de commande (`/api/orders`) : revalidation serveur systématique des prix
  et disponibilités, réservation de créneau, création du paiement, **compensation
  automatique** (libération du créneau + annulation) si le paiement échoue
- Webhook Stripe (`/api/webhooks/stripe`) : confirmation/échec/remboursement
- Authentification personnel : mot de passe + **2FA obligatoire** (`src/lib/auth.ts`)
- Tableau de bord admin (`/admin`) : file de commandes groupée par créneau,
  changement de statut, remboursement exceptionnel manuel
- Journal d'audit des actions du personnel

**Pas encore construit** (le cahier des charges couvre plus que ce premier lot) :
- Interface admin pour créer/publier les sessions (aujourd'hui : script/console uniquement)
- Temps réel (WebSocket / Postgres LISTEN-NOTIFY) — la file admin se rafraîchit
  actuellement toutes les 5 secondes, pas en instantané ; alerte sonore non branchée
- PWA (installable, notifications push, résilience hors-ligne)
- Ruptures de stock en cascade côté interface (le modèle de données le supporte déjà :
  `Ingredient.isAvailable`, `MenuItemIngredient.isFixed`)
- Fidélité (carte à tampons), comptes clients sans mot de passe, codes promo côté UI
  (modèles de données prêts : `LoyaltyCard`, `MagicLinkToken`, `PromoCode`)
- E-mails transactionnels (confirmation, synthèses au propriétaire, newsletter)
- Intégration Instagram, page « Notre histoire », partage social
- Commande assistée par le personnel (tablette), QR code walk-up
- Allergènes (structure de données prête — `Ingredient.allergenTags` — en attente
  de la correspondance à fournir)
- Tests automatisés au-delà de `scripts/verify-slots.ts`

## Développement local

```bash
cp .env.example .env   # puis renseigner DATABASE_URL (postgres local), SESSION_SECRET, clés Stripe test

docker run -d --name pizza-basilico-db \
  -e POSTGRES_USER=pizza -e POSTGRES_PASSWORD=pizza -e POSTGRES_DB=pizza_basilico \
  -p 55432:5432 postgres:16-alpine

npm install
npx prisma migrate dev
npx tsx prisma/seed.ts                 # charge le menu réel
npx tsx scripts/create-staff.ts owner@example.com "MotDePasse123!" OWNER
npx tsx scripts/verify-slots.ts        # preuve de non-survente sous concurrence

npm run dev
```

Créer une session de test (aucune interface admin pour ça pour l'instant) :

```bash
npx tsx -e "
import 'dotenv/config';
import { prisma } from '@/lib/prisma';
import { generateTimeSlotsForSession } from '@/lib/slots';
(async () => {
  const loc = await prisma.location.create({ data: { label: 'Place de la Mairie', address: '...' } });
  const session = await prisma.serviceSession.create({ data: {
    locationId: loc.id,
    startAt: new Date(),
    endAt: new Date(Date.now() + 3*60*60000),
    windowMinutes: 10, unitsCapPerWindow: 6, ordersCapPerWindow: 4,
  }});
  await generateTimeSlotsForSession(session.id);
  console.log(session.id);
  await prisma.\$disconnect();
})();
"
```

## Déploiement sur le VPS (`pizza.mehdi.website`)

1. Pointer un enregistrement DNS `A` de `pizza.mehdi.website` vers l'IP du VPS.
2. Sur le VPS : cloner le dépôt, créer `.env` à partir de `.env.example`
   (générer `SESSION_SECRET` avec `openssl rand -base64 48`, renseigner les vraies
   clés Stripe, définir `POSTGRES_PASSWORD`).
3. `docker compose up -d --build` — Caddy obtient et renouvelle automatiquement
   le certificat HTTPS pour le sous-domaine ; les migrations s'appliquent au démarrage
   du conteneur `app` (voir `docker-entrypoint.sh`).
4. Charger le menu et créer le premier compte : `docker compose exec app npx tsx prisma/seed.ts`
   puis `docker compose exec app npx tsx scripts/create-staff.ts ...`.
5. Configurer le endpoint webhook Stripe vers `https://pizza.mehdi.website/api/webhooks/stripe`.

## Structure

```
prisma/schema.prisma       Schéma de données complet
prisma/seed.ts             Menu réel Pizza Basilico
src/lib/slots.ts           Moteur de créneaux (cœur du système)
src/lib/cart.ts            Calcul et revalidation serveur du panier
src/lib/payments/          Abstraction de paiement (Stripe = adaptateur actif)
src/lib/auth.ts            Mot de passe + 2FA (personnel), lien magique (clients)
src/app/commander/         Parcours de commande client
src/app/admin/             Tableau de bord (file de commandes)
scripts/verify-slots.ts    Preuve de non-survente sous concurrence réelle
scripts/create-staff.ts    Création manuelle d'un compte personnel + 2FA
```
