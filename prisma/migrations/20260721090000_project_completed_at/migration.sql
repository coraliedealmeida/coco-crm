-- AlterTable: date de complétion posée automatiquement au passage a "Termine"
ALTER TABLE "Project" ADD COLUMN "completedAt" TIMESTAMP(3);
