-- CreateTable
CREATE TABLE "public"."NudgePopup" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "title" TEXT NOT NULL DEFAULT 'You might also like',
    "subtitle" TEXT NOT NULL DEFAULT 'Select a product to replace your choice',
    "recommendationType" TEXT NOT NULL DEFAULT 'manual',
    "algorithm" TEXT NOT NULL DEFAULT 'related',
    "useAI" BOOLEAN NOT NULL DEFAULT false,
    "showOnAddToCart" BOOLEAN NOT NULL DEFAULT true,
    "popupDelay" INTEGER NOT NULL DEFAULT 0,
    "overlayColor" TEXT NOT NULL DEFAULT '#000000',
    "overlayOpacity" INTEGER NOT NULL DEFAULT 50,
    "popupBackgroundColor" TEXT NOT NULL DEFAULT '#FFFFFF',
    "popupBorderRadius" INTEGER NOT NULL DEFAULT 8,
    "titleColor" TEXT NOT NULL DEFAULT '#000000',
    "subtitleColor" TEXT NOT NULL DEFAULT '#666666',
    "continueButtonText" TEXT NOT NULL DEFAULT 'Continue with original',
    "continueButtonColor" TEXT NOT NULL DEFAULT '#000000',
    "continueButtonTextColor" TEXT NOT NULL DEFAULT '#FFFFFF',
    "selectButtonText" TEXT NOT NULL DEFAULT 'Select this product',
    "selectButtonColor" TEXT NOT NULL DEFAULT '#4F46E5',
    "selectButtonTextColor" TEXT NOT NULL DEFAULT '#FFFFFF',
    "closeButtonColor" TEXT NOT NULL DEFAULT '#999999',
    "showProductImage" BOOLEAN NOT NULL DEFAULT true,
    "showProductPrice" BOOLEAN NOT NULL DEFAULT true,
    "showProductComparePrice" BOOLEAN NOT NULL DEFAULT true,
    "showProductDescription" BOOLEAN NOT NULL DEFAULT false,
    "maxProducts" INTEGER NOT NULL DEFAULT 4,
    "layout" TEXT NOT NULL DEFAULT 'grid',
    "enableAnimation" BOOLEAN NOT NULL DEFAULT true,
    "animationType" TEXT NOT NULL DEFAULT 'fade',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NudgePopup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."NudgeRule" (
    "id" TEXT NOT NULL,
    "nudgeId" TEXT NOT NULL,
    "triggerType" TEXT NOT NULL,
    "triggerValue" TEXT NOT NULL,
    "triggerProductId" TEXT,
    "triggerTitle" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NudgeRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."NudgeProduct" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "shopifyProductId" TEXT NOT NULL,
    "shopifyVariantId" TEXT,
    "title" TEXT NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "compareAtPrice" DECIMAL(65,30),
    "imageUrl" TEXT,
    "handle" TEXT NOT NULL,
    "description" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NudgeProduct_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NudgePopup_shop_key" ON "public"."NudgePopup"("shop");

-- CreateIndex
CREATE INDEX "NudgePopup_shop_isActive_idx" ON "public"."NudgePopup"("shop", "isActive");

-- CreateIndex
CREATE INDEX "NudgeRule_nudgeId_idx" ON "public"."NudgeRule"("nudgeId");

-- CreateIndex
CREATE INDEX "NudgeRule_triggerProductId_idx" ON "public"."NudgeRule"("triggerProductId");

-- CreateIndex
CREATE INDEX "NudgeProduct_ruleId_idx" ON "public"."NudgeProduct"("ruleId");

-- CreateIndex
CREATE INDEX "NudgeProduct_position_idx" ON "public"."NudgeProduct"("position");

-- AddForeignKey
ALTER TABLE "public"."NudgeRule" ADD CONSTRAINT "NudgeRule_nudgeId_fkey" FOREIGN KEY ("nudgeId") REFERENCES "public"."NudgePopup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."NudgeProduct" ADD CONSTRAINT "NudgeProduct_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "public"."NudgeRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
