-- CreateTable
CREATE TABLE "CartDrawerVersion" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "rolloutPercentage" INTEGER NOT NULL DEFAULT 0,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CartDrawerVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShopCartDrawerVersionAssignment" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopCartDrawerVersionAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CartDrawerVersion_key_key" ON "CartDrawerVersion"("key");

-- CreateIndex
CREATE INDEX "CartDrawerVersion_isActive_idx" ON "CartDrawerVersion"("isActive");

-- CreateIndex
CREATE INDEX "CartDrawerVersion_isDefault_idx" ON "CartDrawerVersion"("isDefault");

-- CreateIndex
CREATE INDEX "CartDrawerVersion_key_idx" ON "CartDrawerVersion"("key");

-- CreateIndex
CREATE UNIQUE INDEX "ShopCartDrawerVersionAssignment_shop_key" ON "ShopCartDrawerVersionAssignment"("shop");

-- CreateIndex
CREATE INDEX "ShopCartDrawerVersionAssignment_shop_idx" ON "ShopCartDrawerVersionAssignment"("shop");

-- CreateIndex
CREATE INDEX "ShopCartDrawerVersionAssignment_versionId_idx" ON "ShopCartDrawerVersionAssignment"("versionId");

-- AddForeignKey
ALTER TABLE "ShopCartDrawerVersionAssignment" ADD CONSTRAINT "ShopCartDrawerVersionAssignment_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "CartDrawerVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
