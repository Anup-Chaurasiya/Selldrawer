import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { cors } from "remix-utils/cors";
import prisma from "../db.server";

/**
 * Public API endpoint for Nudge Popup data
 * This is called from the theme extension to get Nudge configuration and recommendations
 * URL: /api/nudge?shop=example.myshopify.com&productHandle=product-handle
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
    // Get Nudge configuration
    const nudgeConfig = await prisma.nudgePopup.findUnique({
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

    if (!nudgeConfig || !nudgeConfig.isActive) {
      const response = json({
        enabled: false,
        config: null,
        recommendations: []
      });
      return cors(request, response);
    }

    // Find matching rule for the product
    let recommendations: any[] = [];
    const recommendationType = nudgeConfig.recommendationType || "manual";
    
    // Only fetch manual recommendations if recommendation type is manual or hybrid
    if (recommendationType === "manual" || recommendationType === "hybrid") {
      if (productHandle) {
        // Try to find a specific product rule first
        const matchingRule = nudgeConfig.rules.find((rule: any) => {
          if (rule.triggerType === "product") {
            // For product handle matching
            return rule.triggerValue === productHandle;
          }
          return false;
        });

        if (matchingRule && matchingRule.products.length > 0) {
          recommendations = matchingRule.products.map((product: any) => ({
            id: product.shopifyProductId,
            variantId: product.shopifyVariantId,
            title: product.title,
            handle: product.handle,
            price: parseFloat(product.price.toString()),
            compareAtPrice: product.compareAtPrice ? parseFloat(product.compareAtPrice.toString()) : null,
            imageUrl: product.imageUrl,
            description: product.description,
            position: product.position
          }));
        } else {
          // Check for collection or all-products rules
          const collectionOrAllRule = nudgeConfig.rules.find((rule: any) => 
            rule.triggerType === "collection" || rule.triggerType === "all"
          );

          if (collectionOrAllRule && collectionOrAllRule.products.length > 0) {
            recommendations = collectionOrAllRule.products.map((product: any) => ({
              id: product.shopifyProductId,
              variantId: product.shopifyVariantId,
              title: product.title,
              handle: product.handle,
              price: parseFloat(product.price.toString()),
              compareAtPrice: product.compareAtPrice ? parseFloat(product.compareAtPrice.toString()) : null,
              imageUrl: product.imageUrl,
              description: product.description,
              position: product.position
            }));
          }
        }
      }
    }
    
    // For AI mode, recommendations will be fetched by the widget from Shopify's API
    // For hybrid mode, manual recommendations are included above, AI will be added by widget

    // Return configuration with recommendations
    const response = json({
      enabled: true,
      config: {
        title: nudgeConfig.title,
        subtitle: nudgeConfig.subtitle,
        layout: nudgeConfig.layout,
        overlayColor: nudgeConfig.overlayColor,
        overlayOpacity: nudgeConfig.overlayOpacity,
        popupBackgroundColor: nudgeConfig.popupBackgroundColor,
        popupBorderRadius: nudgeConfig.popupBorderRadius,
        titleColor: nudgeConfig.titleColor,
        subtitleColor: nudgeConfig.subtitleColor,
        continueButtonText: nudgeConfig.continueButtonText,
        continueButtonColor: nudgeConfig.continueButtonColor,
        continueButtonTextColor: nudgeConfig.continueButtonTextColor,
        selectButtonText: nudgeConfig.selectButtonText,
        selectButtonColor: nudgeConfig.selectButtonColor,
        selectButtonTextColor: nudgeConfig.selectButtonTextColor,
        closeButtonColor: nudgeConfig.closeButtonColor,
        showProductImage: nudgeConfig.showProductImage,
        showProductPrice: nudgeConfig.showProductPrice,
        showProductComparePrice: nudgeConfig.showProductComparePrice,
        showProductDescription: nudgeConfig.showProductDescription,
        maxProducts: nudgeConfig.maxProducts,
        enableAnimation: nudgeConfig.enableAnimation,
        animationType: nudgeConfig.animationType,
        recommendationType: recommendationType,
        useAI: nudgeConfig.useAI,
        algorithm: nudgeConfig.algorithm,
        showOnAddToCart: nudgeConfig.showOnAddToCart,
        popupDelay: nudgeConfig.popupDelay,
      },
      recommendations
    });

    return cors(request, response);
  } catch (error) {
    console.error("Error fetching Nudge data:", error);
    const response = json(
      { error: "Failed to fetch Nudge configuration" },
      { status: 500 }
    );
    return cors(request, response);
  }
};

// Handle CORS preflight requests
export async function options() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

