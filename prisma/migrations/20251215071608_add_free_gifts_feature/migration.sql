-- AlterTable
ALTER TABLE "CartDrawer" ADD COLUMN     "freeGiftsEnabled" BOOLEAN NOT NULL DEFAULT false;

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

-- CreateIndex
CREATE INDEX "FreeGift_shop_idx" ON "FreeGift"("shop");

-- CreateIndex
CREATE INDEX "FreeGift_cartDrawerId_idx" ON "FreeGift"("cartDrawerId");

-- CreateIndex
CREATE INDEX "FreeGiftProduct_freeGiftId_idx" ON "FreeGiftProduct"("freeGiftId");

-- CreateIndex
CREATE INDEX "FreeGiftTarget_freeGiftId_idx" ON "FreeGiftTarget"("freeGiftId");

-- AddForeignKey
ALTER TABLE "FreeGift" ADD CONSTRAINT "FreeGift_cartDrawerId_fkey" FOREIGN KEY ("cartDrawerId") REFERENCES "CartDrawer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FreeGiftProduct" ADD CONSTRAINT "FreeGiftProduct_freeGiftId_fkey" FOREIGN KEY ("freeGiftId") REFERENCES "FreeGift"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FreeGiftTarget" ADD CONSTRAINT "FreeGiftTarget_freeGiftId_fkey" FOREIGN KEY ("freeGiftId") REFERENCES "FreeGift"("id") ON DELETE CASCADE ON UPDATE CASCADE;
