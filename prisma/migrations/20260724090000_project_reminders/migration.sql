-- AlterTable: un rappel peut desormais etre rattache a un projet plutot qu'a une marque
-- (brandId devient optionnel, nouvelle colonne projectId optionnelle).
ALTER TABLE "Reminder" ALTER COLUMN "brandId" DROP NOT NULL;
ALTER TABLE "Reminder" ADD COLUMN "projectId" TEXT;

-- AddForeignKey
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
