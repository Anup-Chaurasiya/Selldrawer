-- AlterTable
ALTER TABLE "BlockMilestone" ADD COLUMN     "eligibleCollectionHandle" TEXT,
ADD COLUMN     "eligibleProductIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "eligibleTag" TEXT,
ADD COLUMN     "upsellHeaderText" TEXT DEFAULT 'Unlock Your Reward',
ADD COLUMN     "viewAllLinkText" TEXT DEFAULT 'View All';
