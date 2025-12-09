-- AlterTable
ALTER TABLE "PromotionalBanner" ADD COLUMN     "ctaBackgroundColor" TEXT NOT NULL DEFAULT '#f3f4f6',
ADD COLUMN     "ctaTextColor" TEXT NOT NULL DEFAULT '#374151',
ADD COLUMN     "descriptionColor" TEXT NOT NULL DEFAULT '#6b7280',
ADD COLUMN     "titleColor" TEXT NOT NULL DEFAULT '#111827';
