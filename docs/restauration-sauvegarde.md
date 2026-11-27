# Restaurer COCO à partir d'une sauvegarde

Il existe deux filets de sécurité, du plus simple au plus long.

## 1. Branche de sauvegarde Neon (le plus simple)

Neon garde des copies complètes de la base appelées « branches ».
Exemple : `sauvegarde-2026-11-27-avant-phase-0bis`.

- Neon → projet `coco-crm-db` → **Branches** → choisir la branche de sauvegarde.
- Pour revenir en arrière, sur la branche `main` : bouton **Restore** → « From another branch ».
  Choisir la branche de sauvegarde. Neon garde automatiquement une copie de l'état d'avant
  (branche `main_old_…`), donc rien n'est perdu.
- ⚠️ Toutes les modifications faites depuis la sauvegarde sont alors remplacées.
  À faire uniquement avec Claude, après avoir vérifié ce qui serait perdu.

Neon garde aussi **6 heures d'historique** (offre gratuite) : on peut revenir à n'importe quel
moment des 6 dernières heures (Restore → « From history »).

## 2. Fichier JSON reçu par email (si Neon n'est plus accessible)

Chaque matin vers 9h (8h UTC), l'email « Sauvegarde Dashboard COCO » contient un fichier
`sauvegarde-coco-AAAA-MM-JJ.json` avec **toutes** les tables (liste dans `lib/backup.ts`).

Les fichiers reçus avant le 27/11/2026 ne contiennent pas les prospects importés, les contacts
d'intérêt, ni les tâches et la note du Dashboard.

### Vérifier un fichier (sans risque)
```
npx tsx scripts/restore-backup.ts ~/Downloads/sauvegarde-coco-2026-11-28.json
```
Affiche le nombre de lignes par table. Aucune base n'est touchée.

### Restaurer (avec Claude)
1. Créer une base **vide** : nouvelle branche Neon « schéma seulement », ou nouveau projet Neon.
2. Mettre son adresse dans `.env` (`DATABASE_URL` et `DATABASE_URL_UNPOOLED`), puis appliquer
   le schéma : `npm run migrate`.
3. Lancer :
   ```
   npx tsx scripts/restore-backup.ts ~/Downloads/sauvegarde-coco-AAAA-MM-JJ.json --restaurer
   ```
   Le script **refuse** d'écrire si la base contient déjà des marques, clients, projets ou factures.
4. Vérifier dans COCO : nombre de marques, de projets, CA encaissé.
5. Seulement ensuite, brancher cette base à la production (réglage Vercel, avec accord de Coralie).
