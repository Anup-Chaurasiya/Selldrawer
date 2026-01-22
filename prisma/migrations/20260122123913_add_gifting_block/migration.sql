-- CreateTable
CREATE TABLE "GiftingBlock" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GiftingBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlockFreeGift" (
    "id" TEXT NOT NULL,
    "giftingBlockId" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
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

    CONSTRAINT "BlockFreeGift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlockFreeGiftProduct" (
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

    CONSTRAINT "BlockFreeGiftProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlockFreeGiftTarget" (
    "id" TEXT NOT NULL,
    "freeGiftId" TEXT NOT NULL,
    "shopifyId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlockFreeGiftTarget_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GiftingBlock_shop_key" ON "GiftingBlock"("shop");

-- CreateIndex
CREATE INDEX "GiftingBlock_shop_idx" ON "GiftingBlock"("shop");

-- CreateIndex
CREATE INDEX "GiftingBlock_shop_isActive_idx" ON "GiftingBlock"("shop", "isActive");

-- CreateIndex
CREATE INDEX "BlockFreeGift_giftingBlockId_idx" ON "BlockFreeGift"("giftingBlockId");

-- CreateIndex
CREATE INDEX "BlockFreeGift_shop_isActive_idx" ON "BlockFreeGift"("shop", "isActive");

-- CreateIndex
CREATE INDEX "BlockFreeGift_priority_idx" ON "BlockFreeGift"("priority");

-- CreateIndex
CREATE INDEX "BlockFreeGiftProduct_freeGiftId_idx" ON "BlockFreeGiftProduct"("freeGiftId");

-- CreateIndex
CREATE INDEX "BlockFreeGiftProduct_position_idx" ON "BlockFreeGiftProduct"("position");

-- CreateIndex
CREATE INDEX "BlockFreeGiftTarget_freeGiftId_idx" ON "BlockFreeGiftTarget"("freeGiftId");

-- AddForeignKey
ALTER TABLE "BlockFreeGift" ADD CONSTRAINT "BlockFreeGift_giftingBlockId_fkey" FOREIGN KEY ("giftingBlockId") REFERENCES "GiftingBlock"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlockFreeGiftProduct" ADD CONSTRAINT "BlockFreeGiftProduct_freeGiftId_fkey" FOREIGN KEY ("freeGiftId") REFERENCES "BlockFreeGift"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlockFreeGiftTarget" ADD CONSTRAINT "BlockFreeGiftTarget_freeGiftId_fkey" FOREIGN KEY ("freeGiftId") REFERENCES "BlockFreeGift"("id") ON DELETE CASCADE ON UPDATE CASCADE;
