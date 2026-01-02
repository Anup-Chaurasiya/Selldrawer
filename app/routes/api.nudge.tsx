import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { cors } from "remix-utils/cors";
import prisma from "../db.server";
import { checkPlanAccess } from "../utils/planAccess.server";

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
    // Check plan access for nudge feature
    const planAccess = await checkPlanAccess(shop, 'nudge');
    if (!planAccess.hasAccess) {
      const response = json({ error: planAccess.reason, hasAccess: false }, { status: 403 });
      return cors(request, response);
    }

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

    // Find matching rule for the product (manual recommendations only)
    // Priority: specific product > collection > all products
    let recommendations: any[] = [];
    let matchingRule: any = null;

    if (productHandle) {
      // 1. Check for specific product rule first (highest priority)
      matchingRule = nudgeConfig.rules.find((rule: any) =>
        rule.triggerType === "product" && rule.triggerValue === productHandle
      );

      // 2. If no specific product rule, check for collection rules
      if (!matchingRule) {
        // Get all collection rules
        const collectionRules = nudgeConfig.rules.filter((rule: any) =>
          rule.triggerType === "collection"
        );

        if (collectionRules.length > 0) {
          // Fetch product data to check collections
          try {
            // Shop parameter is in format "example.myshopify.com"
            // Build the product JSON API URL
            const shopDomain = shop.replace(/^https?:\/\//, '').replace(/\/$/, '');
            const productUrl = `https://${shopDomain}/products/${productHandle}.js`;
            const productResponse = await fetch(productUrl, {
              headers: {
                'Accept': 'application/json',
              },
            });

            if (productResponse.ok) {
              const productData = await productResponse.json();
              // Handle different collection formats from Shopify JSON API
              const productCollections = productData.collections || [];
              const productCollectionHandles: string[] = [];

              productCollections.forEach((c: any) => {
                if (typeof c === 'string') {
                  productCollectionHandles.push(c);
                } else if (c && typeof c === 'object') {
                  // Collection object with handle property
                  if (c.handle) {
                    productCollectionHandles.push(c.handle);
                  } else if (c.id) {
                    // Fallback: try to extract handle from ID or use collection title
                    const collectionId = c.id.toString().replace('gid://shopify/Collection/', '');
                    // Store might use collection ID, but we store handles in rules
                    // So we'll match by stored triggerValue (which is handle)
                  }
                }
              });

              // Find collection rule that matches one of the product's collections
              matchingRule = collectionRules.find((rule: any) =>
                productCollectionHandles.includes(rule.triggerValue)
              );
            } else {
              console.warn(`Failed to fetch product data for collection matching: ${productResponse.status}`);
            }
          } catch (error) {
            console.error('Error fetching product data for collection matching:', error);
            // Continue to check all-products rule even if collection check fails
          }
        }
      }

      // 3. If no specific or collection rule, check for all-products rule (lowest priority)
      if (!matchingRule) {
        matchingRule = nudgeConfig.rules.find((rule: any) =>
          rule.triggerType === "all"
        );
      }

      // Map recommendations from matching rule
      if (matchingRule && matchingRule.products.length > 0) {
        recommendations = matchingRule.products.map((product: any) => ({
          id: product.shopifyProductId,
          variantId: product.shopifyVariantId,
          title: product.title,
          handle: product.handle,
          price: typeof product.price === 'number' ? product.price : parseFloat(product.price.toString()),
          compareAtPrice: product.compareAtPrice ? (typeof product.compareAtPrice === 'number' ? product.compareAtPrice : parseFloat(product.compareAtPrice.toString())) : null,
          imageUrl: product.imageUrl,
          description: product.description || null,
          position: product.position
        }));
      }
    }

    // Return configuration with recommendations
    // Ensure all config values have proper defaults
    const response = json({
      enabled: true,
      config: {
        title: nudgeConfig.title || "You might also like",
        subtitle: nudgeConfig.subtitle || "Select a product to replace your choice",
        layout: nudgeConfig.layout || "grid",
        overlayColor: nudgeConfig.overlayColor || "#000000",
        overlayOpacity: nudgeConfig.overlayOpacity ?? 50,
        popupBackgroundColor: nudgeConfig.popupBackgroundColor || "#FFFFFF",
        popupBorderRadius: nudgeConfig.popupBorderRadius ?? 8,
        titleColor: nudgeConfig.titleColor || "#000000",
        subtitleColor: nudgeConfig.subtitleColor || "#666666",
        continueButtonText: nudgeConfig.continueButtonText || "Continue with original",
        continueButtonColor: nudgeConfig.continueButtonColor || "#000000",
        continueButtonTextColor: nudgeConfig.continueButtonTextColor || "#FFFFFF",
        selectButtonText: nudgeConfig.selectButtonText || "Select this product",
        selectButtonColor: nudgeConfig.selectButtonColor || "#4F46E5",
        selectButtonTextColor: nudgeConfig.selectButtonTextColor || "#FFFFFF",
        closeButtonColor: nudgeConfig.closeButtonColor || "#999999",
        showProductImage: nudgeConfig.showProductImage ?? true,
        showProductPrice: nudgeConfig.showProductPrice ?? true,
        showProductComparePrice: nudgeConfig.showProductComparePrice ?? true,
        showProductDescription: nudgeConfig.showProductDescription ?? false,
        maxProducts: nudgeConfig.maxProducts ?? 4,
        enableAnimation: nudgeConfig.enableAnimation ?? true,
        animationType: nudgeConfig.animationType || "fade",
        recommendationType: "manual",
        showOnAddToCart: nudgeConfig.showOnAddToCart ?? true,
        checkboxMode: nudgeConfig.checkboxMode ?? false,
        // Use rule-specific trigger point if matched, otherwise fall back to global setting
        triggerPoint: matchingRule?.triggerPoint || nudgeConfig.triggerPoint || "add_to_cart",
        popupDelay: nudgeConfig.popupDelay ?? 0,
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

