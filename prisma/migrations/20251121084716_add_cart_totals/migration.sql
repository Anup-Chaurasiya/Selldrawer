-- AlterTable
ALTER TABLE "CartDrawer" ADD COLUMN     "cartTotalsEnabled" BOOLEAN NOT NULL DEFAULT true;

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

-- CreateIndex
CREATE INDEX "CartTotals_cartDrawerId_idx" ON "CartTotals"("cartDrawerId");

-- CreateIndex
CREATE INDEX "CartTotals_shop_isActive_idx" ON "CartTotals"("shop", "isActive");

-- AddForeignKey
ALTER TABLE "CartTotals" ADD CONSTRAINT "CartTotals_cartDrawerId_fkey" FOREIGN KEY ("cartDrawerId") REFERENCES "CartDrawer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
