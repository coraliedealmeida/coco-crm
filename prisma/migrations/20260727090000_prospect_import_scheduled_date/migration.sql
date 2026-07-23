-- Ajoute la date de programmation automatique (calculée à la validation "Oui"),
-- avant que la fiche Brand ne soit créée par le cron d'activation.
ALTER TABLE "ProspectImport" ADD COLUMN "scheduledDate" TIMESTAMP(3);
