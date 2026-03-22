-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "scope" TEXT,
    "expires" TIMESTAMP(3),
    "accessToken" TEXT NOT NULL,
    "storefrontAccessToken" TEXT,
    "userId" BIGINT,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "accountOwner" BOOLEAN NOT NULL DEFAULT false,
    "locale" TEXT,
    "collaborator" BOOLEAN DEFAULT false,
    "emailVerified" BOOLEAN DEFAULT false,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CartConfiguration" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "conditionType" TEXT NOT NULL,
    "conditionOperator" TEXT NOT NULL,
    "conditionValue" DECIMAL(65,30) NOT NULL,
    "actionType" TEXT NOT NULL,
    "actionValue" DECIMAL(65,30),
    "actionMessage" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CartConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CartConfigurationTarget" (
    "id" TEXT NOT NULL,
    "configurationId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "shopifyId" TEXT NOT NULL,
    "title" TEXT,

    CONSTRAINT "CartConfigurationTarget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CartDrawer" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT 'default',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "theme" TEXT NOT NULL DEFAULT 'light',
    "primaryColor" TEXT NOT NULL DEFAULT '#4F46E5',
    "freeShippingProgressBarEnabled" BOOLEAN NOT NULL DEFAULT true,
    "promotionalBannerEnabled" BOOLEAN NOT NULL DEFAULT true,
    "productRecommendationsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "couponCodeFieldEnabled" BOOLEAN NOT NULL DEFAULT false,
    "savingsDisplayEnabled" BOOLEAN NOT NULL DEFAULT true,
    "freeShippingMessageEnabled" BOOLEAN NOT NULL DEFAULT true,
    "cartTotalsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "milestonesEnabled" BOOLEAN NOT NULL DEFAULT false,
    "milestonesProgressBarColor" TEXT NOT NULL DEFAULT '#3b82f6',
    "milestonesAllUnlockedMessage" TEXT NOT NULL DEFAULT '🎉 Congratulations! All rewards unlocked!',
    "freeGiftsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "featureOrder" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "itemOrderingEnabled" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "CartDrawer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FreeShippingProgressBar" (
    "id" TEXT NOT NULL,
    "cartDrawerId" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "thresholdAmount" DECIMAL(65,30),
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "beforeThresholdMessage" TEXT NOT NULL DEFAULT 'Add {remaining} for FREE shipping',
    "afterThresholdMessage" TEXT NOT NULL DEFAULT 'You''ve unlocked FREE shipping!',
    "progressBarColor" TEXT NOT NULL DEFAULT '#FF6B35',
    "backgroundColor" TEXT NOT NULL DEFAULT '#F3F4F6',
    "borderColor" TEXT NOT NULL DEFAULT '#e2e8f0',
    "showPercentage" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "thresholdMode" TEXT NOT NULL DEFAULT 'amount',
    "thresholdCount" INTEGER,

    CONSTRAINT "FreeShippingProgressBar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromotionalBanner" (
    "id" TEXT NOT NULL,
    "cartDrawerId" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "backgroundColor" TEXT NOT NULL DEFAULT '#FF6B35',
    "textColor" TEXT NOT NULL DEFAULT '#FFFFFF',
    "titleColor" TEXT NOT NULL DEFAULT '#111827',
    "descriptionColor" TEXT NOT NULL DEFAULT '#6b7280',
    "ctaTextColor" TEXT NOT NULL DEFAULT '#374151',
    "ctaBackgroundColor" TEXT NOT NULL DEFAULT '#f3f4f6',
    "borderColor" TEXT NOT NULL DEFAULT '#e5e7eb',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "minCartValue" DECIMAL(65,30),
    "maxCartValue" DECIMAL(65,30),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "bannerType" TEXT NOT NULL DEFAULT 'image',
    "ctaButtonText" TEXT,
    "ctaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "ctaProductHandle" TEXT,
    "ctaQuantity" INTEGER NOT NULL DEFAULT 1,
    "ctaType" TEXT,
    "ctaUrl" TEXT,
    "ctaVariantId" TEXT,
    "displayType" TEXT NOT NULL DEFAULT 'text',
    "imageUrls" TEXT[],

    CONSTRAINT "PromotionalBanner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromotionalBannerCondition" (
    "id" TEXT NOT NULL,
    "bannerId" TEXT NOT NULL,
    "conditionType" TEXT NOT NULL,
    "conditionValue" TEXT NOT NULL,
    "operator" TEXT NOT NULL DEFAULT 'contains',

    CONSTRAINT "PromotionalBannerCondition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromotionalBannerImage" (
    "id" TEXT NOT NULL,
    "bannerId" TEXT NOT NULL,
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

    CONSTRAINT "PromotionalBannerImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromotionalBannerCarouselSettings" (
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

-- CreateTable
CREATE TABLE "PromotionalBannerBlock" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "configId" TEXT NOT NULL DEFAULT 'default',
    "name" TEXT NOT NULL DEFAULT 'Default Banner',
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

-- CreateTable
CREATE TABLE "ProductRecommendation" (
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
CREATE TABLE "ProductRecommendationRule" (
    "id" TEXT NOT NULL,
    "recommendationId" TEXT NOT NULL,
    "triggerType" TEXT NOT NULL,
    "triggerValue" TEXT NOT NULL,
    "recommendProducts" TEXT[],

    CONSTRAINT "ProductRecommendationRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecommendedProduct" (
    "id" TEXT NOT NULL,
    "recommendationId" TEXT NOT NULL,
    "shopifyProductId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "compareAtPrice" DECIMAL(65,30),
    "imageUrl" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "shopifyVariantId" TEXT,

    CONSTRAINT "RecommendedProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavingsDisplay" (
    "id" TEXT NOT NULL,
    "cartDrawerId" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "message" TEXT NOT NULL DEFAULT '{amount} Saved so far!',
    "position" TEXT NOT NULL DEFAULT 'above_total',
    "backgroundColor" TEXT NOT NULL DEFAULT '#10B981',
    "textColor" TEXT NOT NULL DEFAULT '#FFFFFF',
    "borderColor" TEXT NOT NULL DEFAULT '#FFFFFF',
    "highlightColor" TEXT NOT NULL DEFAULT '#FFFFFF',
    "includeProductDiscounts" BOOLEAN NOT NULL DEFAULT true,
    "includeCartDiscounts" BOOLEAN NOT NULL DEFAULT true,
    "includeFreeShipping" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavingsDisplay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FreeShippingMessage" (
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
    "borderColor" TEXT NOT NULL DEFAULT '#92400E',
    "icon" TEXT NOT NULL DEFAULT '🚚',
    "iconColor" TEXT NOT NULL DEFAULT '#F59E0B',
    "position" TEXT NOT NULL DEFAULT 'above_checkout',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FreeShippingMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CartTotals" (
    "id" TEXT NOT NULL,
    "cartDrawerId" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "showOriginalPrice" BOOLEAN NOT NULL DEFAULT true,
    "showItemDiscounts" BOOLEAN NOT NULL DEFAULT true,
    "showSubtotal" BOOLEAN NOT NULL DEFAULT true,
    "showCouponDiscount" BOOLEAN NOT NULL DEFAULT true,
    "showTaxNotice" BOOLEAN NOT NULL DEFAULT true,
    "subtotalLabel" TEXT NOT NULL DEFAULT 'Subtotal',
    "totalLabel" TEXT NOT NULL DEFAULT 'Total',
    "taxNoticeText" TEXT NOT NULL DEFAULT 'Taxes and shipping calculated at checkout',
    "originalPriceLabel" TEXT NOT NULL DEFAULT 'Original Price',
    "itemDiscountsLabel" TEXT NOT NULL DEFAULT 'Item Discounts',
    "borderColor" TEXT NOT NULL DEFAULT '#e5e7eb',
    "backgroundColor" TEXT NOT NULL DEFAULT '#ffffff',
    "textColor" TEXT NOT NULL DEFAULT '#374151',
    "totalTextColor" TEXT NOT NULL DEFAULT '#111827',
    "discountColor" TEXT NOT NULL DEFAULT '#f59e0b',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CartTotals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CouponCodeField" (
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
    "autoApplyStrategy" TEXT NOT NULL DEFAULT 'best_value',
    "enableAutoApply" BOOLEAN NOT NULL DEFAULT false,
    "showAllOffers" BOOLEAN NOT NULL DEFAULT false,
    "showAllOffersButtonText" TEXT NOT NULL DEFAULT 'Show all offers',
    "backgroundColor" TEXT NOT NULL DEFAULT '#d1fae5',
    "textColor" TEXT NOT NULL DEFAULT '#065f46',
    "couponCodeColor" TEXT NOT NULL DEFAULT '',
    "borderColor" TEXT NOT NULL DEFAULT '#059669',
    "appliedDiscountText" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "CouponCodeField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CartDrawerAnalytics" (
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

-- CreateTable
CREATE TABLE "AppSubscription" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "planName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "amount" DECIMAL(65,30) NOT NULL,
    "currencyCode" TEXT NOT NULL,
    "interval" TEXT NOT NULL,
    "trialDays" INTEGER,
    "trialEndsAt" TIMESTAMP(3),
    "billingOn" TIMESTAMP(3),
    "shopifyChargeId" TEXT,
    "shopifyConfirmationUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "cancelledAt" TIMESTAMP(3),

    CONSTRAINT "AppSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FrequentlyBoughtTogether" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "title" TEXT NOT NULL DEFAULT 'Frequently Bought Together',
    "recommendationType" TEXT NOT NULL DEFAULT 'manual',
    "algorithm" TEXT NOT NULL DEFAULT 'related',
    "useAI" BOOLEAN NOT NULL DEFAULT false,
    "useSmartVariantMatching" BOOLEAN NOT NULL DEFAULT false,
    "showOfferIfInCart" BOOLEAN NOT NULL DEFAULT false,
    "maxUpsellsShown" INTEGER NOT NULL DEFAULT 4,
    "showProductReviews" BOOLEAN NOT NULL DEFAULT false,
    "layout" TEXT NOT NULL DEFAULT 'horizontal',
    "templateType" TEXT NOT NULL DEFAULT 'classic',
    "buttonText" TEXT NOT NULL DEFAULT 'Add selected items',
    "buttonColor" TEXT NOT NULL DEFAULT '#000000',
    "buttonTextColor" TEXT NOT NULL DEFAULT '#FFFFFF',
    "showTotalPrice" BOOLEAN NOT NULL DEFAULT true,
    "showIndividualPrices" BOOLEAN NOT NULL DEFAULT true,
    "showCheckboxes" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FrequentlyBoughtTogether_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FBTRule" (
    "id" TEXT NOT NULL,
    "fbtId" TEXT NOT NULL,
    "triggerType" TEXT NOT NULL,
    "triggerValue" TEXT NOT NULL,
    "triggerProductId" TEXT,
    "triggerTitle" TEXT,
    "discountType" TEXT,
    "discountValue" DECIMAL(65,30),
    "discountCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FBTRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FBTProduct" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "shopifyProductId" TEXT NOT NULL,
    "shopifyVariantId" TEXT,
    "title" TEXT NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "compareAtPrice" DECIMAL(65,30),
    "imageUrl" TEXT,
    "handle" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FBTProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CartMilestone" (
    "id" TEXT NOT NULL,
    "cartDrawerId" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "targetAmount" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "rewardType" TEXT NOT NULL,
    "rewardValue" DECIMAL(65,30),
    "discountCode" TEXT,
    "shopifyDiscountId" TEXT,
    "targetType" TEXT NOT NULL DEFAULT 'store_wide',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "icon" TEXT,
    "unlockedMessage" TEXT,
    "inProgressMessage" TEXT,
    "lockedMessage" TEXT,
    "iconColor" TEXT NOT NULL DEFAULT '#3b82f6',
    "titleColor" TEXT NOT NULL DEFAULT '#1e40af',
    "unlockButtonColor" TEXT NOT NULL DEFAULT '#3b82f6',
    "showProgressBar" BOOLEAN NOT NULL DEFAULT true,
    "eligibleCollectionHandle" TEXT,
    "eligibleTag" TEXT,
    "eligibleProductIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "eligibilitySource" TEXT DEFAULT 'none',
    "upsellHeaderText" TEXT DEFAULT 'Unlock Your Reward',
    "viewAllLinkText" TEXT DEFAULT 'View All',
    "unlockButtonText" TEXT DEFAULT 'Unlock Reward',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CartMilestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CartMilestoneTarget" (
    "id" TEXT NOT NULL,
    "milestoneId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "shopifyId" TEXT NOT NULL,
    "title" TEXT,

    CONSTRAINT "CartMilestoneTarget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CartMilestoneGiftProduct" (
    "id" TEXT NOT NULL,
    "milestoneId" TEXT NOT NULL,
    "shopifyProductId" TEXT NOT NULL,
    "shopifyVariantId" TEXT,
    "title" TEXT NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "compareAtPrice" DECIMAL(65,30),
    "imageUrl" TEXT,
    "handle" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CartMilestoneGiftProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsEvent" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT 'default',
    "eventType" TEXT NOT NULL,
    "component" TEXT NOT NULL,
    "productId" TEXT,
    "variantId" TEXT,
    "value" DECIMAL(65,30),
    "currency" TEXT DEFAULT 'USD',
    "url" TEXT,
    "sessionId" TEXT,
    "orderId" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FreeGift" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "cartDrawerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "triggerType" TEXT NOT NULL DEFAULT 'spend',
    "triggerValue" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "customerLimit" INTEGER NOT NULL DEFAULT 1,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "shopifyDiscountId" TEXT,
    "discountCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FreeGift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FreeGiftProduct" (
    "id" TEXT NOT NULL,
    "freeGiftId" TEXT NOT NULL,
    "shopifyProductId" TEXT NOT NULL,
    "shopifyVariantId" TEXT,
    "title" TEXT NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "compareAtPrice" DECIMAL(65,30),
    "imageUrl" TEXT,
    "handle" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FreeGiftProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FreeGiftTarget" (
    "id" TEXT NOT NULL,
    "freeGiftId" TEXT NOT NULL,
    "shopifyId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FreeGiftTarget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CartDrawerVersion" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "targetingMode" TEXT NOT NULL DEFAULT 'percentage',
    "rolloutPercentage" INTEGER NOT NULL DEFAULT 0,
    "segmentIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CartDrawerVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CartConfiguration_shop_isActive_idx" ON "CartConfiguration"("shop", "isActive");

-- CreateIndex
CREATE INDEX "CartConfigurationTarget_configurationId_idx" ON "CartConfigurationTarget"("configurationId");

-- CreateIndex
CREATE INDEX "CartConfigurationTarget_targetType_shopifyId_idx" ON "CartConfigurationTarget"("targetType", "shopifyId");

-- CreateIndex
CREATE INDEX "CartDrawer_shop_idx" ON "CartDrawer"("shop");

-- CreateIndex
CREATE INDEX "CartDrawer_version_idx" ON "CartDrawer"("version");

-- CreateIndex
CREATE UNIQUE INDEX "CartDrawer_shop_version_key" ON "CartDrawer"("shop", "version");

-- CreateIndex
CREATE INDEX "FreeShippingProgressBar_cartDrawerId_idx" ON "FreeShippingProgressBar"("cartDrawerId");

-- CreateIndex
CREATE INDEX "FreeShippingProgressBar_shop_isActive_idx" ON "FreeShippingProgressBar"("shop", "isActive");

-- CreateIndex
CREATE INDEX "PromotionalBanner_cartDrawerId_idx" ON "PromotionalBanner"("cartDrawerId");

-- CreateIndex
CREATE INDEX "PromotionalBanner_shop_isActive_idx" ON "PromotionalBanner"("shop", "isActive");

-- CreateIndex
CREATE INDEX "PromotionalBanner_startDate_endDate_idx" ON "PromotionalBanner"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "PromotionalBannerCondition_bannerId_idx" ON "PromotionalBannerCondition"("bannerId");

-- CreateIndex
CREATE INDEX "PromotionalBannerImage_bannerId_idx" ON "PromotionalBannerImage"("bannerId");

-- CreateIndex
CREATE UNIQUE INDEX "PromotionalBannerCarouselSettings_bannerId_key" ON "PromotionalBannerCarouselSettings"("bannerId");

-- CreateIndex
CREATE INDEX "PromotionalBannerBlock_shop_isActive_idx" ON "PromotionalBannerBlock"("shop", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "PromotionalBannerBlock_shop_configId_key" ON "PromotionalBannerBlock"("shop", "configId");

-- CreateIndex
CREATE INDEX "PromotionalBannerBlockImage_blockId_idx" ON "PromotionalBannerBlockImage"("blockId");

-- CreateIndex
CREATE UNIQUE INDEX "PromotionalBannerBlockCarouselSettings_blockId_key" ON "PromotionalBannerBlockCarouselSettings"("blockId");

-- CreateIndex
CREATE INDEX "ProductRecommendation_cartDrawerId_idx" ON "ProductRecommendation"("cartDrawerId");

-- CreateIndex
CREATE INDEX "ProductRecommendation_shop_isActive_idx" ON "ProductRecommendation"("shop", "isActive");

-- CreateIndex
CREATE INDEX "ProductRecommendationRule_recommendationId_idx" ON "ProductRecommendationRule"("recommendationId");

-- CreateIndex
CREATE INDEX "RecommendedProduct_recommendationId_idx" ON "RecommendedProduct"("recommendationId");

-- CreateIndex
CREATE INDEX "RecommendedProduct_position_idx" ON "RecommendedProduct"("position");

-- CreateIndex
CREATE INDEX "SavingsDisplay_cartDrawerId_idx" ON "SavingsDisplay"("cartDrawerId");

-- CreateIndex
CREATE INDEX "SavingsDisplay_shop_isActive_idx" ON "SavingsDisplay"("shop", "isActive");

-- CreateIndex
CREATE INDEX "FreeShippingMessage_cartDrawerId_idx" ON "FreeShippingMessage"("cartDrawerId");

-- CreateIndex
CREATE INDEX "FreeShippingMessage_shop_isActive_idx" ON "FreeShippingMessage"("shop", "isActive");

-- CreateIndex
CREATE INDEX "CartTotals_cartDrawerId_idx" ON "CartTotals"("cartDrawerId");

-- CreateIndex
CREATE INDEX "CartTotals_shop_isActive_idx" ON "CartTotals"("shop", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "CouponCodeField_shop_key" ON "CouponCodeField"("shop");

-- CreateIndex
CREATE INDEX "CouponCodeField_shop_idx" ON "CouponCodeField"("shop");

-- CreateIndex
CREATE INDEX "CartDrawerAnalytics_shop_createdAt_idx" ON "CartDrawerAnalytics"("shop", "createdAt");

-- CreateIndex
CREATE INDEX "CartDrawerAnalytics_eventType_idx" ON "CartDrawerAnalytics"("eventType");

-- CreateIndex
CREATE UNIQUE INDEX "AppSubscription_shop_key" ON "AppSubscription"("shop");

-- CreateIndex
CREATE INDEX "AppSubscription_shop_idx" ON "AppSubscription"("shop");

-- CreateIndex
CREATE INDEX "AppSubscription_status_idx" ON "AppSubscription"("status");

-- CreateIndex
CREATE UNIQUE INDEX "FrequentlyBoughtTogether_shop_key" ON "FrequentlyBoughtTogether"("shop");

-- CreateIndex
CREATE INDEX "FrequentlyBoughtTogether_shop_idx" ON "FrequentlyBoughtTogether"("shop");

-- CreateIndex
CREATE INDEX "FBTRule_fbtId_idx" ON "FBTRule"("fbtId");

-- CreateIndex
CREATE INDEX "FBTRule_triggerProductId_idx" ON "FBTRule"("triggerProductId");

-- CreateIndex
CREATE INDEX "FBTProduct_ruleId_idx" ON "FBTProduct"("ruleId");

-- CreateIndex
CREATE INDEX "FBTProduct_position_idx" ON "FBTProduct"("position");

-- CreateIndex
CREATE INDEX "CartMilestone_cartDrawerId_idx" ON "CartMilestone"("cartDrawerId");

-- CreateIndex
CREATE INDEX "CartMilestone_shop_isActive_idx" ON "CartMilestone"("shop", "isActive");

-- CreateIndex
CREATE INDEX "CartMilestone_priority_idx" ON "CartMilestone"("priority");

-- CreateIndex
CREATE INDEX "CartMilestoneTarget_milestoneId_idx" ON "CartMilestoneTarget"("milestoneId");

-- CreateIndex
CREATE INDEX "CartMilestoneTarget_targetType_shopifyId_idx" ON "CartMilestoneTarget"("targetType", "shopifyId");

-- CreateIndex
CREATE INDEX "CartMilestoneGiftProduct_milestoneId_idx" ON "CartMilestoneGiftProduct"("milestoneId");

-- CreateIndex
CREATE INDEX "CartMilestoneGiftProduct_position_idx" ON "CartMilestoneGiftProduct"("position");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_shop_createdAt_idx" ON "AnalyticsEvent"("shop", "createdAt");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_shop_component_eventType_idx" ON "AnalyticsEvent"("shop", "component", "eventType");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_shop_productId_idx" ON "AnalyticsEvent"("shop", "productId");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_shop_version_idx" ON "AnalyticsEvent"("shop", "version");

-- CreateIndex
CREATE INDEX "FreeGift_shop_idx" ON "FreeGift"("shop");

-- CreateIndex
CREATE INDEX "FreeGift_cartDrawerId_idx" ON "FreeGift"("cartDrawerId");

-- CreateIndex
CREATE INDEX "FreeGiftProduct_freeGiftId_idx" ON "FreeGiftProduct"("freeGiftId");

-- CreateIndex
CREATE INDEX "FreeGiftTarget_freeGiftId_idx" ON "FreeGiftTarget"("freeGiftId");

-- CreateIndex
CREATE UNIQUE INDEX "CartDrawerVersion_key_key" ON "CartDrawerVersion"("key");

-- CreateIndex
CREATE INDEX "CartDrawerVersion_isActive_idx" ON "CartDrawerVersion"("isActive");

-- CreateIndex
CREATE INDEX "CartDrawerVersion_isDefault_idx" ON "CartDrawerVersion"("isDefault");

-- CreateIndex
CREATE INDEX "CartDrawerVersion_key_idx" ON "CartDrawerVersion"("key");

-- AddForeignKey
ALTER TABLE "CartConfigurationTarget" ADD CONSTRAINT "CartConfigurationTarget_configurationId_fkey" FOREIGN KEY ("configurationId") REFERENCES "CartConfiguration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FreeShippingProgressBar" ADD CONSTRAINT "FreeShippingProgressBar_cartDrawerId_fkey" FOREIGN KEY ("cartDrawerId") REFERENCES "CartDrawer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionalBanner" ADD CONSTRAINT "PromotionalBanner_cartDrawerId_fkey" FOREIGN KEY ("cartDrawerId") REFERENCES "CartDrawer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionalBannerCondition" ADD CONSTRAINT "PromotionalBannerCondition_bannerId_fkey" FOREIGN KEY ("bannerId") REFERENCES "PromotionalBanner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionalBannerImage" ADD CONSTRAINT "PromotionalBannerImage_bannerId_fkey" FOREIGN KEY ("bannerId") REFERENCES "PromotionalBanner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionalBannerCarouselSettings" ADD CONSTRAINT "PromotionalBannerCarouselSettings_bannerId_fkey" FOREIGN KEY ("bannerId") REFERENCES "PromotionalBanner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionalBannerBlockImage" ADD CONSTRAINT "PromotionalBannerBlockImage_blockId_fkey" FOREIGN KEY ("blockId") REFERENCES "PromotionalBannerBlock"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionalBannerBlockCarouselSettings" ADD CONSTRAINT "PromotionalBannerBlockCarouselSettings_blockId_fkey" FOREIGN KEY ("blockId") REFERENCES "PromotionalBannerBlock"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductRecommendation" ADD CONSTRAINT "ProductRecommendation_cartDrawerId_fkey" FOREIGN KEY ("cartDrawerId") REFERENCES "CartDrawer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductRecommendationRule" ADD CONSTRAINT "ProductRecommendationRule_recommendationId_fkey" FOREIGN KEY ("recommendationId") REFERENCES "ProductRecommendation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecommendedProduct" ADD CONSTRAINT "RecommendedProduct_recommendationId_fkey" FOREIGN KEY ("recommendationId") REFERENCES "ProductRecommendation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavingsDisplay" ADD CONSTRAINT "SavingsDisplay_cartDrawerId_fkey" FOREIGN KEY ("cartDrawerId") REFERENCES "CartDrawer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FreeShippingMessage" ADD CONSTRAINT "FreeShippingMessage_cartDrawerId_fkey" FOREIGN KEY ("cartDrawerId") REFERENCES "CartDrawer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartTotals" ADD CONSTRAINT "CartTotals_cartDrawerId_fkey" FOREIGN KEY ("cartDrawerId") REFERENCES "CartDrawer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FBTRule" ADD CONSTRAINT "FBTRule_fbtId_fkey" FOREIGN KEY ("fbtId") REFERENCES "FrequentlyBoughtTogether"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FBTProduct" ADD CONSTRAINT "FBTProduct_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "FBTRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartMilestone" ADD CONSTRAINT "CartMilestone_cartDrawerId_fkey" FOREIGN KEY ("cartDrawerId") REFERENCES "CartDrawer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartMilestoneTarget" ADD CONSTRAINT "CartMilestoneTarget_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "CartMilestone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartMilestoneGiftProduct" ADD CONSTRAINT "CartMilestoneGiftProduct_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "CartMilestone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FreeGift" ADD CONSTRAINT "FreeGift_cartDrawerId_fkey" FOREIGN KEY ("cartDrawerId") REFERENCES "CartDrawer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FreeGiftProduct" ADD CONSTRAINT "FreeGiftProduct_freeGiftId_fkey" FOREIGN KEY ("freeGiftId") REFERENCES "FreeGift"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FreeGiftTarget" ADD CONSTRAINT "FreeGiftTarget_freeGiftId_fkey" FOREIGN KEY ("freeGiftId") REFERENCES "FreeGift"("id") ON DELETE CASCADE ON UPDATE CASCADE;
