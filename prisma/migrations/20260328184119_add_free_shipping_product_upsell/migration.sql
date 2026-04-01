-- AlterTable
ALTER TABLE "FreeShippingProgressBar" ADD COLUMN     "showProductUpsell" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "upsellThreshold" DECIMAL(65,30) DEFAULT 200,
ADD COLUMN     "upsellTitle" TEXT NOT NULL DEFAULT 'Almost there! Add this to unlock free shipping:';
