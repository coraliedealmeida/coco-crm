-- CreateEnum
CREATE TYPE "Platform" AS ENUM ('LINKEDIN', 'INSTAGRAM', 'BOTH');

-- CreateEnum
CREATE TYPE "PipelineStatus" AS ENUM ('ROUTINE_ENGAGEMENT', 'PREMIER_DM', 'RELANCE_1', 'RELANCE_2', 'GHOSTE', 'EN_DISCUSSION', 'APPEL_PREVU', 'DEVIS_A_FAIRE', 'DEVIS_ENVOYE', 'DEVIS_ACCEPTE', 'ARCHIVE');

-- CreateEnum
CREATE TYPE "ServiceType" AS ENUM ('LA_PATTE', 'LEMPREINTE', 'SITE_ONE_PAGE', 'SITE_VITRINE', 'KIT_RS', 'GRAPHISME_A_LA_CARTE', 'ACCOMPAGNEMENT_MENSUEL', 'ECOLES_JURY');

-- CreateTable
CREATE TABLE "Brand" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "sector" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "notes" TEXT,
    "engagementStartDate" TIMESTAMP(3) NOT NULL,
    "pipelineStatus" "PipelineStatus" NOT NULL DEFAULT 'ROUTINE_ENGAGEMENT',
    "contactName" TEXT,
    "contactRole" TEXT,
    "lastContactDate" TIMESTAMP(3),
    "nextActionDate" TIMESTAMP(3),
    "messageUsed" TEXT,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Brand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactHistoryEntry" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactHistoryEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SectorOption" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,

    CONSTRAINT "SectorOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SourceOption" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,

    CONSTRAINT "SourceOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "daysBeforeGreenLight" INTEGER NOT NULL DEFAULT 15,
    "daysBeforeRelance1" INTEGER NOT NULL DEFAULT 15,
    "daysBeforeRelance2" INTEGER NOT NULL DEFAULT 15,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "serviceType" "ServiceType" NOT NULL,
    "currentStep" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "amount" DOUBLE PRECISION,
    "sentAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SectorOption_label_key" ON "SectorOption"("label");

-- CreateIndex
CREATE UNIQUE INDEX "SourceOption_label_key" ON "SourceOption"("label");

-- CreateIndex
CREATE UNIQUE INDEX "Client_brandId_key" ON "Client"("brandId");

-- AddForeignKey
ALTER TABLE "ContactHistoryEntry" ADD CONSTRAINT "ContactHistoryEntry_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
