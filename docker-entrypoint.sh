#!/bin/sh
# Applique les migrations en attente à chaque démarrage du conteneur (idempotent),
# puis lance la commande passée en CMD.
set -e

echo "Application des migrations Prisma…"
npx prisma migrate deploy

exec "$@"
