-- CreateTable
CREATE TABLE "AnalyticsEvent" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
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

-- CreateIndex
CREATE INDEX "AnalyticsEvent_shop_createdAt_idx" ON "AnalyticsEvent"("shop", "createdAt");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_shop_component_eventType_idx" ON "AnalyticsEvent"("shop", "component", "eventType");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_shop_productId_idx" ON "AnalyticsEvent"("shop", "productId");
