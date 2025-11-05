import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { cors } from "remix-utils/cors";
import prisma from "../db.server";

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
    const recommendationType = fbtConfig.recommendationType || "manual";
    
    // Only fetch manual recommendations if recommendation type is manual or hybrid
    if (recommendationType === "manual" || recommendationType === "hybrid") {
      if (productHandle) {
        // Find rules that match the current product
        // Priority: specific_product > collection > all_products
        
        // 1. Check for specific product rule
        let matchingRule = fbtConfig.rules.find(
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
          recommendations = matchingRule.products.map((product: any) => ({
            id: product.shopifyProductId,
            variantId: product.shopifyVariantId,
            title: product.title,
            handle: product.handle,
            price: typeof product.price === 'number' ? product.price : parseFloat(product.price.toString()),
            compareAtPrice: product.compareAtPrice ? (typeof product.compareAtPrice === 'number' ? product.compareAtPrice : parseFloat(product.compareAtPrice.toString())) : null,
            imageUrl: product.imageUrl,
            position: product.position
          }));
          
          // Limit recommendations if limitUpsellsInCart is enabled
          if (fbtConfig.limitUpsellsInCart && fbtConfig.maxUpsellsInCart) {
            recommendations = recommendations.slice(0, fbtConfig.maxUpsellsInCart);
          }
          
          console.log(`FBT API: Found matching rule for ${productHandle}, returning ${recommendations.length} manual recommendations`);
        } else {
          console.log(`FBT API: No matching rule found for product handle: ${productHandle}. Available rules:`, 
            fbtConfig.rules.map((r: any) => ({ type: r.triggerType, value: r.triggerValue }))
          );
        }
      }
    }
    
    // For AI mode, recommendations will be fetched by the widget from Shopify's API
    // For hybrid mode, manual recommendations are included above, AI will be added by widget

    // Return configuration with recommendations
    const response = json({
      enabled: true,
      config: {
        title: fbtConfig.title,
        layout: fbtConfig.layout,
        buttonText: fbtConfig.buttonText,
        buttonColor: fbtConfig.buttonColor,
        buttonTextColor: fbtConfig.buttonTextColor,
        showDiscount: fbtConfig.showDiscount,
        showTotalPrice: fbtConfig.showTotalPrice,
        showIndividualPrices: fbtConfig.showIndividualPrices,
        showCheckboxes: fbtConfig.showCheckboxes,
        showProductReviews: fbtConfig.showProductReviews,
        discountType: fbtConfig.discountType,
        discountValue: fbtConfig.discountValue,
        recommendationType: recommendationType,
        useAI: fbtConfig.useAI,
        algorithm: fbtConfig.algorithm,
        useSmartVariantMatching: fbtConfig.useSmartVariantMatching,
        showOfferIfInCart: fbtConfig.showOfferIfInCart,
        limitUpsellsInCart: fbtConfig.limitUpsellsInCart,
        maxUpsellsInCart: fbtConfig.maxUpsellsInCart,
      },
      recommendations
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

