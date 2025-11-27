-- CreateTable
CREATE TABLE "CartMilestoneGiftProduct" (
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

    CONSTRAINT "CartMilestoneGiftProduct_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CartMilestoneGiftProduct_milestoneId_idx" ON "CartMilestoneGiftProduct"("milestoneId");

-- CreateIndex
CREATE INDEX "CartMilestoneGiftProduct_position_idx" ON "CartMilestoneGiftProduct"("position");

-- AddForeignKey
ALTER TABLE "CartMilestoneGiftProduct" ADD CONSTRAINT "CartMilestoneGiftProduct_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "CartMilestone"("id") ON DELETE CASCADE ON UPDATE CASCADE;
