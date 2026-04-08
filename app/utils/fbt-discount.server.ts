/**
 * FBT Discount Management using Shopify Discount Functions
 *
 * Uses the `discountAutomaticAppCreate` mutation to create a single
 * "Selldrawer Automatic Discounts" node tied to our deployed function.
 * The function itself (cart_lines_discounts_generate_run.js) reads
 * line item attributes to compute the actual discounts at checkout.
 */

type AdminApiContext = {
  graphql: (query: string, options?: { variables?: any }) => Promise<any>;
};

/**
 * Safe wrapper for admin.graphql() calls.
 *
 * The Shopify graphql client can THROW (instead of returning errors in the
 * response body) when there are GraphQL errors. This wrapper catches both
 * cases, logs the actual error content, and returns null on failure.
 */
async function safeGraphql(
  admin: AdminApiContext,
  query: string,
  options?: { variables?: any },
  label = "safeGraphql"
): Promise<any | null> {
  try {
    const res = await admin.graphql(query, options);
    const data = await res.json();

    // Response-body errors (some API versions return errors in the JSON body)
    if (data?.errors?.length > 0) {
      console.error(`[${label}] GraphQL body errors:`, JSON.stringify(data.errors, null, 2));
      return null;
    }

    return data;
  } catch (err: any) {
    // Thrown errors (newer Shopify client versions throw on GraphQL errors)
    const gqlErrors = err?.graphQLErrors ?? err?.errors;
    if (gqlErrors) {
      console.error(`[${label}] Caught graphQLErrors:`, JSON.stringify(gqlErrors, null, 2));
    } else {
      console.error(`[${label}] Unexpected exception:`, err?.message ?? String(err));
    }
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get the Shopify Function ID for the FBT discount function.
 *
 * Queries `shopifyFunctions` (requires API v2025-04+) to find the deployed
 * "Frequently Bought Together Discount" function for this app.
 */
export async function getFBTFunctionId(admin: AdminApiContext): Promise<string | null> {
  const data = await safeGraphql(
    admin,
    `query getFBTFunction {
      shopifyFunctions(first: 25) {
        nodes {
          id
          apiType
          title
        }
      }
    }`,
    undefined,
    "getFBTFunctionId"
  );

  if (!data) return null;

  const functions: Array<{ id: string; apiType: string; title: string }> =
    data?.data?.shopifyFunctions?.nodes ?? [];

  console.log(
    "[getFBTFunctionId] Available functions:",
    functions.map((f) => `${f.title} (${f.id}, apiType=${f.apiType})`)
  );

  if (functions.length === 0) {
    console.error("[getFBTFunctionId] No ShopifyFunctions found. Is the app deployed?");
    return null;
  }

  // Priority 1: match by title
  const byTitle = functions.find(
    (fn) =>
      fn.title?.toLowerCase().includes("fbt") ||
      fn.title?.toLowerCase().includes("frequently bought") ||
      fn.title?.toLowerCase().includes("discount")
  );
  if (byTitle) {
    console.log("[getFBTFunctionId] Matched by title →", byTitle.id, byTitle.title);
    return byTitle.id;
  }

  // Priority 2: match by apiType
  const byApiType = functions.find((fn) =>
    fn.apiType?.toLowerCase().includes("discount")
  );
  if (byApiType) {
    console.log("[getFBTFunctionId] Matched by apiType →", byApiType.id, byApiType.apiType);
    return byApiType.id;
  }

  // Priority 3: first available function
  console.warn("[getFBTFunctionId] Using first available function →", functions[0].id);
  return functions[0].id;
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a "Selldrawer Automatic Discounts" automatic app discount node.
 *
 * This discount node is backed by the deployed `fbt-discount` Shopify Function.
 * The function reads line item attributes to decide which discounts to apply.
 *
 * Returns the discountId (GID) on success, or null on failure.
 */
export async function createFBTFunctionDiscount(
  admin: AdminApiContext,
  shop: string
): Promise<string | null> {
  // 1. Resolve function ID
  const functionId = await getFBTFunctionId(admin);
  if (!functionId) {
    console.error("[createFBTFunctionDiscount] Could not resolve functionId.");
    return null;
  }

  const discountTitle = "Selldrawer Automatic Discounts";

  // 2. Check if the discount already exists (avoid duplicates)
  const checkData = await safeGraphql(
    admin,
    `query checkExistingDiscount {
      discountNodes(first: 50) {
        nodes {
          id
          discount {
            ... on DiscountAutomaticApp {
              title
              discountId
            }
          }
        }
      }
    }`,
    undefined,
    "createFBTFunctionDiscount/check"
  );

  if (checkData?.data?.discountNodes?.nodes) {
    const nodes = checkData.data.discountNodes.nodes;
    console.log("[createFBTFunctionDiscount] Checking existing discounts:", 
      nodes.map((n: any) => n.discount?.title || 'untitled'));
    
    const existingNode = nodes.find(
      (node: any) => node.discount?.title === discountTitle
    );

    if (existingNode) {
      const discountId = existingNode.discount?.discountId || existingNode.id;
      console.log("[createFBTFunctionDiscount] Discount already exists, returning id:", discountId);
      return discountId;
    }
  }

  // 3. Create the discount node
  console.log(
    "[createFBTFunctionDiscount] Creating discount for shop:", shop,
    "with functionId:", functionId
  );

  const mutationData = await safeGraphql(
    admin,
    `mutation discountAutomaticAppCreate($automaticAppDiscount: DiscountAutomaticAppInput!) {
      discountAutomaticAppCreate(automaticAppDiscount: $automaticAppDiscount) {
        automaticAppDiscount {
          discountId
          title
        }
        userErrors {
          field
          message
          code
        }
      }
    }`,
    {
      variables: {
        automaticAppDiscount: {
          title: discountTitle,
          functionId,
          startsAt: new Date().toISOString(),
          // Required when the function uses the 'discounts' API type
          discountClasses: ["PRODUCT"],
          combinesWith: {
            orderDiscounts: false,
            productDiscounts: false,
            shippingDiscounts: false,
          },
        },
      },
    },
    "createFBTFunctionDiscount/mutation"
  );

  if (!mutationData) return null;

  const payload = mutationData?.data?.discountAutomaticAppCreate;
  if (!payload) {
    console.error("[createFBTFunctionDiscount] Unexpected response shape:", JSON.stringify(mutationData, null, 2));
    return null;
  }

  if (payload.userErrors?.length > 0) {
    console.error("[createFBTFunctionDiscount] userErrors:", JSON.stringify(payload.userErrors, null, 2));
    
    // If the error is about duplicate title, try to find and return the existing discount
    const isDuplicateError = payload.userErrors.some((err: any) => 
      err.message?.toLowerCase().includes("must be unique") || 
      err.message?.toLowerCase().includes("already exists")
    );
    
    if (isDuplicateError) {
      console.log("[createFBTFunctionDiscount] Duplicate detected, attempting to fetch existing discount...");
      const recheckData = await safeGraphql(
        admin,
        `query recheckExistingDiscount {
          discountNodes(first: 50) {
            nodes {
              id
              discount {
                ... on DiscountAutomaticApp {
                  title
                  discountId
                }
              }
            }
          }
        }`,
        undefined,
        "createFBTFunctionDiscount/recheck"
      );
      
      const existingNode = recheckData?.data?.discountNodes?.nodes?.find(
        (node: any) => node.discount?.title === discountTitle
      );
      
      if (existingNode) {
        const discountId = existingNode.discount?.discountId || existingNode.id;
        console.log("[createFBTFunctionDiscount] Found existing discount after duplicate error:", discountId);
        return discountId;
      }
    }
    
    return null;
  }

  const discountId = payload.automaticAppDiscount?.discountId;
  if (!discountId) {
    console.error("[createFBTFunctionDiscount] No discountId in response:", JSON.stringify(payload, null, 2));
    return null;
  }

  console.log("✅ [createFBTFunctionDiscount] Created successfully, discountId:", discountId);
  return discountId;
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Verify if a discount still exists in Shopify
 * Returns true if the discount exists and is active, false otherwise
 */
export async function verifyDiscountExists(
  admin: AdminApiContext,
  discountId: string
): Promise<boolean> {
  if (!discountId) return false;

  const data = await safeGraphql(
    admin,
    `query getDiscount($id: ID!) {
      discountNode(id: $id) {
        id
        discount {
          ... on DiscountAutomaticApp {
            title
            status
          }
        }
      }
    }`,
    { variables: { id: discountId } },
    "verifyDiscountExists"
  );

  const discountNode = data?.data?.discountNode;
  if (!discountNode) {
    console.log("[verifyDiscountExists] Discount not found:", discountId);
    return false;
  }

  const status = discountNode.discount?.status;
  const isActive = status === "ACTIVE";
  console.log("[verifyDiscountExists] Discount status:", status, "isActive:", isActive);
  
  return isActive;
}
export async function deleteFBTDiscount(
  admin: AdminApiContext,
  discountId: string
): Promise<boolean> {
  const data = await safeGraphql(
    admin,
    `mutation discountAutomaticDelete($id: ID!) {
      discountAutomaticDelete(id: $id) {
        deletedAutomaticDiscountId
        userErrors {
          field
          message
        }
      }
    }`,
    { variables: { id: discountId } },
    "deleteFBTDiscount"
  );

  if (!data) return false;

  const payload = data?.data?.discountAutomaticDelete;
  if (!payload) return false;

  if (payload.userErrors?.length > 0) {
    const notFound = payload.userErrors.some((e: any) =>
      e.message?.toLowerCase().includes("does not exist")
    );
    if (notFound) {
      console.log("[deleteFBTDiscount] Discount not found, treating as success.");
      return true;
    }
    console.error("[deleteFBTDiscount] userErrors:", JSON.stringify(payload.userErrors, null, 2));
    return false;
  }

  console.log("[deleteFBTDiscount] Deleted successfully:", discountId);
  return !!payload.deletedAutomaticDiscountId;
}
