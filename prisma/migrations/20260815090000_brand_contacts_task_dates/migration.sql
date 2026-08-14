-- Contacts d'intérêt par marque (gérés depuis la fiche, alimentent la rotation en routine
-- d'engagement).
CREATE TABLE "BrandContact" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "profileUrl" TEXT,
    "platform" TEXT NOT NULL DEFAULT 'LINKEDIN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BrandContact_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "BrandContact" ADD CONSTRAINT "BrandContact_brandId_fkey"
    FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Date optionnelle sur les tâches du Dashboard, pour les faire apparaître dans "Relances du jour".
ALTER TABLE "DashboardTask" ADD COLUMN "dueDate" TIMESTAMP(3);
