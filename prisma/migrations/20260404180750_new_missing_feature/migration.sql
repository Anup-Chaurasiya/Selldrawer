-- AlterTable
ALTER TABLE "CartDrawer" ADD COLUMN     "acceleratedCheckoutEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "countdownTimerEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "deliveryEstimatesEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "deliveryEstimatesText" TEXT NOT NULL DEFAULT 'Estimated delivery: {date}',
ADD COLUMN     "orderNoteEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "orderNotePlaceholder" TEXT NOT NULL DEFAULT 'Add a note to your order...',
ADD COLUMN     "processingDaysMax" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN     "processingDaysMin" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "shippingProtectionEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "shippingProtectionPrice" DECIMAL(65,30),
ADD COLUMN     "shippingProtectionProductId" TEXT,
ADD COLUMN     "termsConditionsEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "termsConditionsText" TEXT NOT NULL DEFAULT 'I agree to the Terms & Conditions',
ADD COLUMN     "transitDaysMax" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "transitDaysMin" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "trustBadgesEnabled" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "TrustBadge" (
    "id" TEXT NOT NULL,
    "cartDrawerId" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "title" TEXT NOT NULL DEFAULT 'Secure Checkout',
    "alignment" TEXT NOT NULL DEFAULT 'center',
    "imageUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "paymentIcons" TEXT[] DEFAULT ARRAY['visa', 'master', 'amex', 'paypal']::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrustBadge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CountdownTimer" (
    "id" TEXT NOT NULL,
    "cartDrawerId" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "durationMinutes" INTEGER NOT NULL DEFAULT 15,
    "messageText" TEXT NOT NULL DEFAULT 'Your reserves expire in {time}',
    "backgroundColor" TEXT NOT NULL DEFAULT '#FEF2F2',
    "textColor" TEXT NOT NULL DEFAULT '#991B1B',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CountdownTimer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcceleratedCheckout" (
    "id" TEXT NOT NULL,
    "cartDrawerId" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcceleratedCheckout_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TrustBadge_cartDrawerId_idx" ON "TrustBadge"("cartDrawerId");

-- CreateIndex
CREATE INDEX "TrustBadge_shop_isActive_idx" ON "TrustBadge"("shop", "isActive");

-- CreateIndex
CREATE INDEX "CountdownTimer_cartDrawerId_idx" ON "CountdownTimer"("cartDrawerId");

-- CreateIndex
CREATE INDEX "CountdownTimer_shop_isActive_idx" ON "CountdownTimer"("shop", "isActive");

-- CreateIndex
CREATE INDEX "AcceleratedCheckout_cartDrawerId_idx" ON "AcceleratedCheckout"("cartDrawerId");

-- CreateIndex
CREATE INDEX "AcceleratedCheckout_shop_isActive_idx" ON "AcceleratedCheckout"("shop", "isActive");

-- AddForeignKey
ALTER TABLE "TrustBadge" ADD CONSTRAINT "TrustBadge_cartDrawerId_fkey" FOREIGN KEY ("cartDrawerId") REFERENCES "CartDrawer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CountdownTimer" ADD CONSTRAINT "CountdownTimer_cartDrawerId_fkey" FOREIGN KEY ("cartDrawerId") REFERENCES "CartDrawer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcceleratedCheckout" ADD CONSTRAINT "AcceleratedCheckout_cartDrawerId_fkey" FOREIGN KEY ("cartDrawerId") REFERENCES "CartDrawer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
