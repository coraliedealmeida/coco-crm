-- Espacement des passages en routine d'engagement (like/commentaire) et rotation des contacts
-- multiples d'une même marque.
ALTER TABLE "Brand" ADD COLUMN "lastEngagementAt" TIMESTAMP(3);
ALTER TABLE "Brand" ADD COLUMN "lastEngagementContactIndex" INTEGER;

ALTER TABLE "Settings" ADD COLUMN "daysBetweenEngagements" INTEGER NOT NULL DEFAULT 3;
