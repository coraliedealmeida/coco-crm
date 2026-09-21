ALTER TABLE "Brand" ADD COLUMN "engagementCount" INTEGER NOT NULL DEFAULT 0;
UPDATE "Brand" SET "engagementCount" = 1 WHERE "lastEngagementAt" IS NOT NULL;
