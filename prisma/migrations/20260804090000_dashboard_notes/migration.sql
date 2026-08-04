-- Espace personnel Dashboard : tâches libres + bloc de notes en texte libre.
CREATE TABLE "DashboardTask" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DashboardTask_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DashboardNote" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DashboardNote_pkey" PRIMARY KEY ("id")
);
