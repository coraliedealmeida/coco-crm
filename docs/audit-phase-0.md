# Audit de COCO — Phase 0 (27/11/2026)

Bilan de l'existant avant la refonte. Aucun code n'a été modifié pendant cet audit.
Vérifications faites : lecture de tout le code (≈ 11 500 lignes), compilation TypeScript ✅, lint ✅,
`npm audit` (failles connues des dépendances), historique Git (aucun secret trouvé ✅).

Légende : 🔴 à corriger avant la refonte · 🟠 dette qui gênerait la suite · 🟡 incohérences / nettoyage

---

## 🔴 Priorité 1 — risques sur les données, sécurité, bugs visibles

### 1. La sauvegarde quotidienne est incomplète
`app/api/cron/backup/route.ts` exporte marques, clients, projets, factures… mais **pas** :
les prospects importés (`ProspectImport`), les contacts d'intérêt (`BrandContact`),
les tâches et la note du Dashboard. En cas de perte de la base, ces données seraient perdues.
La procédure de restauration à partir du fichier n'a jamais été écrite ni testée.

### 2. Des suppressions définitives en un clic
- Supprimer un projet efface aussi **ses factures** → le CA encaissé baisse sans prévenir.
- Supprimer une fiche marque cliente efface client + projets + factures.
- Fusionner deux prospects importés supprime l'une des lignes.
Seule protection : une fenêtre `confirm()` du navigateur. Proposition : remplacer par un
**archivage** (la donnée reste en base, masquée, et peut être restaurée).

### 3. Des enregistrements peuvent échouer sans que tu le saches
Aucun écran ne vérifie la réponse du serveur : si l'enregistrement échoue (coupure réseau,
erreur), l'écran affiche quand même ta saisie, mais rien n'est enregistré.
En plus, le libellé et le montant des factures, le montant du devis et la grille tarifaire
envoient **une requête à chaque touche tapée** (et rechargent toute la page à chaque fois) :
c'est lent, et si les requêtes arrivent dans le désordre, « 1500 » peut être enregistré « 150 ».

### 4. Décalage d'un jour sur certaines dates
Le serveur (Vercel) raisonne en heure UTC, l'écran en heure de Paris. Les dates choisies avec le
calendrier (rappels, date de début d'engagement) sont enregistrées « minuit à Paris » = 23h la veille
en UTC. Conséquence probable : un rappel prévu aujourd'hui s'affiche « En retard » au lieu
d'« Aujourd'hui », et certains compteurs de jours ont un jour d'écart. Les autres dates (champs
date classiques) sont enregistrées différemment (minuit UTC) : deux règles coexistent.
« Aujourd'hui » et « début du mois » sont aussi calculés en UTC (bascule à 1h/2h du matin).
→ Une seule règle : toutes les dates « jour » en heure de Paris.

### 5. Jours fériés : seulement 2026, et pas partout
- `lib/prospectScheduling.ts` contient la liste des fériés **de 2026 uniquement** : dès janvier 2027,
  la programmation des prospects ne les exclura plus.
- `lib/business-days.ts` (relances, retards) dit exclure les fériés mais **ne les exclut pas**.
→ Calcul automatique des fériés français pour toutes les années, dans une seule fonction.

### 6. Sécurité
- **Next.js 14.2.35** : une faille *critique* connue, plus 4 autres dépendances vulnérables
  (postcss, nanoid, source-map-js, csv-parse). Mise à jour nécessaire (Next 15 : changement majeur
  à tester avec soin).
- La protection par mot de passe repose **uniquement** sur le middleware : si une faille de Next.js
  permet de le contourner, toutes les API (données, suppressions) sont ouvertes. → Double contrôle
  dans les routes API.
- Le jeton de session est **identique pour toutes les connexions et n'expire jamais côté serveur** :
  « Se déconnecter » ne fait qu'effacer le cookie du navigateur ; un cookie copié reste valable.
- Aucune limite de tentatives sur le mot de passe (attaque par essais répétés possible).
- Si la variable `CRON_SECRET` manquait, les routes automatiques accepteraient le mot « undefined ».
- ✅ Aucun secret dans le dépôt GitHub ni dans son historique (`.env` bien ignoré).

