-- AlterTable
ALTER TABLE "BlockMilestone" ADD COLUMN     "eligibilitySource" TEXT DEFAULT 'none';

-- AlterTable
ALTER TABLE "CartMilestone" ADD COLUMN     "eligibilitySource" TEXT DEFAULT 'none';
