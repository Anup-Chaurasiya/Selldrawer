-- AlterTable
ALTER TABLE "public"."FreeShippingProgressBar" ADD COLUMN     "thresholdMode" TEXT NOT NULL DEFAULT 'amount',
ADD COLUMN     "thresholdCount" INTEGER;

-- Update existing records to have thresholdAmount as required
UPDATE "public"."FreeShippingProgressBar" SET "thresholdAmount" = 0 WHERE "thresholdAmount" IS NULL;
