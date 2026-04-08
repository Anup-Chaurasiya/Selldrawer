/**
 * Selldrawer Unified Discount Function
 * 
 * This function automatically applies discounts for:
 * 1. FBT (Frequently Bought Together) bundles
 * 2. Milestone rewards (free gifts, percentage discounts, fixed discounts)
 * 3. Free gift promotions
 * 
 * Line item properties used:
 * 
 * FBT Bundles:
 * - _fbt_bundle_id: Unique identifier for the bundle
 * - _fbt_discount_type: "PERCENTAGE" or "FIXED"
 * - _fbt_discount_value: The discount amount
 * - _fbt_bundle_size: Expected number of items in bundle
 * 
 * Milestones & Free Gifts:
 * - _selldrawer_gift_source: "milestone" or "free_gift"
 * - _selldrawer_discount_type: "PERCENTAGE" or "FIXED" or "FREE"
 * - _selldrawer_discount_value: The discount amount (100 for free items)
 * 
 * @typedef {import("../generated/api").Input} RunInput
 * @typedef {import("../generated/api").FunctionRunResult} FunctionRunResult
 */

/**
 * @param {RunInput} input
 * @returns {FunctionRunResult}
 */
export function run(input) {
  // Early return if no cart lines
  if (!input.cart.lines.length) {
    return { discounts: [] };
  }

  const discounts = [];

  // Process FBT bundles
  const fbtDiscounts = processFBTBundles(input.cart.lines);
  discounts.push(...fbtDiscounts);

  // Process milestone rewards and free gifts
  const giftDiscounts = processGiftDiscounts(input.cart.lines);
  discounts.push(...giftDiscounts);

  return { discounts };
}

/**
 * Process FBT bundle discounts
 */
function processFBTBundles(lines) {
  const discounts = [];
  
  // Group cart lines by FBT bundle ID
  const bundleGroups = new Map();

  for (const line of lines) {
    const bundleId = line.fbtBundleId?.value;

    if (bundleId) {
      if (!bundleGroups.has(bundleId)) {
        bundleGroups.set(bundleId, []);
      }
      bundleGroups.get(bundleId).push(line);
    }
  }

  // Process each bundle
  for (const [bundleId, bundleLines] of bundleGroups) {
    if (bundleLines.length === 0) continue;

    // Get discount configuration from the first line in the bundle
    const firstLine = bundleLines[0];
    const discountType = firstLine.fbtDiscountType?.value;
    const discountValueStr = firstLine.fbtDiscountValue?.value;

    // Skip if no discount configured
    if (!discountType || !discountValueStr) {
      continue;
    }

    const discountValue = parseFloat(discountValueStr);

    // Skip invalid discount values
    if (isNaN(discountValue) || discountValue <= 0) {
      continue;
    }

    // Integrity Check: Ensure all bundle items are present
    const bundleSizeStr = firstLine.fbtBundleSize?.value;
    if (bundleSizeStr) {
      const expectedBundleSize = parseInt(bundleSizeStr, 10);
      const currentBundleSize = bundleLines.length;

      // If items are missing from the bundle, DO NOT apply discount
      if (!isNaN(expectedBundleSize) && currentBundleSize < expectedBundleSize) {
        continue;
      }
    }

    // Apply discount to each line in the bundle
    for (const line of bundleLines) {
      if (discountType === 'PERCENTAGE') {
        discounts.push({
          message: `FBT Bundle: ${discountValue}% off`,
          targets: [
            {
              productVariant: {
                id: line.merchandise.id,
              },
            },
          ],
          value: {
            percentage: {
              value: discountValue.toString(),
            },
          },
        });
      } else if (discountType === 'FIXED') {
        discounts.push({
          message: `FBT Bundle: ${discountValue} off`,
          targets: [
            {
              productVariant: {
                id: line.merchandise.id,
              },
            },
          ],
          value: {
            fixedAmount: {
              amount: discountValue.toString(),
            },
          },
        });
      }
    }
  }

  return discounts;
}

/**
 * Process milestone rewards and free gift discounts
 */
function processGiftDiscounts(lines) {
  const discounts = [];

  for (const line of lines) {
    const giftSource = line.selldrawerGiftSource?.value;
    
    // Skip if not a Selldrawer gift/reward
    if (!giftSource) continue;

    const discountType = line.selldrawerDiscountType?.value;
    const discountValueStr = line.selldrawerDiscountValue?.value;

    // Skip if no discount configured
    if (!discountType || !discountValueStr) {
      continue;
    }

    const discountValue = parseFloat(discountValueStr);

    // Skip invalid discount values
    if (isNaN(discountValue) || discountValue <= 0) {
      continue;
    }

    // Determine message based on source
    let message = '';
    if (giftSource === 'milestone') {
      message = discountValue === 100 ? 'Milestone Reward: Free Gift' : `Milestone Reward: ${discountValue}% off`;
    } else if (giftSource === 'free_gift') {
      message = 'Free Gift Promotion';
    } else {
      message = `Selldrawer Reward: ${discountValue}% off`;
    }

    // Apply discount
    if (discountType === 'PERCENTAGE' || discountType === 'FREE') {
      discounts.push({
        message: message,
        targets: [
          {
            productVariant: {
              id: line.merchandise.id,
            },
          },
        ],
        value: {
          percentage: {
            value: discountValue.toString(),
          },
        },
      });
    } else if (discountType === 'FIXED') {
      discounts.push({
        message: message,
        targets: [
          {
            productVariant: {
              id: line.merchandise.id,
            },
          },
        ],
        value: {
          fixedAmount: {
            amount: discountValue.toString(),
          },
        },
      });
    }
  }

  return discounts;
}
