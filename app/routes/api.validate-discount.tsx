import { json } from "@remix-run/node";
import { cors } from "remix-utils/cors";
import type { LoaderFunctionArgs } from "@remix-run/node";
import prisma from "../db.server";

/**
 * Public API endpoint to validate a discount code
 * URL: /api/validate-discount?shop=example.myshopify.com&code=SUMMER20
 * 
 * Returns whether the discount code is valid and active
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  const code = url.searchParams.get("code");

  if (!shop || !code) {
    const response = json(
      { 
        valid: false,
        error: "Shop and code parameters are required" 
      }, 
      { status: 400 }
    );
    return cors(request, response);
  }

  try {
    // Get the shop's offline session
    const sessions = await prisma.session.findMany({
      where: {
        shop: shop,
        isOnline: false,
      },
      orderBy: {
        expires: 'desc',
      },
      take: 1,
    });

    if (!sessions || sessions.length === 0) {
      const response = json({
        valid: false,
        error: "Shop not authenticated",
      });
      return cors(request, response);
    }

    const session = sessions[0];
    const accessToken = session.accessToken;

    if (!accessToken) {
      const response = json({
        valid: false,
        error: "Invalid access token",
      });
      return cors(request, response);
    }

    // Query to get all discount codes and filter client-side
    const discountQuery = `
      query getAllActiveDiscounts {
        codeDiscountNodes(first: 250) {
          edges {
            node {
              id
              codeDiscount {
                ... on DiscountCodeBasic {
                  __typename
                  title
                  codes(first: 50) {
                    edges {
                      node {
                        code
                      }
                    }
                  }
                  status
                  startsAt
                  endsAt
                  customerGets {
                    value {
                      ... on DiscountPercentage {
                        percentage
                      }
                      ... on DiscountAmount {
                        amount {
                          amount
                          currencyCode
                        }
                      }
                    }
                  }
                  usageLimit
                  asyncUsageCount
                  summary
                }
                ... on DiscountCodeBxgy {
                  __typename
                  title
                  codes(first: 50) {
                    edges {
                      node {
                        code
                      }
                    }
                  }
                  status
                  startsAt
                  endsAt
                  usageLimit
                  asyncUsageCount
                  summary
                }
                ... on DiscountCodeFreeShipping {
                  __typename
                  title
                  codes(first: 50) {
                    edges {
                      node {
                        code
                      }
                    }
                  }
                  status
                  startsAt
                  endsAt
                  usageLimit
                  asyncUsageCount
                  summary
                }
              }
            }
          }
        }
      }
    `;

    // Make GraphQL request to Shopify Admin API
    const shopifyApiUrl = `https://${shop}/admin/api/2025-01/graphql.json`;
    const graphqlResponse = await fetch(shopifyApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken,
      },
      body: JSON.stringify({
        query: discountQuery
      }),
    });

    if (!graphqlResponse.ok) {
      const response = json({
        valid: false,
        error: "Failed to query Shopify API",
      });
      return cors(request, response);
    }

    const discountData = await graphqlResponse.json();
    
    if (discountData.errors) {
      console.error("GraphQL errors:", discountData.errors);
      const response = json({
        valid: false,
        error: "Failed to validate discount",
      });
      return cors(request, response);
    }

    const edges = discountData?.data?.codeDiscountNodes?.edges || [];
    const now = new Date();
    const upperCode = code.toUpperCase();
    
    // Find the discount that contains this code
    let foundDiscount = null;
    let foundCode = null;

    for (const edge of edges) {
      const discount = edge.node.codeDiscount;
      const codes = discount.codes?.edges || [];
      
      for (const codeEdge of codes) {
        const discountCode = codeEdge.node.code;
        if (discountCode.toUpperCase() === upperCode) {
          foundDiscount = discount;
          foundCode = discountCode;
          break;
        }
      }
      
      if (foundDiscount) break;
    }
    
    if (!foundDiscount || !foundCode) {
      const response = json({
        valid: false,
        error: "Discount code not found",
      });
      return cors(request, response);
    }

    // Validate discount is active
    if (foundDiscount.status !== "ACTIVE") {
      const response = json({
        valid: false,
        error: "Discount code is not active",
      });
      return cors(request, response);
    }

    // Check start date
    if (foundDiscount.startsAt && new Date(foundDiscount.startsAt) > now) {
      const response = json({
        valid: false,
        error: "Discount code has not started yet",
      });
      return cors(request, response);
    }

    // Check end date
    if (foundDiscount.endsAt && new Date(foundDiscount.endsAt) < now) {
      const response = json({
        valid: false,
        error: "Discount code has expired",
      });
      return cors(request, response);
    }

    // Check usage limit
    if (foundDiscount.usageLimit && foundDiscount.asyncUsageCount >= foundDiscount.usageLimit) {
      const response = json({
        valid: false,
        error: "Discount code usage limit reached",
      });
      return cors(request, response);
    }

    // Extract discount details
    let discountType = "unknown";
    let discountValue: any = null;
    let description = "";
    
    if (foundDiscount.customerGets?.value) {
      const value = foundDiscount.customerGets.value;
      if (value.percentage !== undefined) {
        discountType = "percentage";
        discountValue = value.percentage * 100;
        description = `${Math.round(discountValue)}% OFF`;
      } else if (value.amount) {
        discountType = "fixed";
        discountValue = parseFloat(value.amount.amount);
        description = `$${discountValue.toFixed(2)} OFF`;
      }
    } else if (foundDiscount.__typename === "DiscountCodeFreeShipping") {
      discountType = "free_shipping";
      discountValue = 0;
      description = "Free Shipping";
    } else if (foundDiscount.__typename === "DiscountCodeBxgy") {
      discountType = "bxgy";
      discountValue = 0;
      description = "Buy X Get Y";
    }

    const response = json({
      valid: true,
      discount: {
        code: foundCode,
        title: foundDiscount.title,
        type: discountType,
        value: discountValue,
        description,
        summary: foundDiscount.summary || description,
      }
    });

    return cors(request, response);
  } catch (error) {
    console.error("Error validating discount:", error);
    const response = json(
      { 
        valid: false,
        error: "Unable to validate discount" 
      }, 
      { status: 500 }
    );
    return cors(request, response);
  }
};
