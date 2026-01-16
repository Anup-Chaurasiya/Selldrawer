-- AlterTable
ALTER TABLE "AnalyticsEvent" ADD COLUMN     "version" TEXT NOT NULL DEFAULT 'default';

-- CreateIndex
CREATE INDEX "AnalyticsEvent_shop_version_idx" ON "AnalyticsEvent"("shop", "version");
