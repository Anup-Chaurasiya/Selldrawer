-- Drop discountCode column from FBTRule table
-- Discounts are now applied via the discount function instead of creating automatic discounts
ALTER TABLE "FBTRule" DROP COLUMN IF EXISTS "discountCode";
