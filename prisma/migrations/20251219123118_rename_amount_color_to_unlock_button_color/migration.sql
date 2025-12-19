/*
  Warnings:

  - You are about to drop the column `amountColor` on the `BlockMilestone` table. All the data in the column will be lost.
  - You are about to drop the column `amountColor` on the `CartMilestone` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "BlockMilestone" DROP COLUMN "amountColor",
ADD COLUMN     "unlockButtonColor" TEXT NOT NULL DEFAULT '#3b82f6';

-- AlterTable
ALTER TABLE "CartMilestone" DROP COLUMN "amountColor",
ADD COLUMN     "unlockButtonColor" TEXT NOT NULL DEFAULT '#3b82f6';
