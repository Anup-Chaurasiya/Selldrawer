-- AlterTable
ALTER TABLE "public"."CouponCodeField" ADD COLUMN     "autoApplyStrategy" TEXT NOT NULL DEFAULT 'best_value',
ADD COLUMN     "enableAutoApply" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "showAllOffers" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "showAllOffersButtonText" TEXT NOT NULL DEFAULT 'Show all offers';
