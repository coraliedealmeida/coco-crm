# COCO — CRM de Coralie

CRM de prospection, suivi clients/projets et facturation pour graphiste/DA spécialisée secteur animalier.
Stack : Next.js (App Router) + Prisma + Postgres Neon + Resend, déployé sur Vercel.
Règles de travail détaillées : voir `CLAUDE.md`.

## Démarrage local

1. Copier `.env.example` en `.env` et renseigner les variables (voir ci-dessous).
   En local, `DATABASE_URL` et `DIRECT_URL` doivent pointer vers la **base de test** (branche Neon), jamais la production.
2. `npm install`
3. `npm run migrate` — applique les migrations SQL de `prisma/migrations/` (sur la base de test).
4. `npm run seed` (base de test uniquement)
5. `npm run dev`

⚠️ Ne jamais lancer `prisma migrate dev`, `prisma db push --force-reset` ni `prisma migrate reset` :
ces commandes peuvent effacer les données.

## Variables d'environnement

- `DATABASE_URL` — URL Postgres Neon (connexion « pooler »)
- `DIRECT_URL` — URL Postgres Neon directe (utilisée par les migrations)
- `APP_PASSWORD` — mot de passe unique d'accès à l'app
- `SESSION_SECRET` — chaîne aléatoire longue (signature de session)
- `RESEND_API_KEY` — clé API Resend
- `NOTIFICATION_EMAIL` — adresse recevant les emails de relance
- `CRON_SECRET` — chaîne aléatoire longue (protège les routes automatiques `/api/cron/*`)

## Déploiement Vercel

1. Le dépôt GitHub est relié à Vercel : la branche `main` est la production, chaque autre branche
   poussée crée une prévisualisation.
2. Variables dans Vercel → Settings → Environment Variables :
   - périmètre **Production** : base de production ;
   - périmètre **Preview** : base de test (branche Neon).
3. Le déploiement **ne lance aucune migration** : `npm run build` = `prisma generate && next build`.
   Les migrations se lancent à la main avec `npm run migrate`, d'abord sur la base de test, puis sur la
   production seulement après sauvegarde et accord de Coralie.
4. Tâches automatiques (`vercel.json`) : `/api/cron/activate-prospects` (6h UTC), `/api/cron/relances`
   (7h UTC), `/api/cron/backup` (8h UTC).
