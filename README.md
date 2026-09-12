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
- Page de suivi de commande client (`/suivi/[id]`, lien non devinable) + recherche
  « suivre ma commande » (e-mail + numéro) sans besoin de rouvrir l'e-mail
- Interface admin de création/ouverture-fermeture des sessions (`/admin/sessions`)
- Interface admin de rupture de stock en cascade (`/admin/menu`) — désactiver un
  ingrédient masque automatiquement (et réversiblement) toute pizza qui en dépend,
  **vérifié bout en bout**
- Fidélité — carte à tampons, rédemption active par le client, expiration 90 jours
  (`src/lib/loyalty.ts`), **vérifiée bout en bout** (gain, rédemption, remise
  exacte, recrédit après rédemption)
- Commande assistée par le personnel (`/admin/commande`) — paiement marqué
  "en personne", dépassement manuel du créneau possible (§6.4), fidélité créditée
  immédiatement (pas de webhook pour ce canal)
- Newsletter (`/api/newsletter`) — consentement 3 ans (CNIL, §12.2)
- Abstraction e-mail (`src/lib/email/`) — Resend si `EMAIL_API_KEY` est renseigné,
  sinon un adaptateur silencieux (log uniquement, ne fait jamais échouer une commande) ;
  reçu de commande envoyé au paiement confirmé, synthèses au propriétaire
- Page de statistiques admin (`/admin/stats`) — jour/semaine, en plus des e-mails
- Tâches planifiées (`src/instrumentation.ts`, cron in-process) : libération des
  holds de paiement expirés (chaque minute), synthèse quotidienne (22h) et
  hebdomadaire (dimanche 22h05)

**Pas encore construit** :
- Temps réel (WebSocket / Postgres LISTEN-NOTIFY) — la file admin se rafraîchit
  toutes les 5 secondes, pas en instantané ; alerte sonore non branchée
- PWA (installable, notifications push, résilience hors-ligne) — en attente
  des fichiers de marque pour les icônes
- Comptes clients sans mot de passe côté UI (modèle `MagicLinkToken` prêt,
  pas encore de parcours de connexion client)
- Codes promo côté interface admin (modèle `PromoCode` prêt, pas de formulaire
  de création — actuellement en base uniquement)
- Intégration Instagram, page « Notre histoire », partage social
- QR code walk-up (pas de code à générer, c'est le même parcours client — juste
  imprimer un QR pointant vers le domaine)
- Allergènes (structure prête — `Ingredient.allergenTags` — en attente de la
  correspondance à fournir)
- Envoi réel d'e-mails (EMAIL_API_KEY à renseigner), vrais paiements (clés Stripe)
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

## Déploiement — déjà en ligne sur pizza.mehdi.website

Ce VPS héberge aussi jobsniper, travelapp et pz.mehdi.website derrière un Caddy
partagé (`/home/ubuntu/jobsniper/Caddyfile`, conteneur `jobsniper_caddy`) qui
possède seul les ports 80/443. Ce projet ne lance donc **pas** son propre
Caddy : `docker-compose.yml` publie uniquement `app` sur le port hôte `3003`,
et un bloc a été ajouté au Caddyfile partagé :

```
pizza.mehdi.website {
    reverse_proxy 172.17.0.1:3003
    encode gzip
    header { ... }
}
```

**Piège rencontré, à retenir pour la prochaine modification** : éditer le
Caddyfile sur l'hôte puis faire `caddy reload` a chargé l'ancienne version —
le bind-mount d'un *fichier unique* (pas un dossier) reste accroché à l'ancien
inode si le fichier est remplacé plutôt que modifié en place. Correctif :
réécrire le contenu à travers le point de montage déjà ouvert avant de recharger :

```bash
docker exec -i jobsniper_caddy sh -c 'cat > /etc/caddy/Caddyfile' < /home/ubuntu/jobsniper/Caddyfile
docker exec jobsniper_caddy caddy validate --config /etc/caddy/Caddyfile
docker exec jobsniper_caddy caddy reload --config /etc/caddy/Caddyfile
```

Pour redéployer une mise à jour du code :

```bash
cd /home/ubuntu/pizza-basilico
docker compose up -d --build   # rebuild + migrations automatiques (docker-entrypoint.sh)
```

Reste à faire avant que les paiements réels fonctionnent : renseigner de vraies
clés Stripe dans `.env` (actuellement des valeurs à compléter), puis configurer
le endpoint webhook Stripe vers `https://pizza.mehdi.website/api/webhooks/stripe`
et relancer `docker compose up -d`.

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
