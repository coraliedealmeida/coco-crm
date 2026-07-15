-- CreateEnum
CREATE TYPE "ProjectPaymentStatus" AS ENUM ('EN_ATTENTE_ACOMPTE', 'ACOMPTE_RECU', 'A_FACTURER', 'FACTURE_ENVOYEE', 'PAYE');

-- AlterTable
ALTER TABLE "Project"
  ALTER COLUMN "currentStep" SET NOT NULL,
  ADD COLUMN     "revisionCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN     "startDate" TIMESTAMP(3),
  ADD COLUMN     "estimatedDeliveryDate" TIMESTAMP(3),
  ADD COLUMN     "quoteAmount" DOUBLE PRECISION,
  ADD COLUMN     "paymentStatus" "ProjectPaymentStatus" NOT NULL DEFAULT 'EN_ATTENTE_ACOMPTE',
  ADD COLUMN     "notes" TEXT;
