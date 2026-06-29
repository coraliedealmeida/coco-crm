-- AlterEnum: replace ECOLES_JURY with ECOLES, JURY
BEGIN;
CREATE TYPE "ServiceType_new" AS ENUM ('LA_PATTE', 'LEMPREINTE', 'SITE_ONE_PAGE', 'SITE_VITRINE', 'KIT_RS', 'GRAPHISME_A_LA_CARTE', 'ACCOMPAGNEMENT_MENSUEL', 'ECOLES', 'JURY');
ALTER TABLE "Project" ALTER COLUMN "serviceType" TYPE "ServiceType_new" USING ("serviceType"::text::"ServiceType_new");
ALTER TYPE "ServiceType" RENAME TO "ServiceType_old";
ALTER TYPE "ServiceType_new" RENAME TO "ServiceType";
DROP TYPE "ServiceType_old";
COMMIT;

-- AlterTable
ALTER TABLE "Service" ADD COLUMN "order" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Bundle" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "serviceIds" TEXT[],
    "discountPercent" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Bundle_pkey" PRIMARY KEY ("id")
);
