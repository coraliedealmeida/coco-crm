-- AlterTable: emoji personnalisé pour la marque
ALTER TABLE "Brand" ADD COLUMN "emoji" TEXT;

-- AlterTable: antidatage (signedAt) + suivi de l'acompte (dérivé des étapes, 30% modifiable)
ALTER TABLE "Project"
  ADD COLUMN "signedAt" TIMESTAMP(3),
  ADD COLUMN "depositAmount" DOUBLE PRECISION,
  ADD COLUMN "depositInvoicedAt" TIMESTAMP(3),
  ADD COLUMN "depositPaidAt" TIMESTAMP(3);
