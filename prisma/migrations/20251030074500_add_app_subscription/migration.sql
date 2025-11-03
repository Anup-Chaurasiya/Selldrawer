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

-- CreateIndex
CREATE UNIQUE INDEX "AppSubscription_shop_key" ON "AppSubscription"("shop");

-- CreateIndex
CREATE INDEX "AppSubscription_shop_idx" ON "AppSubscription"("shop");

-- CreateIndex
CREATE INDEX "AppSubscription_status_idx" ON "AppSubscription"("status");

