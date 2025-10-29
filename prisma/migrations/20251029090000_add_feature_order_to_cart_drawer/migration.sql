-- AlterTable
ALTER TABLE "public"."CartDrawer"
ADD COLUMN     "featureOrder" TEXT[] NOT NULL DEFAULT '{}'::TEXT[];

