-- AlterTable
ALTER TABLE "public"."CartDrawer" ADD COLUMN "milestonesEnabled" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "public"."CartMilestone" (
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
    "targetType" TEXT NOT NULL DEFAULT 'store_wide',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "icon" TEXT,
    "unlockedMessage" TEXT,
    "inProgressMessage" TEXT,
    "lockedMessage" TEXT,
    "backgroundColor" TEXT NOT NULL DEFAULT '#f0f9ff',
    "textColor" TEXT NOT NULL DEFAULT '#1e40af',
    "progressBarColor" TEXT NOT NULL DEFAULT '#3b82f6',
    "unlockedColor" TEXT NOT NULL DEFAULT '#10b981',
    "lockedColor" TEXT NOT NULL DEFAULT '#9ca3af',
    "showProgressBar" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CartMilestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CartMilestoneTarget" (
    "id" TEXT NOT NULL,
    "milestoneId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "shopifyId" TEXT NOT NULL,
    "title" TEXT,

    CONSTRAINT "CartMilestoneTarget_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CartMilestone_cartDrawerId_idx" ON "public"."CartMilestone"("cartDrawerId");

-- CreateIndex
CREATE INDEX "CartMilestone_shop_isActive_idx" ON "public"."CartMilestone"("shop", "isActive");

-- CreateIndex
CREATE INDEX "CartMilestone_priority_idx" ON "public"."CartMilestone"("priority");

-- CreateIndex
CREATE INDEX "CartMilestoneTarget_milestoneId_idx" ON "public"."CartMilestoneTarget"("milestoneId");

-- CreateIndex
CREATE INDEX "CartMilestoneTarget_targetType_shopifyId_idx" ON "public"."CartMilestoneTarget"("targetType", "shopifyId");

-- AddForeignKey
ALTER TABLE "public"."CartMilestone" ADD CONSTRAINT "CartMilestone_cartDrawerId_fkey" FOREIGN KEY ("cartDrawerId") REFERENCES "public"."CartDrawer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CartMilestoneTarget" ADD CONSTRAINT "CartMilestoneTarget_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "public"."CartMilestone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

