-- AlterTable
ALTER TABLE "CartMilestone" ADD COLUMN     "backgroundColor" TEXT NOT NULL DEFAULT '#f8fafc';

-- AlterTable
ALTER TABLE "RecommendedProduct" ADD COLUMN     "options" JSONB,
ADD COLUMN     "variants" JSONB;
