/**
 * FBT Discount Management using Shopify Discount Functions
 * - Creates/updates/deletes Shopify Automatic Discount Functions for FBT bundles
 * - Supports both PERCENTAGE and FIXED amount discounts
 * - Uses line-item properties for bundle grouping and discount application
 */

type AdminApiContext = {
  graphql: (query: string, options?: { variables?: any }) => Promise<any>;
};

type CreateResult = { discountId: string; functionId: string } | null;

/**
 * Create or update a Discount Function for FBT bundles
 * - Automatically applies when customers add FBT bundle products to cart
 * - Uses line-item properties to identify and validate bundles
 * - Supports both percentage and fixed amount discounts
 */
export async function createOrUpdateFBTDiscount(
  admin: AdminApiContext,
  ruleId: string,
  type: "percentage" | "fixed",
  value: number,
  productIds: string[] = []
): Promise<CreateResult> {
  // Validate inputs
  if (!ruleId) {
    console.error("createOrUpdateFBTDiscount: ruleId is required");
    return null;
  }

  if (productIds.length === 0) {
    console.error("createOrUpdateFBTDiscount: no product IDs provided");
    return null;
  }

  if (value <= 0) {
    console.error("createOrUpdateFBTDiscount: discount value must be greater than 0");
    return null;
  }

  try {
    // Step 1: Get the FBT Function ID
    const functionId = await getFBTFunctionId(admin);
    if (!functionId) {
      console.error("createOrUpdateFBTDiscount: FBT Function not found. Please deploy the fbt-discount extension.");
      return null;
    }

    // Step 2: Create automatic app discount
    const mutation = `
      mutation discountAutomaticAppCreate($automaticAppDiscount: DiscountAutomaticAppInput!) {
        discountAutomaticAppCreate(automaticAppDiscount: $automaticAppDiscount) {
          automaticAppDiscount {
            discountId
            title
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    // Create discount configuration
    const discountTitle = `FBT Bundle - Rule ${ruleId}`;

    // Store bundle metadata in metafield for the function to access
    const metafields = [
      {
        namespace: "fbt",
        key: "rule_id",
        value: ruleId,
        type: "single_line_text_field"
      },
      {
        namespace: "fbt",
        key: "discount_type",
        value: type.toUpperCase(),
        type: "single_line_text_field"
      },
      {
        namespace: "fbt",
        key: "discount_value",
        value: value.toString(),
        type: "single_line_text_field"
      },
      {
        namespace: "fbt",
        key: "product_ids",
        value: JSON.stringify(productIds),
        type: "json"
      }
    ];

    const variables = {
      automaticAppDiscount: {
        title: discountTitle,
        functionId: functionId,
        startsAt: new Date().toISOString(),
        combinesWith: {
          orderDiscounts: true,
          productDiscounts: false,
          shippingDiscounts: true
        }
      }
    };

    console.log("Creating FBT Function discount:", {
      ruleId,
      type,
      value,
      productCount: productIds.length,
      functionId
    });

    const res = await admin.graphql(mutation, { variables });
    const payloadData = await res.json();
    const payload = payloadData?.data?.discountAutomaticAppCreate;

    if (!payload) {
      console.error("createOrUpdateFBTDiscount: invalid response", JSON.stringify(payloadData, null, 2));
      return null;
    }

    if (payload.userErrors && payload.userErrors.length > 0) {
      console.error("createOrUpdateFBTDiscount userErrors:", JSON.stringify(payload.userErrors, null, 2));
      return null;
    }

    const discountId = payload.automaticAppDiscount?.discountId;
    if (!discountId) {
      console.error("createOrUpdateFBTDiscount: no discountId returned");
      return null;
    }

    console.log("FBT Function discount created successfully:", discountId);
    return { discountId, functionId };
  } catch (err) {
    console.error("Exception in createOrUpdateFBTDiscount:", err);
    return null;
  }
}

/**
 * Delete an FBT automatic discount by ID
 */
export async function deleteFBTDiscount(
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
    const payloadData = await res.json();
    const payload = payloadData?.data?.discountAutomaticDelete;

    if (!payload) {
      console.error("deleteFBTDiscount: invalid response", JSON.stringify(payloadData, null, 2));
      return false;
    }

    if (payload.userErrors && payload.userErrors.length > 0) {
      // Check if the error is "discount does not exist" - treat this as success
      const doesNotExistError = payload.userErrors.some((err: any) =>
        err.message && err.message.toLowerCase().includes("does not exist")
      );

      if (doesNotExistError) {
        console.log("deleteFBTDiscount: discount already deleted or does not exist, treating as success");
        return true;
      }

      console.error("deleteFBTDiscount userErrors:", JSON.stringify(payload.userErrors, null, 2));
      return false;
    }

    console.log("FBT discount deleted successfully:", discountId);
    return !!payload.deletedAutomaticDiscountId;
  } catch (err) {
    console.error("Exception in deleteFBTDiscount:", err);
    return false;
  }
}

/**
 * Get the Shopify Function ID for the FBT discount function
 * This function must be deployed before discounts can be created
 */
async function getFBTFunctionId(admin: AdminApiContext): Promise<string | null> {
  const query = `
    query {
      shopifyFunctions(first: 25) {
        nodes {
          id
          apiType
          title
          appKey
        }
      }
    }
  `;

  try {
    const res = await admin.graphql(query);
    const payloadData = await res.json();
    const functions = payloadData?.data?.shopifyFunctions?.nodes || [];

    // Find the FBT discount function
    const fbtFunction = functions.find((fn: any) =>
      fn.apiType === "product_discounts" &&
      (fn.title?.includes("fbt") || fn.appKey?.includes("fbt"))
    );

    if (fbtFunction) {
      console.log("Found FBT Function:", fbtFunction.id);
      return fbtFunction.id;
    }

    console.warn("FBT Function not found. Available functions:",
      functions.map((f: any) => ({ id: f.id, title: f.title, apiType: f.apiType }))
    );
    return null;
  } catch (err) {
    console.error("Error fetching Shopify Functions:", err);
    return null;
  }
}
