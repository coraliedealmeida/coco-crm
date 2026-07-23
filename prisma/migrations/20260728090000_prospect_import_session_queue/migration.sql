-- Marque comme faisant partie du lot "à qualifier" de la Session du jour.
ALTER TABLE "ProspectImport" ADD COLUMN "queuedForSessionAt" TIMESTAMP(3);
