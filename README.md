# CRM Prospection — Phase 1

CRM de prospection pour graphiste/DA spécialisée secteur animalier. Stack : Next.js (App Router) + Prisma + Vercel Postgres (Neon) + Resend.

## Démarrage local

1. Copier `.env.example` en `.env` et renseigner les variables (voir ci-dessous).
2. `npm install`
3. `npx prisma migrate dev --name init`
4. `npm run seed`
5. `npm run dev`

## Variables d'environnement

- `DATABASE_URL` — URL Postgres (Neon / Vercel Postgres)
- `APP_PASSWORD` — mot de passe unique d'accès à l'app
- `SESSION_SECRET` — chaîne aléatoire longue (signature de session)
- `RESEND_API_KEY` — clé API Resend
- `NOTIFICATION_EMAIL` — adresse recevant les emails de relance (hello@coraliedealmeida.com)
- `CRON_SECRET` — chaîne aléatoire longue (protège l'endpoint cron)

## Déploiement Vercel

1. Importer le repo GitHub dans Vercel.
2. Ajouter une base Vercel Postgres (onglet Storage) et lier les variables auto-générées, ou renseigner `DATABASE_URL` manuellement.
3. Renseigner les autres variables d'environnement dans Settings → Environment Variables.
4. Déployer. Le script `build` exécute automatiquement `prisma migrate deploy`.
5. Le cron quotidien (`vercel.json`) appelle `/api/cron/relances` tous les jours à 7h UTC.
