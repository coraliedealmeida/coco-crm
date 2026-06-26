-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PipelineStatus" ADD VALUE 'RELANCE_DEVIS_1';
ALTER TYPE "PipelineStatus" ADD VALUE 'RELANCE_DEVIS_2';

-- AlterTable
ALTER TABLE "Settings" ADD COLUMN     "daysBeforeDevisRelance1" INTEGER NOT NULL DEFAULT 15,
ADD COLUMN     "daysBeforeDevisRelance2" INTEGER NOT NULL DEFAULT 15;
