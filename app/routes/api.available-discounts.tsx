import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { cors } from "remix-utils/cors";
import prisma from "../db.server";

/**
 * Public API endpoint to fetch all available Shopify discount codes
 * URL: /api/available-discounts?shop=example.myshopify.com
 * 
 * Returns a list of active discount codes that can be applied to the cart
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");

  if (!shop) {
    const response = json(
      { 
        error: "Shop parameter is required" 
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
      console.error("No session found for shop:", shop);
      const response = json({
        discounts: [],
        error: "Shop not authenticated",
      });
      return cors(request, response);
    }

    const session = sessions[0];
    const accessToken = session.accessToken;

    if (!accessToken) {
      const response = json({
        discounts: [],
        error: "Invalid access token",
      });
      return cors(request, response);
    }

    // Query to get all discount codes (we'll filter on the backend)
    const discountQuery = `
      query getAllActiveDiscounts {
        codeDiscountNodes(first: 50) {
          edges {
            node {
              id
              codeDiscount {
                ... on DiscountCodeBasic {
                  __typename
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
                  summary
                }
                ... on DiscountCodeBxgy {
                  __typename
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
                  summary
                }
                ... on DiscountCodeFreeShipping {
                  __typename
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
        query: discountQuery,
      }),
    });

    if (!graphqlResponse.ok) {
      console.error("Shopify API error:", await graphqlResponse.text());
      const response = json({
        discounts: [],
        error: "Failed to query Shopify API",
      });
      return cors(request, response);
    }

    const discountData = await graphqlResponse.json();
    
    console.log("Shopify API Response:", JSON.stringify(discountData, null, 2));
    
    if (discountData.errors) {
      console.error("GraphQL errors:", JSON.stringify(discountData.errors, null, 2));
      const response = json({
        discounts: [],
        error: "Failed to fetch discounts",
        debug: discountData.errors,
      });
      return cors(request, response);
    }

    const edges = discountData?.data?.codeDiscountNodes?.edges || [];
    console.log(`Found ${edges.length} total discount codes from Shopify`);
    const now = new Date();

    // Process and filter discounts
    const activeDiscounts = edges
      .map((edge: any, index: number) => {
        const discount = edge.node.codeDiscount;
        console.log(`Processing discount ${index + 1}:`, {
          title: discount.title,
          status: discount.status,
          typename: discount.__typename,
        });
        
        // Check if discount is currently valid
        if (discount.status !== "ACTIVE") {
          console.log(`  - Skipped: Status is ${discount.status}`);
          return null;
        }
        
        // Check start date
        if (discount.startsAt && new Date(discount.startsAt) > now) {
          console.log(`  - Skipped: Hasn't started yet (starts: ${discount.startsAt})`);
          return null;
        }
        
        // Check end date
        if (discount.endsAt && new Date(discount.endsAt) < now) {
          console.log(`  - Skipped: Already ended (ended: ${discount.endsAt})`);
          return null;
        }
        
        // Check usage limit
        if (discount.usageLimit && discount.asyncUsageCount >= discount.usageLimit) {
          console.log(`  - Skipped: Usage limit reached (${discount.asyncUsageCount}/${discount.usageLimit})`);
          return null;
        }

        // Get the first code
        const code = discount.codes?.edges?.[0]?.node?.code;
        if (!code) {
          console.log(`  - Skipped: No code found`);
          return null;
        }

        // Extract discount details
        let discountType = "unknown";
        let discountValue: any = null;
        let description = "";
        
        if (discount.customerGets?.value) {
          const value = discount.customerGets.value;
          if (value.percentage !== undefined) {
            discountType = "percentage";
            discountValue = value.percentage * 100;
            description = `${Math.round(discountValue)}% OFF`;
          } else if (value.amount) {
            discountType = "fixed";
            discountValue = parseFloat(value.amount.amount);
            description = `₹${Math.round(discountValue)} OFF`;
          }
        } else if (discount.__typename === "DiscountCodeFreeShipping") {
          discountType = "free_shipping";
          discountValue = 0;
          description = "Free Shipping";
        } else if (discount.__typename === "DiscountCodeBxgy") {
          discountType = "bxgy";
          discountValue = 0;
          description = "Buy X Get Y";
        }

        const result = {
          code,
          title: discount.title,
          type: discountType,
          value: discountValue,
          description,
          summary: discount.summary || description,
        };
        
        console.log(`  ✓ Added discount:`, result);
        return result;
      })
      .filter((d: any) => d !== null);

    console.log(`Returning ${activeDiscounts.length} active discounts`);

    const response = json({
      discounts: activeDiscounts,
      count: activeDiscounts.length,
    });

    return cors(request, response);
  } catch (error) {
    console.error("Error fetching available discounts:", error);
    const response = json(
      { 
        discounts: [],
        error: "Unable to fetch discounts" 
      }, 
      { status: 500 }
    );
    return cors(request, response);
  }
};

