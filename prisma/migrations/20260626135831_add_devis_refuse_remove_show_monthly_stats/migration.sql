-- AlterEnum
ALTER TYPE "PipelineStatus" ADD VALUE 'DEVIS_REFUSE';

-- AlterTable
ALTER TABLE "Settings" DROP COLUMN "showMonthlyStats";
