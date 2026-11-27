-- RETOUR EN ARRIÈRE de la migration 20261127120000_corbeille_et_lien_devis.
-- ⚠️ Ne PAS lancer sans l'accord explicite de Coralie et une sauvegarde préalable.
--
-- Étape 1 (obligatoire avant tout) : vérifier que la corbeille est vide. Si ces requêtes
-- renvoient des lignes, les éléments à la corbeille RÉAPPARAÎTRAIENT dans l'outil après le
-- retour en arrière : les restaurer ou décider ensemble d'abord.
--   SELECT 'Brand' t, count(*) FROM "Brand" WHERE "deletedAt" IS NOT NULL
--   UNION ALL SELECT 'Client', count(*) FROM "Client" WHERE "deletedAt" IS NOT NULL
--   UNION ALL SELECT 'Project', count(*) FROM "Project" WHERE "deletedAt" IS NOT NULL
--   UNION ALL SELECT 'Invoice', count(*) FROM "Invoice" WHERE "deletedAt" IS NOT NULL
--   UNION ALL SELECT 'QuoteRequest', count(*) FROM "QuoteRequest" WHERE "deletedAt" IS NOT NULL
--   UNION ALL SELECT 'ProspectImport', count(*) FROM "ProspectImport" WHERE "deletedAt" IS NOT NULL;
--
-- Étape 2 : redéployer le code d'avant (branche main) AVANT de retirer les colonnes.
--
-- Étape 3 : retirer les colonnes ajoutées (elles ne contiennent que des dates de corbeille et
-- l'origine des projets créés après la migration ; aucune donnée d'origine n'y est stockée).
ALTER TABLE "Project" DROP CONSTRAINT IF EXISTS "Project_quoteRequestId_fkey";
ALTER TABLE "Invoice" DROP COLUMN IF EXISTS "deletedAt";
ALTER TABLE "Project" DROP COLUMN IF EXISTS "quoteRequestId",
  DROP COLUMN IF EXISTS "deletedReason",
  DROP COLUMN IF EXISTS "deletedAt",
  DROP COLUMN IF EXISTS "createdFrom";
ALTER TABLE "QuoteRequest" DROP COLUMN IF EXISTS "deletedAt";
ALTER TABLE "Client" DROP COLUMN IF EXISTS "deletedReason", DROP COLUMN IF EXISTS "deletedAt";
ALTER TABLE "ProspectImport" DROP COLUMN IF EXISTS "deletedAt";
ALTER TABLE "Brand" DROP COLUMN IF EXISTS "deletedAt";
-- Étape 4 : retirer la ligne de cette migration de l'historique Prisma.
DELETE FROM "_prisma_migrations" WHERE "migration_name" = '20261127120000_corbeille_et_lien_devis';
