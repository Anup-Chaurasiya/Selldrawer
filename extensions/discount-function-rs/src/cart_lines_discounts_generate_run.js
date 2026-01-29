import {
  DiscountClass,
  ProductDiscountSelectionStrategy,
} from '../generated/api';

/**
 * FBT (Frequently Bought Together) Discount Function
 * 
 * This function automatically applies discounts to FBT bundle products based on
 * line item properties set when products are added to cart.
 * 
 * Line item properties used:
 * - _fbt_bundle_id: Unique identifier for the bundle
 * - _fbt_discount_type: "PERCENTAGE" or "FIXED"
 * - _fbt_discount_value: The discount amount
 * 
 * @typedef {import("../generated/api").CartInput} RunInput
 * @typedef {import("../generated/api").CartLinesDiscountsGenerateRunResult} CartLinesDiscountsGenerateRunResult
 */

/**
 * @param {RunInput} input
 * @returns {CartLinesDiscountsGenerateRunResult}
 */
export function cartLinesDiscountsGenerateRun(input) {
  // Return early if no cart lines
  if (!input.cart.lines.length) {
    return { operations: [] };
  }

  // Check if product discounts are enabled
  const hasProductDiscountClass = input.discount.discountClasses.includes(
    DiscountClass.Product,
  );

  if (!hasProductDiscountClass) {
    return { operations: [] };
  }

  // Group cart lines by FBT bundle ID
  const bundleGroups = new Map();

  for (const line of input.cart.lines) {
    // Check if this line has an FBT bundle ID
    const bundleId = line.fbtBundleId?.value;

    if (bundleId) {
      if (!bundleGroups.has(bundleId)) {
        bundleGroups.set(bundleId, []);
      }
      bundleGroups.get(bundleId).push(line);
    }
  }

  // If no FBT bundles found, return no discounts
  if (bundleGroups.size === 0) {
    return { operations: [] };
  }

  const productDiscountCandidates = [];

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
        console.warn(`[FBT] Integrity check failed for bundle ${bundleId}: Expected ${expectedBundleSize} items, found ${currentBundleSize}. Discount skipped.`);
        continue;
      }
    }

    // Apply discount to each line in the bundle
    for (const line of bundleLines) {
      let discountCandidate;

      if (discountType === 'PERCENTAGE') {
        discountCandidate = {
          message: `FBT Bundle: ${discountValue}% off`,
          targets: [
            {
              cartLine: {
                id: line.id,
              },
            },
          ],
          value: {
            percentage: {
              value: discountValue,
            },
          },
        };
      } else if (discountType === 'FIXED') {
        discountCandidate = {
          message: `FBT Bundle: $${discountValue} off`,
          targets: [
            {
              cartLine: {
                id: line.id,
              },
            },
          ],
          value: {
            fixedAmount: {
              amount: discountValue,
              appliesToEachItem: true,
            },
          },
        };
      } else {
        // Skip unknown discount types
        continue;
      }

      productDiscountCandidates.push(discountCandidate);
    }
  }

  // Return discounts if any were created
  if (productDiscountCandidates.length === 0) {
    return { operations: [] };
  }

  // Return a single operation with all discount candidates
  // Use 'All' strategy to ensure discounts are applied to all eligible items
  return {
    operations: [
      {
        productDiscountsAdd: {
          candidates: productDiscountCandidates,
          selectionStrategy: ProductDiscountSelectionStrategy.All,
        },
      },
    ],
  };
}