-- AlterTable
ALTER TABLE "FBTRule" ADD COLUMN     "discountCode" TEXT,
ADD COLUMN     "discountType" TEXT,
ADD COLUMN     "discountValue" DECIMAL(65,30);
