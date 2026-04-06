/*
  Warnings:

  - You are about to drop the column `backgroundColor` on the `CartMilestone` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "CartDrawer" ADD COLUMN     "milestonesBackgroundColor" TEXT NOT NULL DEFAULT '#ffffff';

-- AlterTable
ALTER TABLE "CartMilestone" DROP COLUMN "backgroundColor";
