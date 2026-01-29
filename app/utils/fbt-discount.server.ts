/**
 * FBT Discount Management using Shopify Discount Functions
 * - No longer creates automatic discounts
 * - Discounts are now applied via the fbt-discount function
 * - Line item properties drive the discount logic
 */

type AdminApiContext = {
  graphql: (query: string, options?: { variables?: any }) => Promise<any>;
};

/**
 * Get the Shopify Function ID for the FBT discount function
 * This function must be deployed before discounts can be applied
 */
export async function getFBTFunctionId(admin: AdminApiContext): Promise<string | null> {
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

    console.log("📋 All Shopify Functions:", JSON.stringify(functions, null, 2));

    // Try to find FBT function by multiple criteria
    const fbtFunction = functions.find((fn: any) => {
      // Check if it's a discount function (can be 'discount' or 'product_discounts')
      if (fn.apiType !== "discount" && fn.apiType !== "product_discounts") {
        return false;
      }

      const titleMatch = fn.title?.toLowerCase().includes("fbt") ||
        fn.title?.toLowerCase().includes("frequently bought together") ||
        fn.title?.toLowerCase().includes("discount");

      const handleMatch = fn.appKey?.includes("fbt-discount") ||
        fn.appKey?.includes("discount-function");

      return titleMatch || handleMatch;
    });

    if (fbtFunction) {
      console.log("✅ Found FBT Function by name:", fbtFunction.id, fbtFunction.title);
      return fbtFunction.id;
    }

    // Fallback: Use ANY discount or product_discounts function
    const anyDiscount = functions.find((fn: any) =>
      fn.apiType === "discount" || fn.apiType === "product_discounts"
    );
    if (anyDiscount) {
      console.log("⚠️ FBT function not found by name, using first discount function:", anyDiscount.id, anyDiscount.title);
      return anyDiscount.id;
    }

    console.error("❌ No discount functions found at all!");
    console.error("Available functions:", functions.map((f: any) => ({
      id: f.id,
      title: f.title,
      apiType: f.apiType,
      appKey: f.appKey
    })));
    return null;
  } catch (err) {
    console.error("Error fetching Shopify Functions:", err);
    return null;
  }
}

/**
 * Create an automatic discount that uses the FBT function
 * This creates a discount node that activates the function for all FBT bundles
 */
export async function createFBTFunctionDiscount(
  admin: AdminApiContext,
  shop: string
): Promise<string | null> {
  try {
    // Get the FBT Function ID
    const functionId = await getFBTFunctionId(admin);
    if (!functionId) {
      console.error("createFBTFunctionDiscount: FBT Function not found. Please deploy the fbt-discount extension.");
      return null;
    }

    const discountTitle = `FBT Bundle Discount`;

    // Check if discount already exists
    const checkQuery = `
      query {
        automaticDiscountNodes(first: 50) {
          nodes {
            id
            automaticDiscount {
              ... on DiscountAutomaticApp {
                title
                discountId
              }
            }
          }
        }
      }
    `;

    const checkRes = await admin.graphql(checkQuery);
    const checkData = await checkRes.json();
    const existingDiscount = checkData?.data?.automaticDiscountNodes?.nodes?.find(
      (node: any) => node.automaticDiscount?.title === discountTitle
    );

    if (existingDiscount) {
      console.log("✅ FBT Bundle Discount already exists:", existingDiscount.automaticDiscount.discountId);
      return existingDiscount.automaticDiscount.discountId;
    }

    // Create automatic app discount
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

    const variables = {
      automaticAppDiscount: {
        title: discountTitle,
        functionId: functionId,
        startsAt: new Date().toISOString(),
        combinesWith: {
          orderDiscounts: true,
          productDiscounts: true,
          shippingDiscounts: true
        },
        discountClasses: ["PRODUCT", "ORDER"]
      }
    };

    console.log("Creating FBT Function discount:", {
      shop,
      functionId
    });

    const res = await admin.graphql(mutation, { variables });
    const payloadData = await res.json();
    const payload = payloadData?.data?.discountAutomaticAppCreate;

    if (!payload) {
      console.error("createFBTFunctionDiscount: invalid response", JSON.stringify(payloadData, null, 2));
      return null;
    }

    if (payload.userErrors && payload.userErrors.length > 0) {
      console.error("createFBTFunctionDiscount userErrors:", JSON.stringify(payload.userErrors, null, 2));
      return null;
    }

    const discountId = payload.automaticAppDiscount?.discountId;
    if (!discountId) {
      console.error("createFBTFunctionDiscount: no discountId returned");
      return null;
    }

    console.log("FBT Function discount created successfully:", discountId);
    return discountId;
  } catch (err) {
    console.error("Exception in createFBTFunctionDiscount:", err);
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
