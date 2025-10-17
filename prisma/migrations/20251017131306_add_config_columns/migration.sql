-- AlterTable
ALTER TABLE "public"."PromotionalBanner" ADD COLUMN     "bannerType" TEXT NOT NULL DEFAULT 'image',
ADD COLUMN     "ctaButtonText" TEXT,
ADD COLUMN     "ctaEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "ctaProductHandle" TEXT,
ADD COLUMN     "ctaQuantity" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "ctaType" TEXT,
ADD COLUMN     "ctaUrl" TEXT,
ADD COLUMN     "ctaVariantId" TEXT,
ADD COLUMN     "displayType" TEXT NOT NULL DEFAULT 'text',
ADD COLUMN     "imageUrls" TEXT[];

-- CreateTable
CREATE TABLE "public"."PromotionalBannerImage" (
    "id" TEXT NOT NULL,
    "bannerId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "altText" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromotionalBannerImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PromotionalBannerCarouselSettings" (
    "id" TEXT NOT NULL,
    "bannerId" TEXT NOT NULL,
    "autoRotate" BOOLEAN NOT NULL DEFAULT true,
    "rotationSpeed" INTEGER NOT NULL DEFAULT 5000,
    "showDots" BOOLEAN NOT NULL DEFAULT true,
    "showArrows" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromotionalBannerCarouselSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PromotionalBannerImage_bannerId_idx" ON "public"."PromotionalBannerImage"("bannerId");

-- CreateIndex
CREATE UNIQUE INDEX "PromotionalBannerCarouselSettings_bannerId_key" ON "public"."PromotionalBannerCarouselSettings"("bannerId");

-- AddForeignKey
ALTER TABLE "public"."PromotionalBannerImage" ADD CONSTRAINT "PromotionalBannerImage_bannerId_fkey" FOREIGN KEY ("bannerId") REFERENCES "public"."PromotionalBanner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PromotionalBannerCarouselSettings" ADD CONSTRAINT "PromotionalBannerCarouselSettings_bannerId_fkey" FOREIGN KEY ("bannerId") REFERENCES "public"."PromotionalBanner"("id") ON DELETE CASCADE ON UPDATE CASCADE;
