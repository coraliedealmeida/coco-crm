-- Refonte ProspectImport : 1 fiche par marque (pas par personne)
-- Les anciens champs individuels (firstName, lastName, position) sont remplacés
-- par un champ contacts JSON + rawName

-- Supprime et recrée la table (pas encore de données prod)
DROP TABLE IF EXISTS "ProspectImport";

CREATE TABLE "ProspectImport" (
    "id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "rawName" TEXT NOT NULL,
    "handle" TEXT,
    "profileUrl" TEXT,
    "contacts" JSONB NOT NULL DEFAULT '[]',
    "brandCategory" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "enrichedAt" TIMESTAMP(3),
    "enrichedName" TEXT,
    "enrichedSummary" TEXT,
    "deepEnrichedAt" TIMESTAMP(3),
    "enrichedRevenue" TEXT,
    "enrichedFunding" TEXT,
    "enrichedWebsite" TEXT,
    "enrichedCity" TEXT,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "integratedAt" TIMESTAMP(3),
    "brandId" TEXT,

    CONSTRAINT "ProspectImport_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProspectImport_brandId_key" ON "ProspectImport"("brandId");

ALTER TABLE "ProspectImport" ADD CONSTRAINT "ProspectImport_brandId_fkey"
    FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;
