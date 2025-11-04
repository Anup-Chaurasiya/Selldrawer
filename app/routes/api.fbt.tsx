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

    // Find matching rule for the product
    let recommendations: any[] = [];
    
    if (productHandle && fbtConfig.recommendationType === "manual") {
      // Find rule that matches the current product
      const matchingRule = fbtConfig.rules.find(
        (rule: any) => rule.triggerValue === productHandle
      );

      if (matchingRule) {
        recommendations = matchingRule.products.map((product: any) => ({
          id: product.shopifyProductId,
          variantId: product.shopifyVariantId,
          title: product.title,
          handle: product.handle,
          price: product.price,
          compareAtPrice: product.compareAtPrice,
          imageUrl: product.imageUrl,
          position: product.position
        }));
      }
    }

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
        useAI: fbtConfig.useAI,
        algorithm: fbtConfig.algorithm,
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

