-- AlterTable
ALTER TABLE "public"."FreeShippingProgressBar" ALTER COLUMN "thresholdAmount" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."RecommendedProduct" ADD COLUMN     "shopifyVariantId" TEXT;
