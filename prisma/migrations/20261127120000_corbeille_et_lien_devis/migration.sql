-- Corbeille (rien n'est jamais effacé) + lien projet ↔ demande de devis.
-- Uniquement des AJOUTS de colonnes vides : aucune donnée existante n'est modifiée.
-- Retour en arrière : voir rollback.sql dans ce dossier (à lancer seulement avec l'accord de Coralie).

ALTER TABLE "Brand" ADD COLUMN "deletedAt" TIMESTAMP(3);

ALTER TABLE "ProspectImport" ADD COLUMN "deletedAt" TIMESTAMP(3);

ALTER TABLE "Client" ADD COLUMN "deletedAt" TIMESTAMP(3),
ADD COLUMN "deletedReason" TEXT;

ALTER TABLE "QuoteRequest" ADD COLUMN "deletedAt" TIMESTAMP(3);

ALTER TABLE "Project" ADD COLUMN "createdFrom" TEXT,
ADD COLUMN "deletedAt" TIMESTAMP(3),
ADD COLUMN "deletedReason" TEXT,
ADD COLUMN "quoteRequestId" TEXT;

ALTER TABLE "Invoice" ADD COLUMN "deletedAt" TIMESTAMP(3);

ALTER TABLE "Project" ADD CONSTRAINT "Project_quoteRequestId_fkey" FOREIGN KEY ("quoteRequestId") REFERENCES "QuoteRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
