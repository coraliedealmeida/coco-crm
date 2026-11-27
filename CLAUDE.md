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
- **Dates** : une date « jour » = un jour du calendrier **à Paris** (`lib/dates.ts`, source unique) ;
  « dû aujourd'hui » = jusqu'à 23h59 à Paris (`parisEndOfToday`). Affichage via `formatDateFr`.
- **Relances** : jours **ouvrés** = lundi-vendredi hors jours fériés français calculés pour toute année
  (`lib/dates.ts`, `lib/business-days.ts`), délais réglables dans Paramètres ;
  `computeNextActionDate` (`lib/statusEffects.ts`).
- **Sauvegarde** : toutes les tables listées dans `lib/backup.ts` (un test échoue si une table manque) ;
  restauration : `docs/restauration-sauvegarde.md`.
- **Appels API depuis l'interface** : toujours `apiFetch` (`lib/apiClient.ts`), jamais `fetch` direct.
  Chaque route API commence par `requireSession()` (`lib/apiAuth.ts`). Tests : `npm test`.
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
  `migrate dev`, `migrate reset`, `DROP`, ni suppression de données ; migrations SQL manuelles dans
  `prisma/migrations/` avec plan de retour en arrière.
- **Deux bases** : la base de **test** (branche Neon) sert aux prévisualisations Vercel (périmètre Preview)
  ET au développement local (`.env`). La base de **production** ne sert qu'au périmètre Production.
  Toute migration est d'abord testée sur la base de test ; migration de la production **uniquement** après
  accord explicite de Coralie et sauvegarde préalable.
