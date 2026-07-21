-- CreateTable: nouvelle demande de devis pour un client existant, independante du statut de
-- prospection unique porte par Brand (permet plusieurs devis en parallele pour un meme client).
CREATE TABLE "QuoteRequest" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "label" TEXT,
    "serviceTypes" "ServiceType"[] DEFAULT ARRAY[]::"ServiceType"[],
    "status" "PipelineStatus" NOT NULL DEFAULT 'DEVIS_A_FAIRE',
    "potentialRevenue" DOUBLE PRECISION,
    "lastContactDate" TIMESTAMP(3),
    "nextActionDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuoteRequest_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "QuoteRequest" ADD CONSTRAINT "QuoteRequest_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
