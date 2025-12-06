/**
 * Shopify Discount Management Utilities
 * Handles automatic creation, update, and deletion of Shopify discount codes for milestones
 */

type AdminApiContext = {
  graphql: (query: string, options?: { variables?: any }) => Promise<any>;
};

/**
 * Generate a unique discount code based on reward type
 */
export function generateDiscountCode(rewardType: string): string {
  const prefixes: { [key: string]: string } = {
    free_shipping: "FREESHIP",
    discount_percentage: "SAVE",
    discount_fixed: "OFF",
    gift_wrapping: "GIFT",
  };
  
  const prefix = prefixes[rewardType] || "MILESTONE";
  const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
  const timestamp = Date.now().toString(36).substring(-4).toUpperCase();
  
  // Generate code with max 20 characters to stay within Shopify limits
  const code = `${prefix}${timestamp}${randomStr}`;
  return code.substring(0, 15).toUpperCase();
}

/**
 * Create a free shipping discount in Shopify
 */
async function createFreeShippingDiscount(
  admin: AdminApiContext,
  code: string,
  title: string
): Promise<{ discountId: string; code: string } | null> {
  const mutation = `
    mutation discountCodeFreeShippingCreate($freeShippingCodeDiscount: DiscountCodeFreeShippingInput!) {
      discountCodeFreeShippingCreate(freeShippingCodeDiscount: $freeShippingCodeDiscount) {
        codeDiscountNode {
          id
          codeDiscount {
            ... on DiscountCodeFreeShipping {
              title
              codes(first: 1) {
                edges {
                  node {
                    code
                  }
                }
              }
            }
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = {
    freeShippingCodeDiscount: {
      title: title,
      code: code,
      startsAt: new Date().toISOString(),
      customerSelection: {
        all: true,
      },
      destination: {
        all: true,
      },
      combinesWith: {
        orderDiscounts: true,
        productDiscounts: true
      }
    },
  };

  try {
    const response = await admin.graphql(mutation, { variables });
    const data = await response.json();

    if (data.errors) {
      console.error("GraphQL errors creating free shipping discount:", JSON.stringify(data.errors, null, 2));
      return null;
    }

    if (data.data?.discountCodeFreeShippingCreate?.userErrors?.length > 0) {
      console.error("User errors creating free shipping discount:", JSON.stringify(data.data.discountCodeFreeShippingCreate.userErrors, null, 2));
      return null;
    }

    const discountNode = data.data?.discountCodeFreeShippingCreate?.codeDiscountNode;
    if (!discountNode) {
      console.error("No discount node returned for free shipping");
      return null;
    }

    return {
      discountId: discountNode.id,
      code: discountNode.codeDiscount.codes.edges[0]?.node.code || code,
    };
  } catch (error) {
    console.error("Exception creating free shipping discount:", error);
    return null;
  }
}

/**
 * Create a percentage discount in Shopify
 */
async function createPercentageDiscount(
  admin: AdminApiContext,
  code: string,
  title: string,
  percentage: number
): Promise<{ discountId: string; code: string } | null> {
  const mutation = `
    mutation discountCodeBasicCreate($basicCodeDiscount: DiscountCodeBasicInput!) {
      discountCodeBasicCreate(basicCodeDiscount: $basicCodeDiscount) {
        codeDiscountNode {
          id
          codeDiscount {
            ... on DiscountCodeBasic {
              title
              codes(first: 1) {
                edges {
                  node {
                    code
                  }
                }
              }
            }
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = {
    basicCodeDiscount: {
      title: title,
      code: code,
      startsAt: new Date().toISOString(),
      customerSelection: {
        all: true,
      },
      combinesWith: {  // FIXED: Moved to root level
        orderDiscounts: true,
        productDiscounts: true,
        shippingDiscounts: true
      },
      customerGets: {
        value: {
          percentage: percentage / 100,
        },
        items: {
          all: true,
        },
      },
    },
  };

  try {
    const response = await admin.graphql(mutation, { variables });
    const data = await response.json();

    if (data.errors) {
      console.error("GraphQL errors creating percentage discount:", JSON.stringify(data.errors, null, 2));
      return null;
    }

    if (data.data?.discountCodeBasicCreate?.userErrors?.length > 0) {
      console.error("User errors creating percentage discount:", JSON.stringify(data.data.discountCodeBasicCreate.userErrors, null, 2));
      return null;
    }

    const discountNode = data.data?.discountCodeBasicCreate?.codeDiscountNode;
    if (!discountNode) {
      console.error("No discount node returned for percentage discount");
      return null;
    }

    return {
      discountId: discountNode.id,
      code: discountNode.codeDiscount.codes.edges[0]?.node.code || code,
    };
  } catch (error) {
    console.error("Exception creating percentage discount:", error);
    return null;
  }
}

/**
 * Create a fixed amount discount in Shopify
 */
async function createFixedDiscount(
  admin: AdminApiContext,
  code: string,
  title: string,
  amount: number,
  currencyCode: string = "INR"
): Promise<{ discountId: string; code: string } | null> {
  const mutation = `
    mutation discountCodeBasicCreate($basicCodeDiscount: DiscountCodeBasicInput!) {
      discountCodeBasicCreate(basicCodeDiscount: $basicCodeDiscount) {
        codeDiscountNode {
          id
          codeDiscount {
            ... on DiscountCodeBasic {
              title
              codes(first: 1) {
                edges {
                  node {
                    code
                  }
                }
              }
            }
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = {
    basicCodeDiscount: {
      title: title,
      code: code,
      startsAt: new Date().toISOString(),
      customerSelection: {
        all: true,
      },
      combinesWith: {  // ADDED: combinesWith for fixed discounts
        orderDiscounts: true,
        productDiscounts: true,
        shippingDiscounts: true
      },
      customerGets: {
        value: {
          fixedAmount: {  // FIXED: Changed from discountAmount to fixedAmount
            amount: amount,
            currencyCode: currencyCode
          },
        },
        items: {
          all: true,
        },
      },
    },
  };

  try {
    const response = await admin.graphql(mutation, { variables });
    const data = await response.json();

    if (data.errors) {
      console.error("GraphQL errors creating fixed discount:", JSON.stringify(data.errors, null, 2));
      return null;
    }

    if (data.data?.discountCodeBasicCreate?.userErrors?.length > 0) {
      console.error("User errors creating fixed discount:", JSON.stringify(data.data.discountCodeBasicCreate.userErrors, null, 2));
      return null;
    }

    const discountNode = data.data?.discountCodeBasicCreate?.codeDiscountNode;
    if (!discountNode) {
      console.error("No discount node returned for fixed discount");
      return null;
    }

    return {
      discountId: discountNode.id,
      code: discountNode.codeDiscount.codes.edges[0]?.node.code || code,
    };
  } catch (error) {
    console.error("Exception creating fixed discount:", error);
    return null;
  }
}

/**
 * Create a gift discount (100% off specific variant) in Shopify
 */
async function createGiftDiscount(
  admin: AdminApiContext,
  code: string,
  title: string,
  variantIds: string[]
): Promise<{ discountId: string; code: string } | null> {
  console.log("=== createGiftDiscount called ===");
  console.log("Code:", code);
  console.log("Title:", title);
  console.log("Variant IDs received:", variantIds);

  const mutation = `
    mutation discountCodeBasicCreate($basicCodeDiscount: DiscountCodeBasicInput!) {
      discountCodeBasicCreate(basicCodeDiscount: $basicCodeDiscount) {
        codeDiscountNode {
          id
          codeDiscount {
            ... on DiscountCodeBasic {
              title
              codes(first: 1) {
                edges {
                  node {
                    code
                  }
                }
              }
            }
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  // Convert variant IDs to proper GID format
  const formattedVariantIds = variantIds.map(id => {
    console.log("Processing variant ID:", id, "Type:", typeof id);
    if (!id) {
      console.log("WARNING: Empty variant ID found!");
      return null;
    }
    if (id.startsWith('gid://')) return id;
    return `gid://shopify/ProductVariant/${id}`;
  }).filter(id => id !== null) as string[];

  console.log("Formatted variant IDs:", formattedVariantIds);

  if (formattedVariantIds.length === 0) {
    console.error("ERROR: No valid variant IDs after formatting!");
    return null;
  }

  const variables = {
    basicCodeDiscount: {
      title: title,
      code: code,
      startsAt: new Date().toISOString(),
      customerSelection: {
        all: true,
      },
      combinesWith: {  // FIXED: Moved to root level
        orderDiscounts: true,
        productDiscounts: true,
        shippingDiscounts: true
      },
      customerGets: {
        value: {
          percentage: 1.0, // 100% off
        },
        items: {
          products: {
            productVariantsToAdd: formattedVariantIds,
          },
        },
      },
    },
  };

  try {
    console.log("Creating gift discount with variant IDs:", formattedVariantIds);
    console.log("Gift discount variables:", JSON.stringify(variables, null, 2));
    const response = await admin.graphql(mutation, { variables });
    const data = await response.json();
    console.log("Gift discount response:", JSON.stringify(data, null, 2));

    if (data.errors) {
      console.error("GraphQL errors creating gift discount:", JSON.stringify(data.errors, null, 2));
      return null;
    }

    if (data.data?.discountCodeBasicCreate?.userErrors?.length > 0) {
      console.error("User errors creating gift discount:", JSON.stringify(data.data.discountCodeBasicCreate.userErrors, null, 2));
      return null;
    }

    const discountNode = data.data?.discountCodeBasicCreate?.codeDiscountNode;
    if (!discountNode) {
      console.error("No discount node returned for gift discount");
      return null;
    }

    console.log("Successfully created gift discount:", discountNode.id);
    return {
      discountId: discountNode.id,
      code: discountNode.codeDiscount.codes.edges[0]?.node.code || code,
    };
  } catch (error) {
    console.error("Exception creating gift discount:", error);
    return null;
  }
}

/**
 * Delete a discount from Shopify
 */
export async function deleteShopifyDiscount(
  admin: AdminApiContext,
  discountId: string
): Promise<boolean> {
  const mutation = `
    mutation discountCodeDelete($id: ID!) {
      discountCodeDelete(id: $id) {
        deletedCodeDiscountId
        userErrors {
          field
          message
        }
      }
    }
  `;

  try {
    const response = await admin.graphql(mutation, {
      variables: { id: discountId },
    });
    const data = await response.json();

    if (data.data?.discountCodeDelete?.userErrors?.length > 0) {
      console.error("Error deleting discount:", data.data.discountCodeDelete.userErrors);
      return false;
    }

    return !!data.data?.discountCodeDelete?.deletedCodeDiscountId;
  } catch (error) {
    console.error("Error deleting discount:", error);
    return false;
  }
}

/**
 * Main function to create a Shopify discount based on milestone configuration
 */
export async function createMilestoneDiscount(
  admin: AdminApiContext,
  milestone: {
    title: string;
    rewardType: string;
    rewardValue?: number | null;
    giftProducts?: Array<{ shopifyVariantId?: string | null }>;
  }
): Promise<{ discountId: string; code: string } | null> {
  try {
    const code = generateDiscountCode(milestone.rewardType);
    const title = `Milestone: ${milestone.title}`;

    switch (milestone.rewardType) {
      case "free_shipping":
        return await createFreeShippingDiscount(admin, code, title);

      case "discount_percentage":
        if (!milestone.rewardValue) {
          console.error("Percentage discount requires rewardValue");
          return null;
        }
        return await createPercentageDiscount(admin, code, title, milestone.rewardValue);

      case "discount_fixed":
        if (!milestone.rewardValue) {
          console.error("Fixed discount requires rewardValue");
          return null;
        }
        return await createFixedDiscount(admin, code, title, milestone.rewardValue);

      case "gift_wrapping":
        // For gifts, create a 100% discount on the gift variants
        const variantIds = milestone.giftProducts
          ?.map(p => p.shopifyVariantId)
          .filter((id): id is string => !!id) || [];
        
        if (variantIds.length === 0) {
          console.error("Gift discount requires at least one product with a variant ID");
          console.error("Gift products received:", JSON.stringify(milestone.giftProducts, null, 2));
          return null;
        }
        
        return await createGiftDiscount(admin, code, title, variantIds);

      default:
        console.error("Unknown reward type:", milestone.rewardType);
        return null;
    }
  } catch (error) {
    console.error("Error in createMilestoneDiscount:", error);
    return null;
  }
}

/**
 * Update a Shopify discount by deleting the old one and creating a new one
 */
export async function updateMilestoneDiscount(
  admin: AdminApiContext,
  oldDiscountId: string | null,
  milestone: {
    title: string;
    rewardType: string;
    rewardValue?: number | null;
    giftProducts?: Array<{ shopifyVariantId?: string | null }>;
  }
): Promise<{ discountId: string; code: string } | null> {
  // Delete old discount if it exists
  if (oldDiscountId) {
    await deleteShopifyDiscount(admin, oldDiscountId);
  }

  // Create new discount
  return createMilestoneDiscount(admin, milestone);
}