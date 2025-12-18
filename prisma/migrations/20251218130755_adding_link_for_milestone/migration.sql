-- AlterTable
ALTER TABLE "CartMilestone" ADD COLUMN     "eligibleCollectionHandle" TEXT,
ADD COLUMN     "eligibleProductIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "eligibleTag" TEXT;
