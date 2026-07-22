-- AlterEnum
ALTER TYPE "PipelineStatus" ADD VALUE 'PAS_MAINTENANT';

-- AlterTable
ALTER TABLE "Brand" ADD COLUMN "reconsiderDate" TIMESTAMP(3);
