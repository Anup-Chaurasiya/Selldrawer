/*
  Warnings:

  - You are about to drop the column `discountType` on the `FrequentlyBoughtTogether` table. All the data in the column will be lost.
  - You are about to drop the column `discountValue` on the `FrequentlyBoughtTogether` table. All the data in the column will be lost.
  - You are about to drop the column `showDiscount` on the `FrequentlyBoughtTogether` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."FrequentlyBoughtTogether_shop_isActive_idx";

-- AlterTable
ALTER TABLE "FrequentlyBoughtTogether" DROP COLUMN "discountType",
DROP COLUMN "discountValue",
DROP COLUMN "showDiscount",
ALTER COLUMN "isActive" SET DEFAULT false,
ALTER COLUMN "maxUpsellsInCart" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "FrequentlyBoughtTogether_shop_idx" ON "FrequentlyBoughtTogether"("shop");
