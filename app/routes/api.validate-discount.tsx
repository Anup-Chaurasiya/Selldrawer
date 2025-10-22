import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { cors } from "remix-utils/cors";
import prisma from "../db.server";

/**
 * Public API endpoint to validate Shopify discount codes
 * URL: /api/validate-discount?shop=example.myshopify.com&code=DISCOUNT20
 * 
 * Note: This endpoint validates discount codes using the Shopify Admin API.
 * The actual discount is applied at checkout via the URL parameter.
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  const discountCode = url.searchParams.get("code");

  if (!shop || !discountCode) {
    const response = json(
      { 
        valid: false, 
        error: "Shop and discount code are required" 
      }, 
      { status: 400 }
    );
    return cors(request, response);
  }

  try {
    // Get the shop's offline session (has permanent access token)
    const sessions = await prisma.session.findMany({
      where: {
        shop: shop,
        isOnline: false, // Offline sessions have permanent access
      },
      orderBy: {
        expires: 'desc',
      },
      take: 1,
    });

    if (!sessions || sessions.length === 0) {
      console.error("No session found for shop:", shop);
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

    // Query to check if discount code exists and is valid
    const discountQuery = `
      query getDiscountCodeByCode($query: String!) {
        codeDiscountNodes(first: 5, query: $query) {
          edges {
            node {
              id
              codeDiscount {
                ... on DiscountCodeBasic {
                  title
                  codes(first: 10) {
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
                }
                ... on DiscountCodeBxgy {
                  title
                  codes(first: 10) {
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
                }
                ... on DiscountCodeFreeShipping {
                  title
                  codes(first: 10) {
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
        query: discountQuery,
        variables: {
          query: `code:${discountCode}`,
        },
      }),
    });

    if (!graphqlResponse.ok) {
      console.error("Shopify API error:", await graphqlResponse.text());
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
        error: "Failed to validate discount code",
      });
      return cors(request, response);
    }

    const edges = discountData?.data?.codeDiscountNodes?.edges || [];

    // Find exact code match (case-insensitive)
    let matchedDiscount = null;
    for (const edge of edges) {
      const discount = edge.node.codeDiscount;
      const codes = discount.codes?.edges || [];
      const exactMatch = codes.find((c: any) => 
        c.node.code.toUpperCase() === discountCode.toUpperCase()
      );
      
      if (exactMatch) {
        matchedDiscount = discount;
        break;
      }
    }

    if (!matchedDiscount) {
      const response = json({
        valid: false,
        error: "Invalid discount code",
      });
      return cors(request, response);
    }

    const discount = matchedDiscount;
    const now = new Date();

    // Check if discount is active
    if (discount.status !== "ACTIVE") {
      const response = json({
        valid: false,
        error: "This discount code is not currently active",
      });
      return cors(request, response);
    }

    // Check if discount has started
    if (discount.startsAt && new Date(discount.startsAt) > now) {
      const response = json({
        valid: false,
        error: "This discount code is not yet available",
      });
      return cors(request, response);
    }

    // Check if discount has expired
    if (discount.endsAt && new Date(discount.endsAt) < now) {
      const response = json({
        valid: false,
        error: "This discount code has expired",
      });
      return cors(request, response);
    }

    // Check usage limit
    if (discount.usageLimit && discount.asyncUsageCount >= discount.usageLimit) {
      const response = json({
        valid: false,
        error: "This discount code has reached its usage limit",
      });
      return cors(request, response);
    }

    // Extract discount value
    let discountValue = null;
    let discountType = "unknown";
    
    if (discount.customerGets?.value) {
      const value = discount.customerGets.value;
      if (value.percentage !== undefined) {
        discountType = "percentage";
        discountValue = value.percentage * 100; // Convert to percentage
      } else if (value.amount) {
        discountType = "fixed";
        discountValue = parseFloat(value.amount.amount);
      }
    } else if (discount.__typename === "DiscountCodeFreeShipping") {
      discountType = "free_shipping";
      discountValue = "Free Shipping";
    } else if (discount.__typename === "DiscountCodeBxgy") {
      discountType = "bxgy";
      discountValue = "Buy X Get Y";
    }

    const response = json({
      valid: true,
      code: discount.codes?.edges[0]?.node?.code || discountCode,
      title: discount.title,
      type: discountType,
      value: discountValue,
    });

    return cors(request, response);
  } catch (error) {
    console.error("Error validating discount code:", error);
    const response = json(
      { 
        valid: false, 
        error: "Unable to validate discount code" 
      }, 
      { status: 500 }
    );
    return cors(request, response);
  }
};
