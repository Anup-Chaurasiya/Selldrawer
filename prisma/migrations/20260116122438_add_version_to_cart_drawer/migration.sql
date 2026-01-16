/*
  Warnings:

  - A unique constraint covering the columns `[shop,version]` on the table `CartDrawer` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."CartDrawer_shop_key";

-- AlterTable
ALTER TABLE "CartDrawer" ADD COLUMN     "version" TEXT NOT NULL DEFAULT 'default';

-- CreateIndex
CREATE INDEX "CartDrawer_version_idx" ON "CartDrawer"("version");

-- CreateIndex
CREATE UNIQUE INDEX "CartDrawer_shop_version_key" ON "CartDrawer"("shop", "version");
