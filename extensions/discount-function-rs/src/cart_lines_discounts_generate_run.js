/**
 * FBT (Frequently Bought Together) Discount Function
 * 
 * This function automaticoducts based on
 * line item properties set when products are added to cart.
 * 
 * Line item properties used:
 * - _fbt_bundle_id: Unique identifier for the bundle
 * - _fbt_discount_type: "PERCENTAGE" or "FIXED"
 * - _fbt_discount_value: The discount amount
 * 
 * @typedef {import("../generated/api").Input} RunInput
 * @typedef {import("../generated/api").FunctionRunResult} FunctionRunResult
 */

/**
 * @param {RunInput} input
 * @returns {FunctionRunResult}
 */
export function run(input) {
  /y if no cart lines
  if (!input.cart.lines.length) {
    return { discounts: [] };
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


  // If no FBT bundles found, return no discounts
  if (bundleGroups.size === 0) {
    return { discounts: [] };
  }

  const discounts = [];

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

  return { discounts };
}
