import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { cors } from "remix-utils/cors";
import prisma from "../db.server";
import { checkPlanAccess } from "../utils/planAccess.server";
import { getStorefrontAccessToken } from "../utils/storefrontToken.server";

/**
 * Public API endpoint for FBT data
 * This is called from the theme extension to get FBT configuration and recommendations
 * URL: /api/fbt?shop=example.myshopify.com&productId=123456
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  const productHandle = url.searchParams.get("productHandle");

  if (!shop) {
    const response = json({ error: "Shop parameter is required" }, { status: 400 });
    return cors(request, response);
  }

  try {
    // Check plan access for FBT feature
    const planAccess = await checkPlanAccess(shop, 'fbt');
    if (!planAccess.hasAccess) {
      const response = json({ error: planAccess.reason, hasAccess: false }, { status: 403 });
      return cors(request, response);
    }

    // Get FBT configuration
    const fbtConfig = await prisma.frequentlyBoughtTogether.findUnique({
      where: { shop },
      include: {
        rules: {
          include: {
            products: {
              orderBy: { position: 'asc' }
            }
          }
        }
      }
    });

    if (!fbtConfig || !fbtConfig.isActive) {
      const response = json({
        enabled: false,
        config: null,
        recommendations: []
      });
      return cors(request, response);
    }

    // Find matching rule for the product based on recommendation type
    let recommendations: any[] = [];
    let matchingRule: any = null;
    const recommendationType = fbtConfig.recommendationType || "manual";

    // Only fetch manual recommendations if recommendation type is manual or hybrid
    if (recommendationType === "manual" || recommendationType === "hybrid") {
      if (productHandle) {
        // Find rules that match the current product
        // Priority: specific_product > collection > all_products

        // 1. Check for specific product rule
        matchingRule = fbtConfig.rules.find(
          (rule: any) => rule.triggerType === "specific_product" && rule.triggerValue === productHandle
        );

        // 2. If no specific product rule, check for collection rule
        // Note: We would need the product's collection info to match this properly
        // For now, we'll skip collection matching on the API side
        // Collections would need to be resolved in the theme extension

        // 3. If no specific or collection rule, check for all_products rule
        if (!matchingRule) {
          matchingRule = fbtConfig.rules.find(
            (rule: any) => rule.triggerType === "all_products"
          );
        }

        if (matchingRule) {
          recommendations = matchingRule.products.map((product: any) => {
            // Helper to convert price to number (handles Prisma Decimal)
            const parsePrice = (price: any): number => {
              if (price == null || price === undefined) return 0;
              if (typeof price === 'number') return price;
              if (typeof price === 'string') {
                const parsed = parseFloat(price);
                return isNaN(parsed) ? 0 : parsed;
              }
              // Handle Prisma Decimal type
              if (typeof price === 'object' && 'toNumber' in price) {
                return price.toNumber();
              }
              // Try to convert to string then parse
              try {
                const parsed = parseFloat(String(price));
                return isNaN(parsed) ? 0 : parsed;
              } catch {
                return 0;
              }
            };

            return {
              id: product.shopifyProductId,
              variantId: product.shopifyVariantId || product.shopifyProductId, // Fallback to productId if variantId is null
              title: product.title,
              handle: product.handle,
              price: parsePrice(product.price),
              compareAtPrice: product.compareAtPrice ? parsePrice(product.compareAtPrice) : null,
              imageUrl: product.imageUrl,
              position: product.position
            };
          });

          // Hard maximum of 4 recommendations (parent + 4 = 5 total products)
          const maxRecommendations = 4;
          recommendations = recommendations.slice(0, maxRecommendations);

        }
      }
    }

    // For AI mode, recommendations will be fetched by the widget from Shopify's API
    // For hybrid mode, manual recommendations are included above, AI will be added by widget

    // Construct parent product from matching rule if available
    let parentProduct = null;
    if (matchingRule && matchingRule.triggerType === 'specific_product') {
      // For specific product triggers, construct minimal parent product data
      // The extension will fetch full product details (price, image) on the client side
      parentProduct = {
        id: matchingRule.triggerProductId || matchingRule.triggerValue,
        variantId: matchingRule.triggerProductId || matchingRule.triggerValue,
        title: matchingRule.triggerTitle || matchingRule.triggerValue,
        handle: matchingRule.triggerValue,
        price: 0, // Will be fetched client-side
        compareAtPrice: null,
        imageUrl: null // Will be fetched client-side
      };
    }

    // Return configuration with recommendations and parent product
    const response = json({
      enabled: true,
      config: {
        title: fbtConfig.title,
        layout: fbtConfig.layout,
        templateType: fbtConfig.templateType,
        buttonText: fbtConfig.buttonText,
        buttonColor: fbtConfig.buttonColor,
        buttonTextColor: fbtConfig.buttonTextColor,
        showTotalPrice: fbtConfig.showTotalPrice,
        showIndividualPrices: fbtConfig.showIndividualPrices,
        showCheckboxes: fbtConfig.showCheckboxes,
        showProductReviews: fbtConfig.showProductReviews,
        // Use per-rule discount values instead of global config
        discountType: matchingRule?.discountType || null,
        discountValue: matchingRule?.discountValue || null,
        recommendationType: recommendationType,
        useAI: fbtConfig.useAI,
        algorithm: fbtConfig.algorithm,
        useSmartVariantMatching: fbtConfig.useSmartVariantMatching,
        showOfferIfInCart: fbtConfig.showOfferIfInCart,
        limitUpsellsInCart: fbtConfig.limitUpsellsInCart,
        maxUpsellsInCart: fbtConfig.maxUpsellsInCart,
        // Bundle metadata for Discount Function
        bundleMetadata: matchingRule ? {
          ruleId: matchingRule.id,
          discountType: matchingRule.discountType,
          discountValue: matchingRule.discountValue ? parseFloat(matchingRule.discountValue.toString()) : null,
          hasDiscount: !!(matchingRule.discountType && matchingRule.discountValue && matchingRule.discountValue > 0)
        } : null
      },
      recommendations,
      parentProduct
    });

    return cors(request, response);
  } catch (error) {
    console.error("Error fetching FBT data:", error);
    const response = json(
      { error: "Failed to fetch FBT configuration" },
      { status: 500 }
    );
    return cors(request, response);
  }
};

// Handle CORS preflight requests
export async function options() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

