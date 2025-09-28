-- CreateTable
CREATE TABLE "public"."CartConfiguration" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "conditionType" TEXT NOT NULL,
    "conditionOperator" TEXT NOT NULL,
    "conditionValue" DECIMAL(65,30) NOT NULL,
    "actionType" TEXT NOT NULL,
    "actionValue" DECIMAL(65,30),
    "actionMessage" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CartConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CartConfigurationTarget" (
    "id" TEXT NOT NULL,
    "configurationId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "shopifyId" TEXT NOT NULL,
    "title" TEXT,

    CONSTRAINT "CartConfigurationTarget_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CartConfiguration_shop_isActive_idx" ON "public"."CartConfiguration"("shop", "isActive");

-- CreateIndex
CREATE INDEX "CartConfigurationTarget_configurationId_idx" ON "public"."CartConfigurationTarget"("configurationId");

-- CreateIndex
CREATE INDEX "CartConfigurationTarget_targetType_shopifyId_idx" ON "public"."CartConfigurationTarget"("targetType", "shopifyId");

-- AddForeignKey
ALTER TABLE "public"."CartConfigurationTarget" ADD CONSTRAINT "CartConfigurationTarget_configurationId_fkey" FOREIGN KEY ("configurationId") REFERENCES "public"."CartConfiguration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
