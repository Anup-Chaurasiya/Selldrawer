/*
  Warnings:

  - You are about to drop the column `limitUpsellsInCart` on the `FrequentlyBoughtTogether` table. All the data in the column will be lost.
  - You are about to drop the column `maxUpsellsInCart` on the `FrequentlyBoughtTogether` table. All the data in the column will be lost.
  - You are about to drop the `ShopCartDrawerVersionAssignment` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."ShopCartDrawerVersionAssignment" DROP CONSTRAINT "ShopCartDrawerVersionAssignment_versionId_fkey";

-- AlterTable
ALTER TABLE "CartDrawerVersion" ADD COLUMN     "segmentIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "targetingMode" TEXT NOT NULL DEFAULT 'percentage';

-- AlterTable
ALTER TABLE "FrequentlyBoughtTogether" DROP COLUMN "limitUpsellsInCart",
DROP COLUMN "maxUpsellsInCart";

-- DropTable
DROP TABLE "public"."ShopCartDrawerVersionAssignment";
