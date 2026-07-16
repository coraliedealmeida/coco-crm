-- DataFix: les anciennes étapes "Appel découverte / Devis envoyé / Acompte reçu / Confirmé"
-- sont désormais tracées côté Pipeline prospection avant même la création du Project ;
-- on remet les projets existants sur la nouvelle première étape commune.
UPDATE "Project" SET "currentStep" = 'Devis signé'
WHERE "currentStep" IN ('Appel découverte', 'Devis envoyé', 'Acompte reçu', 'Confirmé');

-- AlterTable: statut de paiement fusionné dans currentStep (un seul statut par projet, comme le Pipeline)
ALTER TABLE "Project" DROP COLUMN "paymentStatus";
DROP TYPE "ProjectPaymentStatus";

ALTER TABLE "Project"
  ADD COLUMN     "invoicedAt" TIMESTAMP(3),
  ADD COLUMN     "paidAt" TIMESTAMP(3);

-- AlterTable: délais de relance facture, paramétrables comme les relances devis existantes
ALTER TABLE "Settings"
  ADD COLUMN     "daysBeforeFactureRelance1" INTEGER NOT NULL DEFAULT 15,
  ADD COLUMN     "daysBeforeFactureRelance2" INTEGER NOT NULL DEFAULT 15;
