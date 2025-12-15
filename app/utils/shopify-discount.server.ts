/**
 * Automatic Shopify Discount Management Utilities (2025-01)
 * - Creates/updates/deletes Shopify Automatic Discounts for milestones
 * - Uses discountAutomaticFreeShippingCreate, discountAutomaticBasicCreate,
 *   discountAutomaticBxgyCreate and discountAutomaticDelete (API v: 2025-01)
 *
 * Notes:
 * - admin.graphql(...) is expected to return a parsed JSON-like object (not a Fetch Response)
 * - Automatic discounts do not expose a customer-facing code; this API returns IDs only.
 */

type AdminApiContext = {
  graphql: (query: string, options?: { variables?: any }) => Promise<any>;
};

type CreateResult = { discountId: string; code: string } | null;

/**
 * Helper to ensure number -> string with two decimals for money fields
 */
function toAmountString(value: number): string {
  // Keep as string with two decimals. Shopify expects money as string in many fields.
  return value.toFixed(2);
}

/**
 * Convert a variant id (possibly numeric or already gid) to GID form.
 */
function toVariantGid(id: string): string | null {
  if (!id) return null;
  if (id.startsWith("gid://")) return id;
  // If numeric or string id, wrap into ProductVariant GID
  return `gid://shopify/ProductVariant/${id}`;
}

/**
 * Create an automatic free shipping discount
 * - minimumSubtotal: number (threshold in shop's currency, e.g. 2000.00)
 */
