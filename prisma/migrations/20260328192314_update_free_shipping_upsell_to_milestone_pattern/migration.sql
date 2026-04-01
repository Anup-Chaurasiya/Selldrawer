/*
  Warnings:

  - You are about to drop the column `upsellThreshold` on the `FreeShippingProgressBar` table. All the data in the column will be lost.
  - You are about to drop the column `upsellTitle` on the `FreeShippingProgressBar` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "FreeShippingProgressBar" DROP COLUMN "upsellThreshold",
DROP COLUMN "upsellTitle",
ADD COLUMN     "eligibilitySource" TEXT DEFAULT 'none',
ADD COLUMN     "eligibleCollectionHandle" TEXT,
ADD COLUMN     "eligibleProductIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "upsellHeaderText" TEXT DEFAULT 'Almost there! Add this to unlock free shipping:';

-- CreateTable
CREATE TABLE "FreeShippingUpsellProduct" (
    "id" TEXT NOT NULL,
    "barId" TEXT NOT NULL,
    "shopifyProductId" TEXT NOT NULL,
    "shopifyVariantId" TEXT,
    "title" TEXT NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "compareAtPrice" DECIMAL(65,30),
    "imageUrl" TEXT,
    "handle" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FreeShippingUpsellProduct_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FreeShippingUpsellProduct_barId_idx" ON "FreeShippingUpsellProduct"("barId");

-- CreateIndex
CREATE INDEX "FreeShippingUpsellProduct_position_idx" ON "FreeShippingUpsellProduct"("position");

-- AddForeignKey
ALTER TABLE "FreeShippingUpsellProduct" ADD CONSTRAINT "FreeShippingUpsellProduct_barId_fkey" FOREIGN KEY ("barId") REFERENCES "FreeShippingProgressBar"("id") ON DELETE CASCADE ON UPDATE CASCADE;
