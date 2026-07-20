-- CreateEnum
CREATE TYPE "AcquisitionPath" AS ENUM ('ROUTINE', 'CONTACT');

-- AlterTable: nullable, les marques existantes restent sans parcours connu (fiche affiche
-- alors les deux champs Plateforme/Source, comme aujourd'hui).
ALTER TABLE "Brand" ADD COLUMN "acquisitionPath" "AcquisitionPath";
