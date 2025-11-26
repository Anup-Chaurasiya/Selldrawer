-- CreateTable
CREATE TABLE "PromotionalBannerBlock" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "title" TEXT NOT NULL DEFAULT 'Promotional Banner Block',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromotionalBannerBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromotionalBannerBlockImage" (
    "id" TEXT NOT NULL,
    "blockId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "altText" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ctaText" TEXT,
    "ctaUrl" TEXT,
    "description" TEXT,
    "title" TEXT,
    "videoType" TEXT,
    "videoUrl" TEXT,

    CONSTRAINT "PromotionalBannerBlockImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromotionalBannerBlockCarouselSettings" (
    "id" TEXT NOT NULL,
    "blockId" TEXT NOT NULL,
    "autoRotate" BOOLEAN NOT NULL DEFAULT true,
    "rotationSpeed" INTEGER NOT NULL DEFAULT 5000,
    "showDots" BOOLEAN NOT NULL DEFAULT true,
    "showArrows" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromotionalBannerBlockCarouselSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PromotionalBannerBlock_shop_key" ON "PromotionalBannerBlock"("shop");

-- CreateIndex
CREATE INDEX "PromotionalBannerBlock_shop_isActive_idx" ON "PromotionalBannerBlock"("shop", "isActive");

-- CreateIndex
CREATE INDEX "PromotionalBannerBlockImage_blockId_idx" ON "PromotionalBannerBlockImage"("blockId");

-- CreateIndex
CREATE UNIQUE INDEX "PromotionalBannerBlockCarouselSettings_blockId_key" ON "PromotionalBannerBlockCarouselSettings"("blockId");

-- AddForeignKey
ALTER TABLE "PromotionalBannerBlockImage" ADD CONSTRAINT "PromotionalBannerBlockImage_blockId_fkey" FOREIGN KEY ("blockId") REFERENCES "PromotionalBannerBlock"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionalBannerBlockCarouselSettings" ADD CONSTRAINT "PromotionalBannerBlockCarouselSettings_blockId_fkey" FOREIGN KEY ("blockId") REFERENCES "PromotionalBannerBlock"("id") ON DELETE CASCADE ON UPDATE CASCADE;
