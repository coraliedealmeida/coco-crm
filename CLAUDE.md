# COCO — dashboard de Coralie (CLAUDE.md)

Outil interne de Coralie de Almeida, graphiste / DA freelance spécialisée dans le secteur animalier :
CRM de prospection, suivi clients et projets, facturation. Utilisatrice unique, **novice en code** :
toujours expliquer en français simple, donner les commandes exactes, détailler quoi tester.

## Stack
- Next.js 14 (App Router) + React 18 + Tailwind 3 · Prisma 5 + Postgres Neon (région us-east-1)
- Déployé sur Vercel (branche `main` = production) · Emails : Resend · Crons Vercel (`vercel.json`)
- Abby reste l'outil de devis, factures et comptabilité. COCO est la source de vérité du **temps**.

## Structure
- `app/(dashboard)/` pages : `/` Dashboard, `/pipeline`, `/marques` (+ `/new`, `/import`, `/[id]`, `/[id]/notes`),
  `/clients` (= page **Projets**, Kanban), `/clients/liste`, `/clients/annee` (vue annuelle), `/clients/new`,
  `/clients/[id]/projects/[projectId]` (fiche projet), `/ressources` (offres + messages types), `/parametres`.
- `app/api/` routes API (une par ressource) · `app/api/cron/` : `relances` (email 7h UTC), `backup` (8h UTC),
  `activate-prospects` (6h UTC), protégées par `CRON_SECRET`.
- `components/` composants React · `lib/` règles métier · `prisma/schema.prisma` + `prisma/migrations/` (SQL manuel).
- Authentification : mot de passe unique (`APP_PASSWORD`) + cookie signé (`lib/auth.ts`, `middleware.ts`).

## Modèle de données (résumé)
- `Brand` = prospect (statut `PipelineStatus`, parcours `acquisitionPath` ROUTINE / CONTACT / DIRECT).
- `Client` (1-1 avec Brand) créé au passage « Devis accepté » → `Project` (type `ServiceType`, étape `currentStep`
  en texte, étapes perso `steps`) → `Invoice` (libre : acompte, solde…, `sentAt`, `paidAt`), `ProjectNote`, `Reminder`.
- `QuoteRequest` : nouvelle demande de devis d'un client existant. `ProspectImport` : prospects importés
  (LinkedIn/Instagram), invisibles jusqu'à leur date programmée. `Settings` : singleton des délais.

## Règles de calcul (à respecter)
- **CA encaissé** = somme des `Invoice.amount` avec `paidAt` (par date de paiement). Exclut volontairement
  l'affiliation Swan / Truffe & Moustache (écart connu, pas un bug).
- **Montant d'un projet** (vue annuelle) = total de ses factures, sinon montant du devis.
- **Revenu potentiel en cours** (Pipeline) = `potentialRevenue` des marques + demandes de devis en
  « À relancer » ou « En discussion ».
- **Relances** : jours **ouvrés** (`lib/business-days.ts`), délais réglables dans Paramètres ;
  `computeNextActionDate` (`lib/statusEffects.ts`).
- **Routine d'engagement** : 3 marques max/jour, espacement `daysBetweenEngagements`, « Prise de contact »
  quand jours écoulés ≥ seuil ET nombre de passages suffisant. Activation des prospects en pause si une
  marque a ≥ 7 jours ouvrés de retard.
- **Projet actif** = étape hors Offboarding (Facture à faire / envoyée / Attente avis / Terminé).
- Montants **HT uniquement**, pas de TVA (non assujettie).

## Charte graphique
- Police **Bricolage Grotesque** : ExtraBold (titres), Semi Bold et Light (textes).
- Blanc `#FFFFFF` · noir `#1D1C1F` · violet `#8B5CF6` · violet clair `#C4B5FD` · fond doux `#F4F2FF`
  · lime `#CCFF00` réservé aux accents et boutons principaux, **jamais en texte sur fond clair**.
- Interface en français, desktop en priorité.

## Règles de travail (obligatoires)
- Une branche Git par phase, jamais de travail direct sur `main`. Fusion vers `main` uniquement après
  accord écrit de Coralie en fin de phase. Push de branche autorisé (génère la prévisualisation Vercel).
- Après chaque modification : `npx tsc --noEmit` puis `npm run build` ; vérifier visuellement dans le
  navigateur toute modification d'interface.
- Base de données : sauvegarde (export + tag Git) avant toute migration ; **jamais** de `db push --force-reset`,
  `DROP`, ni suppression de données ; migrations SQL manuelles dans `prisma/migrations/` avec plan de retour
  en arrière ; migrations testées sur une base de test (branche Neon) ; production seulement après accord.
- Accord explicite obligatoire avant : suppression de données/fichiers/branches, modification des variables
  d'environnement Vercel, changement de domaine, force push.
- Ne jamais demander de mot de passe ni de clé : donner la commande ou la page, Coralie se connecte elle-même.
- Aucun secret dans le dépôt. Les exports LinkedIn/Instagram du dossier sont ignorés par Git : ne pas les toucher.
- Fin de phase : résumé simple, procédure de test précise, commit, mise à jour de ce fichier, attendre l'accord.

## Décisions prises
- 2026-11-27 — Audit Phase 0 réalisé : voir `docs/audit-phase-0.md` (constats classés par priorité).
- Aucune migration n'est lancée au déploiement (`npm run build` = `prisma generate && next build`) :
  à conserver. Migrations via `npm run migrate` uniquement, manuellement.

## Plan des phases
| Phase | Contenu | État |
|---|---|---|
| 0 | Audit, CLAUDE.md | ✅ terminé — en attente de validation |
| 0 bis | Corrections prioritaires (sauvegarde, sécurité, enregistrements, dates/fériés, doublons, archivage) | ⏳ à valider |
| 1 | Système de design (fondations, composants, guide de style, application à toutes les pages) | à faire |
| 2 | Suivi du temps, feuille de mois (clients à l'heure), changement de type de projet | à faire |
| 3 | Dashboard « quoi faire aujourd'hui », vue annuelle heures/CA, rappel fin de mois, saisie rapide | à faire |

Hors périmètre (garder l'architecture prête) : temps sur les forfaits (taux horaire effectif),
brouillons de factures via l'API Abby, version mobile.
