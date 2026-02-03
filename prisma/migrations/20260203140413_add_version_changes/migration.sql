/*
  Warnings:

  - You are about to drop the `ShopCartDrawerVersionAssignment` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."ShopCartDrawerVersionAssignment" DROP CONSTRAINT "ShopCartDrawerVersionAssignment_versionId_fkey";

-- AlterTable
ALTER TABLE "CartDrawerVersion" ADD COLUMN     "segmentIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "targetingMode" TEXT NOT NULL DEFAULT 'percentage';

-- DropTable
DROP TABLE "public"."ShopCartDrawerVersionAssignment";