- Toute mise à jour en masse de données existantes (renommage d'étapes, conversion de projets…) :
  sauvegarde avant, liste des éléments concernés montrée à Coralie avant d'appliquer.
- Accord explicite obligatoire avant : suppression de données/fichiers/branches, modification des variables
  d'environnement Vercel, changement de domaine, force push. Avant de modifier une variable Vercel : montrer
  la variable exacte et son périmètre ; après : montrer que la variable de Production n'a pas changé.
- Ne jamais demander de mot de passe ni de clé : donner la commande ou la page, Coralie se connecte elle-même.
- Aucun secret dans le dépôt. Les exports LinkedIn/Instagram du dossier sont ignorés par Git : ne pas les toucher.
- Fin de phase : résumé simple, procédure de test précise, commit, mise à jour de ce fichier, attendre l'accord.

## Décisions prises
- 2026-11-27 — Audit Phase 0 réalisé : voir `docs/audit-phase-0.md` (constats classés par priorité).
- Aucune migration n'est lancée au déploiement (`npm run build` = `prisma generate && next build`) :
  à conserver. Migrations via `npm run migrate` uniquement, manuellement.
- 2026-11-27 — Réponses de Coralie à l'audit (recos validées) :
  - **Réseau** : depuis ce Mac (réseau actuel), le port 5432 est bloqué pour tous les serveurs, même hors
    bac à sable ; le port 443 passe. À retester via le partage de connexion du téléphone.
  - **Neon / Vercel** (constaté le 27/11/2026) : projet Neon `coco-crm-db` (Free, rétention d'historique 6 h),
    géré via l'intégration Vercel (Storage). Branche `main` = production. Branche `main_old_2026-07-23…` =
    ancienne copie, ne pas toucher. **Sauvegarde créée : branche `sauvegarde-2026-11-27-avant-phase-0bis`**
    (copie de `main`, n'expire jamais).
  - **27/11/2026 — prévisualisations isolées** (accord de Coralie) : Vercel → Storage → coco-crm-db → Projects
    → coco → « Create Database Branch For Deployment » : **Preview coché**, Production décoché. Chaque
    prévisualisation reçoit sa propre branche Neon `preview/<branche-git>` (copie des données de `main`).
    Vérifié : les 24 variables Production et Preview sont inchangées (mêmes dates de modification) ; la
    prévisualisation de `phase-0-audit` a bien créé `preview/phase-0-audit`.
    Attention : `DIRECT_URL` (ajoutée à la main) pointe toujours sur la production pour toutes les
    prévisualisations → à remplacer par `DATABASE_URL_UNPOOLED` dans `schema.prisma` (Phase 0 bis).
    Plan Free = nombre de branches limité : supprimer les branches `preview/*` des branches fusionnées
    (bouton « Clean up branches » de Neon, avec accord).
  - Le `.env` local pointe encore sur la production (et le port 5432 est bloqué sur ce réseau) : créer une
    branche Neon de développement avant tout travail local sur la base.
    Vercel CLI : `npx vercel@67.0.0` (dossier relié au projet `coco`).
  - **Next.js** : aucune version 14.x corrigée (14.2.35 = dernière). Cible : **15.5.29** (corrige toutes les
    failles listées), sur une branche dédiée, testée avec la base de test. Next 15 impose React 19.
  - **Phase 0 bis** : ordre validé (1 → 6 → 3 → 4+5 → 7 → 2 → 8-9), plus : dates « jour » en heure de Paris,
    fériés français calculés pour toute année et appliqués aussi aux relances, vérification des montants déjà
    enregistrés (risque de montants tronqués), tests automatiques des calculs (temps, arrondi, montants,
    jours ouvrés, fériés). **Ne démarre qu'après confirmation par Coralie que la sauvegarde Neon existe.**
  - **Phase 1** : écran témoin = fiche projet (+ Dashboard) ; icônes fines à la place des émojis de titres
    (émojis de marque conservés) ; mobile : garder fonctionnel sans l'améliorer.
  - **Phase 2** :
    - Étapes : ajouter « Solde reçu », renommer « Attente avis » → « Demande d'avis » pour tous les types
      (sauvegarde + liste des projets concernés validée avant).
    - Mode de facturation = réglage par défaut du client (heure / forfait), pas un verrou.
    - Anciennes fiches YLG converties en missions : masquées, jamais supprimées. Contrôle obligatoire :
      CA, vue annuelle et « À facturer » identiques avant/après, sans double comptage.
    - Mois marqué « facturé » → création d'une facture COCO (total, n° Abby) ; le modèle `Invoice` doit
      pouvoir couvrir un mois entier (sans projet unique).
    - Temps enregistré **à la minute** ; arrondi de facturation réglable dans Paramètres, par défaut au
      **quart d'heure le plus proche**, appliqué à la durée **totale de la mission** (pas à chaque entrée).
      Afficher durée réelle ET durée facturée, en heures et minutes.
    - Une seule liste de catégories (missions + temps). Le temps d'une mission compte dans le mois de livraison.
    - Clients à l'heure : **YLG** et **QVLM**, 65 €/h (référence interne 80 €/h par défaut).
    - Nouveaux montants en **centimes**, durées en **minutes** (colonnes existantes inchangées).
    - Avant la Phase 2, Coralie fournit sa nouvelle architecture d'offres (types de projet + grille tarifaire).
  - **Phase 3** : rappel de fin de mois le dernier jour ouvré (Dashboard + email) ; emails envoyés depuis une
    adresse du domaine de Coralie au lieu de `onboarding@resend.dev` (vérification du domaine dans Resend).

## Plan des phases
| Phase | Contenu | État |
|---|---|---|
| 0 | Audit, CLAUDE.md | ✅ validé le 27/11/2026 |
| infra | Outil Vercel ✅, sauvegarde Neon ✅, prévisualisations isolées ✅, base de dev locale (à faire) | ⏳ en cours |
| 0 bis | Partie 1 ✅ (branche `phase-0bis-corrections`) : sauvegarde complète + restauration, sécurité connexion/API/cron, enregistrements fiables, dates Paris + fériés, anti-doublons, tests. Reste : archivage (migration), centralisation des étapes, vérification des montants, Next 15 (branche dédiée) | ⏳ en cours |
| 1 | Système de design (fondations, composants, guide de style, application à toutes les pages) | à faire |
| 2 | Suivi du temps, feuille de mois (clients à l'heure), changement de type de projet | à faire |
| 3 | Dashboard « quoi faire aujourd'hui », vue annuelle heures/CA, rappel fin de mois, saisie rapide | à faire |

Hors périmètre (garder l'architecture prête) : temps sur les forfaits (taux horaire effectif),
brouillons de factures via l'API Abby, version mobile.
