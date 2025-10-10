-- CreateTable
CREATE TABLE "public"."CartDrawer" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "theme" TEXT NOT NULL DEFAULT 'light',
    "primaryColor" TEXT NOT NULL DEFAULT '#4F46E5',
    "freeShippingProgressBarEnabled" BOOLEAN NOT NULL DEFAULT true,
    "promotionalBannerEnabled" BOOLEAN NOT NULL DEFAULT true,
    "productRecommendationsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "couponCodeFieldEnabled" BOOLEAN NOT NULL DEFAULT false,
    "savingsDisplayEnabled" BOOLEAN NOT NULL DEFAULT true,
    "freeShippingMessageEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CartDrawer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FreeShippingProgressBar" (
    "id" TEXT NOT NULL,
    "cartDrawerId" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "thresholdAmount" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "beforeThresholdMessage" TEXT NOT NULL DEFAULT 'Add {remaining} for FREE shipping',
    "afterThresholdMessage" TEXT NOT NULL DEFAULT 'You''ve unlocked FREE shipping!',
    "progressBarColor" TEXT NOT NULL DEFAULT '#FF6B35',
    "backgroundColor" TEXT NOT NULL DEFAULT '#F3F4F6',
    "showPercentage" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FreeShippingProgressBar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PromotionalBanner" (
    "id" TEXT NOT NULL,
    "cartDrawerId" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "backgroundColor" TEXT NOT NULL DEFAULT '#FF6B35',
    "textColor" TEXT NOT NULL DEFAULT '#FFFFFF',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "minCartValue" DECIMAL(65,30),
    "maxCartValue" DECIMAL(65,30),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromotionalBanner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PromotionalBannerCondition" (
    "id" TEXT NOT NULL,
    "bannerId" TEXT NOT NULL,
    "conditionType" TEXT NOT NULL,
    "conditionValue" TEXT NOT NULL,
    "operator" TEXT NOT NULL DEFAULT 'contains',

    CONSTRAINT "PromotionalBannerCondition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProductRecommendation" (
    "id" TEXT NOT NULL,
    "cartDrawerId" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "title" TEXT NOT NULL DEFAULT 'You may also like',
    "maxProducts" INTEGER NOT NULL DEFAULT 4,
    "layout" TEXT NOT NULL DEFAULT 'grid',
    "recommendationType" TEXT NOT NULL DEFAULT 'manual',
    "showDiscount" BOOLEAN NOT NULL DEFAULT true,
    "showDiscountBadge" BOOLEAN NOT NULL DEFAULT true,
    "showAddButton" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProductRecommendationRule" (
    "id" TEXT NOT NULL,
    "recommendationId" TEXT NOT NULL,
    "triggerType" TEXT NOT NULL,
    "triggerValue" TEXT NOT NULL,
    "recommendProducts" TEXT[],

    CONSTRAINT "ProductRecommendationRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RecommendedProduct" (
    "id" TEXT NOT NULL,
    "recommendationId" TEXT NOT NULL,
    "shopifyProductId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "compareAtPrice" DECIMAL(65,30),
    "imageUrl" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "RecommendedProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SavingsDisplay" (
    "id" TEXT NOT NULL,
    "cartDrawerId" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "message" TEXT NOT NULL DEFAULT '{amount} Saved so far!',
    "position" TEXT NOT NULL DEFAULT 'above_total',
    "backgroundColor" TEXT NOT NULL DEFAULT '#10B981',
    "textColor" TEXT NOT NULL DEFAULT '#FFFFFF',
    "highlightColor" TEXT NOT NULL DEFAULT '#FFFFFF',
    "includeProductDiscounts" BOOLEAN NOT NULL DEFAULT true,
    "includeCartDiscounts" BOOLEAN NOT NULL DEFAULT true,
    "includeFreeShipping" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavingsDisplay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FreeShippingMessage" (
    "id" TEXT NOT NULL,
    "cartDrawerId" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "thresholdAmount" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "beforeThresholdMessage" TEXT NOT NULL DEFAULT 'Free shipping on orders over {threshold}',
    "afterThresholdMessage" TEXT NOT NULL DEFAULT 'Add {remaining} more for FREE shipping',
    "achievedMessage" TEXT NOT NULL DEFAULT 'Free shipping applied!',
    "backgroundColor" TEXT NOT NULL DEFAULT '#FEF3C7',
    "textColor" TEXT NOT NULL DEFAULT '#92400E',
    "iconColor" TEXT NOT NULL DEFAULT '#F59E0B',
    "position" TEXT NOT NULL DEFAULT 'above_checkout',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FreeShippingMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CouponCodeField" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "placeholder" TEXT NOT NULL DEFAULT 'Enter coupon code',
    "buttonText" TEXT NOT NULL DEFAULT 'Apply',
    "position" TEXT NOT NULL DEFAULT 'above_checkout',
    "successMessage" TEXT NOT NULL DEFAULT 'Coupon applied successfully!',
    "errorMessage" TEXT NOT NULL DEFAULT 'Invalid coupon code',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CouponCodeField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CartDrawerAnalytics" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventData" TEXT,
    "cartValue" DECIMAL(65,30),
    "itemCount" INTEGER,
    "sessionId" TEXT,
    "customerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CartDrawerAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CartDrawer_shop_key" ON "public"."CartDrawer"("shop");

-- CreateIndex
CREATE INDEX "CartDrawer_shop_idx" ON "public"."CartDrawer"("shop");

-- CreateIndex
CREATE INDEX "FreeShippingProgressBar_cartDrawerId_idx" ON "public"."FreeShippingProgressBar"("cartDrawerId");

-- CreateIndex
CREATE INDEX "FreeShippingProgressBar_shop_isActive_idx" ON "public"."FreeShippingProgressBar"("shop", "isActive");

-- CreateIndex
CREATE INDEX "PromotionalBanner_cartDrawerId_idx" ON "public"."PromotionalBanner"("cartDrawerId");

-- CreateIndex
CREATE INDEX "PromotionalBanner_shop_isActive_idx" ON "public"."PromotionalBanner"("shop", "isActive");

-- CreateIndex
CREATE INDEX "PromotionalBanner_startDate_endDate_idx" ON "public"."PromotionalBanner"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "PromotionalBannerCondition_bannerId_idx" ON "public"."PromotionalBannerCondition"("bannerId");

-- CreateIndex
CREATE INDEX "ProductRecommendation_cartDrawerId_idx" ON "public"."ProductRecommendation"("cartDrawerId");

-- CreateIndex
CREATE INDEX "ProductRecommendation_shop_isActive_idx" ON "public"."ProductRecommendation"("shop", "isActive");

-- CreateIndex
CREATE INDEX "ProductRecommendationRule_recommendationId_idx" ON "public"."ProductRecommendationRule"("recommendationId");

-- CreateIndex
CREATE INDEX "RecommendedProduct_recommendationId_idx" ON "public"."RecommendedProduct"("recommendationId");

-- CreateIndex
CREATE INDEX "RecommendedProduct_position_idx" ON "public"."RecommendedProduct"("position");

-- CreateIndex
CREATE INDEX "SavingsDisplay_cartDrawerId_idx" ON "public"."SavingsDisplay"("cartDrawerId");

-- CreateIndex
CREATE INDEX "SavingsDisplay_shop_isActive_idx" ON "public"."SavingsDisplay"("shop", "isActive");

-- CreateIndex
CREATE INDEX "FreeShippingMessage_cartDrawerId_idx" ON "public"."FreeShippingMessage"("cartDrawerId");

-- CreateIndex
CREATE INDEX "FreeShippingMessage_shop_isActive_idx" ON "public"."FreeShippingMessage"("shop", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "CouponCodeField_shop_key" ON "public"."CouponCodeField"("shop");

-- CreateIndex
CREATE INDEX "CouponCodeField_shop_idx" ON "public"."CouponCodeField"("shop");

-- CreateIndex
CREATE INDEX "CartDrawerAnalytics_shop_createdAt_idx" ON "public"."CartDrawerAnalytics"("shop", "createdAt");

-- CreateIndex
CREATE INDEX "CartDrawerAnalytics_eventType_idx" ON "public"."CartDrawerAnalytics"("eventType");

-- AddForeignKey
ALTER TABLE "public"."FreeShippingProgressBar" ADD CONSTRAINT "FreeShippingProgressBar_cartDrawerId_fkey" FOREIGN KEY ("cartDrawerId") REFERENCES "public"."CartDrawer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PromotionalBanner" ADD CONSTRAINT "PromotionalBanner_cartDrawerId_fkey" FOREIGN KEY ("cartDrawerId") REFERENCES "public"."CartDrawer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PromotionalBannerCondition" ADD CONSTRAINT "PromotionalBannerCondition_bannerId_fkey" FOREIGN KEY ("bannerId") REFERENCES "public"."PromotionalBanner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductRecommendation" ADD CONSTRAINT "ProductRecommendation_cartDrawerId_fkey" FOREIGN KEY ("cartDrawerId") REFERENCES "public"."CartDrawer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductRecommendationRule" ADD CONSTRAINT "ProductRecommendationRule_recommendationId_fkey" FOREIGN KEY ("recommendationId") REFERENCES "public"."ProductRecommendation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RecommendedProduct" ADD CONSTRAINT "RecommendedProduct_recommendationId_fkey" FOREIGN KEY ("recommendationId") REFERENCES "public"."ProductRecommendation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SavingsDisplay" ADD CONSTRAINT "SavingsDisplay_cartDrawerId_fkey" FOREIGN KEY ("cartDrawerId") REFERENCES "public"."CartDrawer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FreeShippingMessage" ADD CONSTRAINT "FreeShippingMessage_cartDrawerId_fkey" FOREIGN KEY ("cartDrawerId") REFERENCES "public"."CartDrawer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
