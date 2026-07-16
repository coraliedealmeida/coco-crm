-- AlterTable: statuts personnalisés par projet + retrait du compteur de révisions (les statuts suffisent)
ALTER TABLE "Project"
  ADD COLUMN     "steps" TEXT[] DEFAULT ARRAY[]::TEXT[],
  DROP COLUMN "revisionCount";

-- CreateTable: notes de suivi datées propres à un projet
CREATE TABLE "ProjectNote" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectNote_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ProjectNote" ADD CONSTRAINT "ProjectNote_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
