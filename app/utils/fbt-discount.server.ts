/**
 * FBT Discount Code Management Utilities
 * Create and update manual discount codes for FBT rules
 */


type AdminApiContext = {
  graphql: (query: string, options?: { variables?: any }) => Promise<any>;
};

type CreateResult = { discountId: string; code: string } | null;

/**
 * Helper to ensure number -> string with two decimals for money fields
 */
function toAmountString(value: number): string {
  return value.toFixed(2);
}

/**
 * Create or update a manual discount code for FBT
 * - code: The discount code string (e.g., "FBT_RULE_123")
 * - type: "percentage" | "fixed"
 * - value: for percentage -> pass 5 for 5%; for fixed -> pass 200 for ₹200
 * 
 * This creates a MANUAL discount code (not automatic) that users can apply at checkout.
 */
export async function createOrUpdateFBTDiscount(
  admin: AdminApiContext,
  code: string,
  type: "percentage" | "fixed",
  value: number
): Promise<CreateResult> {
  // First, try to find existing discount with this code
  const findQuery = `
    query findDiscountCode($query: String!) {
      codeDiscountNodes(first: 1, query: $query) {
        edges {
          node {
            id
            codeDiscount {
              ... on DiscountCodeBasic {
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
        }
      }
    }
  `;

  try {
    // Check if discount with this code already exists
    const findRes = await admin.graphql(findQuery, {
      variables: { query: `title:${code}` }
    });
    const findData = await findRes.json();
    const existingDiscount = findData?.data?.codeDiscountNodes?.edges?.[0]?.node;

    // If exists, delete it first (we'll recreate with new values)
    if (existingDiscount?.id) {
      console.log(`FBT Discount: Found existing discount ${code}, deleting...`);
      await deleteDiscountCode(admin, existingDiscount.id);
    }

    // Create new discount code
    const createMutation = `
      mutation discountCodeBasicCreate($basicCodeDiscount: DiscountCodeBasicInput!) {
        discountCodeBasicCreate(basicCodeDiscount: $basicCodeDiscount) {
          codeDiscountNode {
            id
            codeDiscount {
              ... on DiscountCodeBasic {
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

    const customerGets =
      type === "percentage"
        ? {
          items: {
            all: true
          },
          value: {
            percentage: value / 100.0
          }
        }
        : {
          items: {
            all: true
          },
          value: {
            discountAmount: {
              amount: toAmountString(value),
              appliesOnEachItem: false
            }
          }
        };

    const variables = {
      basicCodeDiscount: {
        title: code,
        code: code,
        startsAt: new Date().toISOString(),
        // No minimum requirements - discount always applies
        minimumRequirement: null,
        customerGets,
        // All customers eligible
        customerSelection: {
          all: true
        },
        // Allow combining with other discounts
        combinesWith: {
          shippingDiscounts: true,
          productDiscounts: true,
          orderDiscounts: true
        },
        // No usage limits
        usageLimit: null
      }
    };

    console.log(`FBT Discount: Creating discount code ${code} with config:`, JSON.stringify(variables, null, 2));

    const createRes = await admin.graphql(createMutation, { variables });
    const createData = await createRes.json();
    const payload = createData?.data?.discountCodeBasicCreate ?? createData?.discountCodeBasicCreate ?? null;

    if (!payload) {
      console.error("createOrUpdateFBTDiscount: invalid response", JSON.stringify(createRes, null, 2));
      return null;
    }

    if (payload.userErrors && payload.userErrors.length) {
      console.error("createOrUpdateFBTDiscount userErrors:", JSON.stringify(payload.userErrors, null, 2));
      return null;
    }

    const discountId = payload.codeDiscountNode?.id;
    const discountCode = payload.codeDiscountNode?.codeDiscount?.codes?.edges?.[0]?.node?.code;

    if (!discountId) {
      console.error("createOrUpdateFBTDiscount: no discount ID returned", JSON.stringify(payload, null, 2));
      return null;
    }

    console.log(`FBT Discount: Created discount code ${discountCode} with ID ${discountId}`);
    return { discountId, code: discountCode || code };
  } catch (err) {
    console.error("Exception in createOrUpdateFBTDiscount:", err);
    return null;
  }
}

/**
 * Delete a discount code by ID
 */
async function deleteDiscountCode(
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
    const res = await admin.graphql(mutation, { variables: { id: discountId } });
    const payloadData = await res.json();
    const payload = payloadData?.data?.discountCodeDelete ?? payloadData?.discountCodeDelete ?? null;

    if (!payload) {
      console.error("deleteDiscountCode: invalid response", JSON.stringify(res, null, 2));
      return false;
    }

    if (payload.userErrors && payload.userErrors.length) {
      // Check if the error is "discount does not exist" - treat this as success
      const doesNotExistError = payload.userErrors.some((err: any) =>
        err.message && err.message.toLowerCase().includes("does not exist")
      );

      if (doesNotExistError) {
        console.log("deleteDiscountCode: discount already deleted or does not exist, treating as success");
        return true;
      }

      console.error("deleteDiscountCode userErrors:", JSON.stringify(payload.userErrors, null, 2));
      return false;
    }

    return !!payload.deletedCodeDiscountId;
  } catch (err) {
    console.error("Exception in deleteDiscountCode:", err);
    return false;
  }
}

/**
 * Delete an FBT discount code
 */
export async function deleteFBTDiscount(
  admin: AdminApiContext,
  discountId: string
): Promise<boolean> {
  return await deleteDiscountCode(admin, discountId);
}
