-- AlterTable
ALTER TABLE "CouponCodeField" ADD COLUMN     "appliedDiscountText" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "backgroundColor" TEXT NOT NULL DEFAULT '#d1fae5',
ADD COLUMN     "borderColor" TEXT NOT NULL DEFAULT '#059669',
ADD COLUMN     "couponCodeColor" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "textColor" TEXT NOT NULL DEFAULT '#065f46';