async function createFreeShippingAutomatic(
  admin: AdminApiContext,
  title: string,
  minimumSubtotal: number
): Promise<CreateResult> {
  const mutation = `
    mutation discountAutomaticFreeShippingCreate($input: DiscountAutomaticFreeShippingInput!) {
      discountAutomaticFreeShippingCreate(freeShippingAutomaticDiscount: $input) {
        automaticDiscountNode {
          id
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = {
    input: {
      title,
      startsAt: new Date().toISOString(),      
      // Minimum requirement so Shopify only activates when subtotal >= minimumSubtotal
      minimumRequirement: {
        subtotal: {
          greaterThanOrEqualToSubtotal: toAmountString(minimumSubtotal)
        }
      },
      combinesWith: {
        orderDiscounts: true,
        productDiscounts: true
      },
    }
  };

  try {
    const res = await admin.graphql(mutation, { variables });
    // Try to print readable body (if any)
    
    const payloadData = await res.json();
    const payload = payloadData?.data?.discountAutomaticFreeShippingCreate ?? payloadData?.discountAutomaticFreeShippingCreate ?? null;

    if (!payload) {
      console.error("createFreeShippingAutomatic: invalid response", JSON.stringify(res, null, 2));
      return null;
    }

    if (payload.userErrors && payload.userErrors.length) {
      console.error("createFreeShippingAutomatic userErrors:", JSON.stringify(payload.userErrors, null, 2));
      return null;
    }

    const id = payload.automaticDiscountNode?.id;
    if (!id) {
      console.error("createFreeShippingAutomatic: no automaticDiscount.id returned", JSON.stringify(payload, null, 2));
      return null;
    }

    return { discountId: id, code: "" };
  } catch (err) {
    console.error("Exception in createFreeShippingAutomatic:", err);
    return null;
  }
}

/**
 * Create an automatic basic discount (percentage or fixed)
 * - type: "percentage" | "fixed"
 * - value: for percentage -> pass 5 for 5% ; for fixed -> pass 200 for ₹200
 * - minimumSubtotal: threshold amount
 *
 * Applies to all items in cart (global).
 */
async function createBasicAutomatic(
  admin: AdminApiContext,
  title: string,
  type: "percentage" | "fixed",
  value: number,
  minimumSubtotal: number
): Promise<CreateResult> {
  const mutation = `
    mutation discountAutomaticBasicCreate($input: DiscountAutomaticBasicInput!) {
      discountAutomaticBasicCreate(automaticBasicDiscount: $input) {
        automaticDiscountNode {
          id
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  // customerGets configuration differs for percentage vs fixed
  const customerGets =
    type === "percentage"
      ? {
          items: {
            all: true
          },
          value: {
            percentage: value / 100.0 // Shopify expects decimal? using API examples, pass decimal here
          },
        }
      : {
          items: {
            all: true
          },
          value: {
            // discountAmount needs string amount
            discountAmount: {
              amount: toAmountString(value),
              appliesOnEachItem: false
            }
          },
        };

  const variables = {
    input: {
      title,
      startsAt: new Date().toISOString(),
      minimumRequirement: {
        subtotal: {
          greaterThanOrEqualToSubtotal: toAmountString(minimumSubtotal)
        }
      },
      customerGets,
      combinesWith: {
        shippingDiscounts: true
      }
    }
  };

  try {
    const res = await admin.graphql(mutation, { variables });
    const payloadData = await res.json();
    const payload = payloadData?.data?.discountAutomaticBasicCreate ?? payloadData?.discountAutomaticBasicCreate ?? null;

    if (!payload) {
      console.error("createBasicAutomatic: invalid response", JSON.stringify(res, null, 2));
      return null;
    }

    if (payload.userErrors && payload.userErrors.length) {
      console.error("createBasicAutomatic userErrors:", JSON.stringify(payload.userErrors, null, 2));
      return null;
    }

    const id = payload.automaticDiscountNode?.id;
    if (!id) {
      console.error("createBasicAutomatic: no automaticDiscount.id returned", JSON.stringify(payload, null, 2));
      return null;
    }

    return { discountId: id, code: "" };
  } catch (err) {
    console.error("Exception in createBasicAutomatic:", err);
    return null;
  }
}

/**
 * Get or create a dynamic collection with price > 0 condition
 * This collection can be used in discount APIs where "all items" is not supported
 */
async function getOrCreateAllProductsCollection(
  admin: AdminApiContext
): Promise<string | null> {
  const collectionTitle = "Upsellity - All Products (Price > 0)";
  const collectionHandle = "upsellity-all-products-price-greater-than-0";

  // First, try to find existing collection by handle
  const findQuery = `
    query findCollection($handle: String!) {
      collectionByHandle(handle: $handle) {
        id
      }
    }
  `;

  try {
    const findRes = await admin.graphql(findQuery, { variables: { handle: collectionHandle } });
    const findData = await findRes.json();
    const existingCollection = findData?.data?.collectionByHandle;

    if (existingCollection?.id) {
      return existingCollection.id;
    }
  } catch (err) {
    console.warn("getOrCreateAllProductsCollection: error finding collection, will create new one", err);
  }

  // Collection doesn't exist, create it
  const createMutation = `
    mutation collectionCreate($input: CollectionInput!) {
      collectionCreate(input: $input) {
        collection {
          id
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const createVariables = {
    input: {
      title: collectionTitle,
      handle: collectionHandle,
      ruleSet: {
        appliedDisjunctively: false,
        rules: [
          {
            column: "VARIANT_PRICE",
            relation: "GREATER_THAN",
            condition: "0"
          }
        ]
      }
    }
  };

  try {
    const createRes = await admin.graphql(createMutation, { variables: createVariables });
    const createData = await createRes.json();
    const payload = createData?.data?.collectionCreate ?? createData?.collectionCreate ?? null;

    if (!payload) {
      console.error("getOrCreateAllProductsCollection: invalid response", JSON.stringify(createRes, null, 2));
      return null;
    }

    if (payload.userErrors && payload.userErrors.length) {
      console.error("getOrCreateAllProductsCollection userErrors:", JSON.stringify(payload.userErrors, null, 2));
      return null;
    }

    const collectionId = payload.collection?.id;
    if (!collectionId) {
      console.error("getOrCreateAllProductsCollection: no collection.id returned", JSON.stringify(payload, null, 2));
      return null;
    }

    return collectionId;
  } catch (err) {
    console.error("Exception in getOrCreateAllProductsCollection:", err);
    return null;
  }
}

/**
 * Create an automatic BXGY discount (used for free-gift milestone)
 * - giftVariantIds: array of variant IDs (string numeric or gid) that should be given as 100% off when threshold is met
 * - minimumSubtotal: threshold value
 *
 * Implements a "customerGets" where entitled items are the gift variants with 100% off.
 */
async function createBxgyAutomatic(
  admin: AdminApiContext,
  title: string,
  giftVariantIds: string[],
  minimumSubtotal: number
): Promise<CreateResult> {
  const mutation = `
    mutation discountAutomaticBxgyCreate($input: DiscountAutomaticBxgyInput!) {
      discountAutomaticBxgyCreate(automaticBxgyDiscount: $input) {
        automaticDiscountNode {
          id
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  // Format variants into GIDs and filter invalid
  const formattedVariants = giftVariantIds
    .map(v => toVariantGid(v))
    .filter((v): v is string => !!v);

  if (formattedVariants.length === 0) {
    console.error("createBxgyAutomatic: no valid variant IDs provided", giftVariantIds);
    return null;
  }

  // Get or create a collection with price > 0 condition to use in customerBuys
  // This is required because "all: true" is not supported in customerBuys.items
  const allProductsCollectionId = await getOrCreateAllProductsCollection(admin);
  if (!allProductsCollectionId) {
    console.error("createBxgyAutomatic: failed to get or create all products collection");
    return null;
  }

  // For BXGY automatic discounts, we can set customerGets to grant entitled product variants with 100% off.
  // Input shape varies across API versions but we provide the expected structure for 2025-01.
  const variables = {
    input: {
      title,
      startsAt: new Date().toISOString(),
      customerBuys: {
        items: {
          collections: {
            add: [allProductsCollectionId]
          }
        },
        value: {
          amount: toAmountString(minimumSubtotal)
        }
      },
      customerGets: {
        items: {
          products: {
            productVariantsToAdd: formattedVariants
          }
        },
        value: {
          discountOnQuantity:{
            effect: {
              percentage: 1.0
            },
            quantity: "1"
          }
        }
      },
      combinesWith: {
        shippingDiscounts: true,
        orderDiscounts: true,
        productDiscounts: true
      }
    }
  };

  try {
    const res = await admin.graphql(mutation, { variables });
    const payloadData = await res.json();
    const payload = payloadData?.data?.discountAutomaticBxgyCreate ?? payloadData?.discountAutomaticBxgyCreate ?? null;

    if (!payload) {
      console.error("createBxgyAutomatic: invalid response", JSON.stringify(res, null, 2));
      return null;
    }

    if (payload.userErrors && payload.userErrors.length) {
      console.error("createBxgyAutomatic userErrors:", JSON.stringify(payload.userErrors, null  , 2));
      return null;
    }

    return { discountId: payload.automaticDiscountNode?.id, code: "" };
  } catch (err) {
    console.error("Exception in createBxgyAutomatic:", err);
    return null;
  }
}

/**
 * Delete an automatic discount by ID
 */
export async function deleteShopifyDiscount(
  admin: AdminApiContext,
  discountId: string
): Promise<boolean> {
  const mutation = `
    mutation discountAutomaticDelete($id: ID!) {
      discountAutomaticDelete(id: $id) {
        deletedAutomaticDiscountId
        userErrors {
          field
          message
        }
      }
    }
  `;

  try {
    const res = await admin.graphql(mutation, { variables: { id: discountId } });
    const payload = res?.data?.discountAutomaticDelete ?? res?.discountAutomaticDelete ?? null;

    if (!payload) {
      console.error("deleteShopifyDiscount: invalid response", JSON.stringify(res, null, 2));
      return false;
    }

    if (payload.userErrors && payload.userErrors.length) {
      console.error("deleteShopifyDiscount userErrors:", JSON.stringify(payload.userErrors, null, 2));
      return false;
    }

    return !!payload.deletedDiscountId;
  } catch (err) {
    console.error("Exception in deleteShopifyDiscount:", err);
    return false;
  }
}

/**
 * Main factory: create an automatic discount based on milestone configuration
 * - rewardType: "free_shipping" | "discount_percentage" | "discount_fixed" | "gift_wrapping"
 * - rewardValue: for discount types (percentage -> number 5 = 5%; fixed -> amount)
 * - giftProducts: array of { shopifyVariantId?: string | null }
 *
 * Returns { discountId, code } where code is empty string for automatic discounts.
 */
export async function createMilestoneDiscount(
  admin: AdminApiContext,
  milestone: {
    title: string;
    rewardType: string;
    rewardValue?: number | null;
    giftProducts?: Array<{ shopifyVariantId?: string | null }>;
    minimumSubtotal?: number; // threshold, if not provided default to 0
  }
): Promise<{ discountId: string; code: string } | null> {
  try {
    const title = `Milestone: ${milestone.title}`;
    const minSubtotal = milestone.minimumSubtotal ?? 0;

    switch (milestone.rewardType) {
      case "free_shipping":
        return await createFreeShippingAutomatic(admin, title, minSubtotal);

      case "discount_percentage":
        if (typeof milestone.rewardValue !== "number") {
          console.error("createMilestoneDiscount: percentage discount requires rewardValue (number)");
          return null;
        }
        // rewardValue is percent (e.g., 5 means 5%)
        return await createBasicAutomatic(admin, title, "percentage", milestone.rewardValue, minSubtotal);

      case "discount_fixed":
        if (typeof milestone.rewardValue !== "number") {
          console.error("createMilestoneDiscount: fixed discount requires rewardValue (number)");
          return null;
        }
        return await createBasicAutomatic(admin, title, "fixed", milestone.rewardValue, minSubtotal);

      case "gift_wrapping":
        // convert giftProducts to variant ids
        const variantIds = (milestone.giftProducts ?? [])
          .map(p => p.shopifyVariantId)
          .filter((v): v is string => !!v);

        if (variantIds.length === 0) {
          console.error("createMilestoneDiscount: gift_wrapping requires at least one variant id");
          return null;
        }

        return await createBxgyAutomatic(admin, title, variantIds, minSubtotal);

      default:
        console.error("createMilestoneDiscount: unknown reward type:", milestone.rewardType);
        return null;
    }
  } catch (err) {
    console.error("Exception in createMilestoneDiscount:", err);
    return null;
  }
}

/**
 * Update a milestone automatic discount:
 * - If oldDiscountId is provided, attempt to delete it first (best-effort)
 * - Then create a new automatic discount per new milestone config
 */
export async function updateMilestoneDiscount(
  admin: AdminApiContext,
  oldDiscountId: string | null,
  milestone: {
    title: string;
    rewardType: string;
    rewardValue?: number | null;
    giftProducts?: Array<{ shopifyVariantId?: string | null }>;
    minimumSubtotal?: number;
  }
): Promise<{ discountId: string; code: string } | null> {
  try {
    if (oldDiscountId) {
      // best-effort delete; log but continue
      const deleted = await deleteShopifyDiscount(admin, oldDiscountId);
      if (!deleted) {
        console.warn(`updateMilestoneDiscount: failed to delete old discount ${oldDiscountId} (continuing)`);
      }
    }

    const created = await createMilestoneDiscount(admin, milestone);
    if (!created) {
      console.error("updateMilestoneDiscount: failed to create updated discount");
      return null;
    }
    return created;
  } catch (err) {
    console.error("Exception in updateMilestoneDiscount:", err);
    return null;
  }
}
