-- AlterTable: retrait du modèle acompte/solde figé sur Project (remplacé par de vraies factures)
ALTER TABLE "Project"
  DROP COLUMN "depositAmount",
  DROP COLUMN "depositInvoicedAt",
  DROP COLUMN "depositPaidAt",
  DROP COLUMN "invoicedAt",
  DROP COLUMN "paidAt";

-- AlterTable: Invoice devient une vraie facture libre (nombre et montants au choix, aucune
-- date pré-remplie), avec suppression en cascade si le projet est supprimé.
ALTER TABLE "Invoice" DROP CONSTRAINT "Invoice_projectId_fkey";
ALTER TABLE "Invoice" DROP COLUMN "status";
ALTER TABLE "Invoice" ADD COLUMN "label" TEXT NOT NULL DEFAULT 'Facture';
ALTER TABLE "Invoice" ALTER COLUMN "label" DROP DEFAULT;
ALTER TABLE "Invoice" ALTER COLUMN "amount" SET NOT NULL;
ALTER TABLE "Invoice" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
