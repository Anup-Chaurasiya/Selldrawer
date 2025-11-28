-- AlterTable: Add allUnlockedMessage to CartDrawer
ALTER TABLE "CartDrawer" ADD COLUMN "milestonesAllUnlockedMessage" TEXT NOT NULL DEFAULT '🎉 Congratulations! All rewards unlocked!';

-- AlterTable: Refactor CartMilestone colors
-- Remove old color fields and add new ones
ALTER TABLE "CartMilestone" DROP COLUMN "backgroundColor";
ALTER TABLE "CartMilestone" DROP COLUMN "textColor";
ALTER TABLE "CartMilestone" DROP COLUMN "progressBarColor";
ALTER TABLE "CartMilestone" DROP COLUMN "unlockedColor";
ALTER TABLE "CartMilestone" DROP COLUMN "lockedColor";

-- Add new color fields
ALTER TABLE "CartMilestone" ADD COLUMN "iconColor" TEXT NOT NULL DEFAULT '#3b82f6';
ALTER TABLE "CartMilestone" ADD COLUMN "titleColor" TEXT NOT NULL DEFAULT '#1e40af';
ALTER TABLE "CartMilestone" ADD COLUMN "amountColor" TEXT NOT NULL DEFAULT '#3b82f6';