### 7. Projets en double possibles
Repasser une demande de devis à « Devis accepté » (après l'avoir changée par erreur) recrée les
projets à chaque fois (`app/api/quote-requests/[id]/route.ts`), sans garde-fou.

---

## 🟠 Priorité 2 — dette technique qui gênerait la refonte

8. **Étapes de projet en texte libre** : « Terminé », « Facture à faire »… sont écrits en dur
   ≈ 18 fois. Renommer une étape casserait des filtres. Bloquant pour la Phase 2 (changement de type,
   correspondance des étapes, synchronisation avec la feuille de mois) → centraliser.
9. **Logique dupliquée** : retard des factures calculé à deux endroits (Dashboard vs `lib/projects.ts`),
   cycle 1/3-2/3-3/3 codé deux fois, liste des statuts « à relancer » répétée 3 fois (Dashboard,
   email, Paramètres), filtre « hors clients directs » 3 fois, lecture des Paramètres 15 fois,
   deux fonctions « jours ouvrés » différentes.
10. **Aucun composant partagé** : boutons, champs, cartes copiés-collés avec leurs classes ; ≈ 60
    couleurs écrites en dur ; 16 fenêtres `alert()`/`confirm()` natives. (C'est l'objet de la Phase 1.)
11. **Montants en nombres décimaux** (`Float`) : risques d'arrondi. Pour la Phase 2, stocker les
    nouveaux montants en centimes et les durées en minutes (sans toucher aux colonnes existantes).
12. **Une facture doit appartenir à un projet** : impossible aujourd'hui de saisir la facture d'un
    mois entier (Phase 2) → adaptation du modèle nécessaire.
13. **Lenteurs à venir** : le Dashboard charge toutes les marques, tous les projets et toutes les
    factures à chaque affichage (11 requêtes). Acceptable aujourd'hui, à alléger quand les données
    grossiront. Le rechargement complet de la page après chaque petite modification ajoute de la latence.
14. **README obsolète** : il affirme que le déploiement lance les migrations — c'est faux (et c'est
    mieux ainsi : rien ne modifie la base automatiquement au déploiement).
15. **Aucun test automatique** : je propose d'en ajouter pour les calculs de temps et de montants.

---

## 🟡 Priorité 3 — incohérences et éléments inutilisés

16. Champs jamais utilisés : `ProspectImport.enriched*` (enrichissement abandonné, 8 champs),
    `Brand.messageUsed`. `Brand.contactName/contactRole` font doublon avec les « Contacts d'intérêt ».
    → On les laisse en base (aucune suppression), on les ignore dans l'interface.
17. Import de prospects : lit des fichiers présents **uniquement sur ton Mac** (le bouton ne peut pas
    marcher en ligne), date plancher « 10/08/2026 » et secteur « Animalier » écrits en dur.
18. Noms incohérents : le menu « Projets » mène à `/clients` ; « Maybe » (anglais) à côté de
    « Oui/Non » ; « Attente avis » (code) vs « Demande d'avis » (ton brief) ; commentaire de schéma
    « Squelette Phase 2 (inutilisé) » alors que tout est utilisé.
19. Emails envoyés depuis l'adresse de test de Resend (`onboarding@resend.dev`) : fragile, peut finir
    en spam ; la sauvegarde en pièce jointe grossira avec le temps.
20. Anciennes adresses `/messages`, `/offre`, `/clients/[id]` : simples redirections, à conserver.

---

## Environnement constaté

- ✅ GitHub CLI installée et connectée. ❌ Vercel CLI non installée. ❌ Neon CLI non installée.
- ❌ **Depuis ce Mac, la base Neon est injoignable** (port 5432 fermé sur le réseau actuel) :
  impossible pour l'instant de lire la base, de faire un export ou de lancer une migration en local.
- ❓ Non vérifiable sans accès Vercel : les prévisualisations utilisent-elles la base de production ?
  (Aucune migration n'est lancée au déploiement, donc pas de risque immédiat — mais une
  prévisualisation de test écrirait dans tes vraies données.)

## Corrections proposées avant la refonte (« Phase 0 bis »)

Dans l'ordre : 1 (sauvegarde complète) → 6 (sécurité + mise à jour Next.js) → 3 (enregistrements
fiables) → 4 + 5 (dates et fériés) → 7 (doublons) → 2 (archivage au lieu de suppression) → 8-9
(centraliser étapes et calculs). Les points 10 à 13 sont traités naturellement en Phases 1 et 2.
