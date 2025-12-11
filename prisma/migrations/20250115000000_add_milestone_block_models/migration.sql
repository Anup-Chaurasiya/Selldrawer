-- CreateTable
CREATE TABLE "public"."MilestoneBlock" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "milestonesProgressBarColor" TEXT NOT NULL DEFAULT '#3b82f6',
    "milestonesAllUnlockedMessage" TEXT NOT NULL DEFAULT '🎉 Congratulations! All rewards unlocked!',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MilestoneBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BlockMilestone" (
    "id" TEXT NOT NULL,
    "milestoneBlockId" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "targetAmount" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "rewardType" TEXT NOT NULL,
    "rewardValue" DECIMAL(65,30),
    "discountCode" TEXT,
    "shopifyDiscountId" TEXT,
    "targetType" TEXT NOT NULL DEFAULT 'store_wide',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "icon" TEXT,
    "unlockedMessage" TEXT,
    "inProgressMessage" TEXT,
    "lockedMessage" TEXT,
    "iconColor" TEXT NOT NULL DEFAULT '#3b82f6',
    "titleColor" TEXT NOT NULL DEFAULT '#1e40af',
    "amountColor" TEXT NOT NULL DEFAULT '#3b82f6',
    "showProgressBar" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlockMilestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BlockMilestoneTarget" (
    "id" TEXT NOT NULL,
    "milestoneId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "shopifyId" TEXT NOT NULL,
    "title" TEXT,

    CONSTRAINT "BlockMilestoneTarget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BlockMilestoneGiftProduct" (
    "id" TEXT NOT NULL,
    "milestoneId" TEXT NOT NULL,
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

    CONSTRAINT "BlockMilestoneGiftProduct_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MilestoneBlock_shop_key" ON "public"."MilestoneBlock"("shop");

-- CreateIndex
CREATE INDEX "MilestoneBlock_shop_idx" ON "public"."MilestoneBlock"("shop");

-- CreateIndex
CREATE INDEX "MilestoneBlock_shop_isActive_idx" ON "public"."MilestoneBlock"("shop", "isActive");

-- CreateIndex
CREATE INDEX "BlockMilestone_milestoneBlockId_idx" ON "public"."BlockMilestone"("milestoneBlockId");

-- CreateIndex
CREATE INDEX "BlockMilestone_shop_isActive_idx" ON "public"."BlockMilestone"("shop", "isActive");

-- CreateIndex
CREATE INDEX "BlockMilestone_priority_idx" ON "public"."BlockMilestone"("priority");

-- CreateIndex
CREATE INDEX "BlockMilestoneTarget_milestoneId_idx" ON "public"."BlockMilestoneTarget"("milestoneId");

-- CreateIndex
CREATE INDEX "BlockMilestoneTarget_targetType_shopifyId_idx" ON "public"."BlockMilestoneTarget"("targetType", "shopifyId");

-- CreateIndex
CREATE INDEX "BlockMilestoneGiftProduct_milestoneId_idx" ON "public"."BlockMilestoneGiftProduct"("milestoneId");

-- CreateIndex
CREATE INDEX "BlockMilestoneGiftProduct_position_idx" ON "public"."BlockMilestoneGiftProduct"("position");

-- AddForeignKey
ALTER TABLE "public"."BlockMilestone" ADD CONSTRAINT "BlockMilestone_milestoneBlockId_fkey" FOREIGN KEY ("milestoneBlockId") REFERENCES "public"."MilestoneBlock"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BlockMilestoneTarget" ADD CONSTRAINT "BlockMilestoneTarget_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "public"."BlockMilestone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BlockMilestoneGiftProduct" ADD CONSTRAINT "BlockMilestoneGiftProduct_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "public"."BlockMilestone"("id") ON DELETE CASCADE ON UPDATE CASCADE;
