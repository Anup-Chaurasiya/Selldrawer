-- CreateTable
CREATE TABLE "NudgeAddTogether" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "title" TEXT NOT NULL DEFAULT 'Complete your purchase',
    "subtitle" TEXT NOT NULL DEFAULT 'Add these products together',
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
    "addSelectedButtonText" TEXT NOT NULL DEFAULT 'Add Selected to Cart',
    "addSelectedButtonColor" TEXT NOT NULL DEFAULT '#4F46E5',
    "addSelectedButtonTextColor" TEXT NOT NULL DEFAULT '#FFFFFF',
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

    CONSTRAINT "NudgeAddTogether_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NudgeAddTogetherRule" (
    "id" TEXT NOT NULL,
    "nudgeAddTogetherId" TEXT NOT NULL,
    "triggerType" TEXT NOT NULL,
    "triggerValue" TEXT NOT NULL,
    "triggerProductId" TEXT,
    "triggerTitle" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NudgeAddTogetherRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NudgeAddTogetherProduct" (
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

    CONSTRAINT "NudgeAddTogetherProduct_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NudgeAddTogether_shop_key" ON "NudgeAddTogether"("shop");

-- CreateIndex
CREATE INDEX "NudgeAddTogether_shop_isActive_idx" ON "NudgeAddTogether"("shop", "isActive");

-- CreateIndex
CREATE INDEX "NudgeAddTogetherRule_nudgeAddTogetherId_idx" ON "NudgeAddTogetherRule"("nudgeAddTogetherId");

-- CreateIndex
CREATE INDEX "NudgeAddTogetherRule_triggerProductId_idx" ON "NudgeAddTogetherRule"("triggerProductId");

-- CreateIndex
CREATE INDEX "NudgeAddTogetherProduct_ruleId_idx" ON "NudgeAddTogetherProduct"("ruleId");

-- CreateIndex
CREATE INDEX "NudgeAddTogetherProduct_position_idx" ON "NudgeAddTogetherProduct"("position");

-- AddForeignKey
ALTER TABLE "NudgeAddTogetherRule" ADD CONSTRAINT "NudgeAddTogetherRule_nudgeAddTogetherId_fkey" FOREIGN KEY ("nudgeAddTogetherId") REFERENCES "NudgeAddTogether"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NudgeAddTogetherProduct" ADD CONSTRAINT "NudgeAddTogetherProduct_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "NudgeAddTogetherRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
