-- CreateTable
CREATE TABLE "ProspectImport" (
    "id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "handle" TEXT,
    "profileUrl" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "company" TEXT,
    "position" TEXT,
    "brandCategory" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "enrichedAt" TIMESTAMP(3),
    "enrichedName" TEXT,
    "enrichedSummary" TEXT,
    "deepEnrichedAt" TIMESTAMP(3),
    "enrichedRevenue" TEXT,
    "enrichedFunding" TEXT,
    "enrichedWebsite" TEXT,
    "enrichedContact" TEXT,
    "enrichedContactRole" TEXT,
    "enrichedCity" TEXT,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "integratedAt" TIMESTAMP(3),
    "brandId" TEXT,

    CONSTRAINT "ProspectImport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProspectImport_brandId_key" ON "ProspectImport"("brandId");

-- AddForeignKey
ALTER TABLE "ProspectImport" ADD CONSTRAINT "ProspectImport_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;
