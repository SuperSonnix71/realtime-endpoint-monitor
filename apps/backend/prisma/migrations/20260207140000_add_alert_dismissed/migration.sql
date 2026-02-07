ALTER TABLE "alerts" ADD COLUMN "dismissed" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "alerts_dismissed_idx" ON "alerts"("dismissed");
