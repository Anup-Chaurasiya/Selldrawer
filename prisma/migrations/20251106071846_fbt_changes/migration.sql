-- CreateTable
CREATE TABLE "public"."FrequentlyBoughtTogether" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "title" TEXT NOT NULL DEFAULT 'Frequently Bought Together',
    "recommendationType" TEXT NOT NULL DEFAULT 'manual',
    "algorithm" TEXT NOT NULL DEFAULT 'related',
    "useAI" BOOLEAN NOT NULL DEFAULT false,
    "useSmartVariantMatching" BOOLEAN NOT NULL DEFAULT false,
    "showOfferIfInCart" BOOLEAN NOT NULL DEFAULT false,
    "limitUpsellsInCart" BOOLEAN NOT NULL DEFAULT false,
    "maxUpsellsInCart" INTEGER NOT NULL DEFAULT 3,
    "showProductReviews" BOOLEAN NOT NULL DEFAULT false,
    "layout" TEXT NOT NULL DEFAULT 'horizontal',
    "buttonText" TEXT NOT NULL DEFAULT 'Add selected items',
    "buttonColor" TEXT NOT NULL DEFAULT '#000000',
    "buttonTextColor" TEXT NOT NULL DEFAULT '#FFFFFF',
    "showDiscount" BOOLEAN NOT NULL DEFAULT true,
    "showTotalPrice" BOOLEAN NOT NULL DEFAULT true,
    "showIndividualPrices" BOOLEAN NOT NULL DEFAULT true,
    "showCheckboxes" BOOLEAN NOT NULL DEFAULT true,
    "discountType" TEXT NOT NULL DEFAULT 'percentage',
    "discountValue" DECIMAL(65,30),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FrequentlyBoughtTogether_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FBTRule" (
    "id" TEXT NOT NULL,
    "fbtId" TEXT NOT NULL,
    "triggerType" TEXT NOT NULL,
    "triggerValue" TEXT NOT NULL,
    "triggerProductId" TEXT,
    "triggerTitle" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FBTRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FBTProduct" (
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

-- CreateIndex
CREATE UNIQUE INDEX "FrequentlyBoughtTogether_shop_key" ON "public"."FrequentlyBoughtTogether"("shop");

-- CreateIndex
CREATE INDEX "FrequentlyBoughtTogether_shop_isActive_idx" ON "public"."FrequentlyBoughtTogether"("shop", "isActive");

-- CreateIndex
CREATE INDEX "FBTRule_fbtId_idx" ON "public"."FBTRule"("fbtId");

-- CreateIndex
CREATE INDEX "FBTRule_triggerProductId_idx" ON "public"."FBTRule"("triggerProductId");

-- CreateIndex
CREATE INDEX "FBTProduct_ruleId_idx" ON "public"."FBTProduct"("ruleId");

-- CreateIndex
CREATE INDEX "FBTProduct_position_idx" ON "public"."FBTProduct"("position");

-- AddForeignKey
ALTER TABLE "public"."FBTRule" ADD CONSTRAINT "FBTRule_fbtId_fkey" FOREIGN KEY ("fbtId") REFERENCES "public"."FrequentlyBoughtTogether"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FBTProduct" ADD CONSTRAINT "FBTProduct_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "public"."FBTRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
