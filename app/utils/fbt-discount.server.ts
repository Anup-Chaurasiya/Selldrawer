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
      shopifyFunctions(first: 50) {
        nodes {
          id
          apiType
          title
          appKey
          app {
            handle
          }
        }
      }
    }
  `;

  try {
    const res = await admin.graphql(query);
    const payloadData = await res.json();
    const functions = payloadData?.data?.shopifyFunctions?.nodes || [];

    // Try to find FBT function by multiple criteria
    const fbtFunction = functions.find((fn: any) => {
      // Check if it matches our app's function by handle/key
      const handleMatch = fn.appKey?.includes("fbt-discount") ||
        fn.appKey?.includes("discount-function");

      return handleMatch;
    });

    if (fbtFunction) {
      return fbtFunction.id;
    }

    // Fallback: Use ANY discount-related function from our app
    const anyDiscountFunction = functions.find((fn: any) => {
      const apiType = fn.apiType?.toLowerCase() || "";
      return apiType.includes("discount") || apiType.includes("product");
    });
    
    if (anyDiscountFunction) {
      return anyDiscountFunction.id;
    }

    return null;
  } catch (err) {
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
      return null;
    }

    const discountTitle = `Selldrawer Automatic Discounts`;

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
          orderDiscounts: false,
          productDiscounts: false,
          shippingDiscounts: false
        }
      }
    };

    // Add discountClass or discountClasses based on API type
    // For 'discount' API type, we need discountClasses array
    // For 'product_discount' API type, we don't need it
    const apiType = await admin.graphql(`
      query {
        shopifyFunction(id: "${functionId}") {
          apiType
        }
      }
    `).then(r => r.json()).then(d => d?.data?.shopifyFunction?.apiType);

    if (apiType === "discount") {
      (variables.automaticAppDiscount as any).discountClasses = ["PRODUCT"];
    }

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

    console.log("✅ Selldrawer Automatic Discounts created successfully:", discountId);
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
