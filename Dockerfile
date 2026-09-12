# Image de production — Pizza Basilico
# Choix volontairement simple (pas de build "standalone" élagué) pour rester
# fiable et facile à déboguer sur un unique VPS, plutôt qu'optimisé pour un
# environnement serverless multi-instances.

FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache openssl

# ---- dépendances ----
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# ---- build ----
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# DATABASE_URL/SESSION_SECRET n'ont pas besoin d'être valides pour générer le
# client Prisma / builder Next.js — seules les vraies valeurs du conteneur
# d'exécution (fournies via .env) comptent à l'exécution.
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build"
ENV SESSION_SECRET="build-time-placeholder"
# Les variables NEXT_PUBLIC_* sont, elles, figées dans le bundle CLIENT au
# moment du build — contrairement aux autres, il ne suffit pas de les fournir
# au conteneur au démarrage : il faut les passer en --build-arg (voir
# docker-compose.yml, build.args) pour qu'elles soient les vraies valeurs.
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_VAPID_PUBLIC_KEY
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_VAPID_PUBLIC_KEY=$NEXT_PUBLIC_VAPID_PUBLIC_KEY
RUN npx prisma generate
RUN npm run build

# ---- exécution ----
FROM base AS runner
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma7.config.ts ./prisma7.config.ts
COPY --from=builder /app/src ./src
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["npm", "run", "start"]
