/*
  Warnings:

  - A unique constraint covering the columns `[shop,configId]` on the table `PromotionalBannerBlock` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."PromotionalBannerBlock_shop_key";

-- AlterTable
ALTER TABLE "PromotionalBannerBlock" ADD COLUMN     "configId" TEXT NOT NULL DEFAULT 'default',
ADD COLUMN     "name" TEXT NOT NULL DEFAULT 'Default Banner';

-- CreateIndex
CREATE UNIQUE INDEX "PromotionalBannerBlock_shop_configId_key" ON "PromotionalBannerBlock"("shop", "configId");
