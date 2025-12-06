import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { cors } from "remix-utils/cors";
import prisma from "../db.server";
import { checkPlanAccess } from "../utils/planAccess.server";

/**
 * Public API endpoint for Nudge Add Together Popup data
 * This is called from the theme extension to get Nudge Add Together configuration and recommendations
 * URL: /api/nudge-add-together?shop=example.myshopify.com&productHandle=product-handle
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
    // Check plan access for nudge add together feature
    const planAccess = await checkPlanAccess(shop, 'nudge_add_together');
    if (!planAccess.hasAccess) {
      const response = json({ error: planAccess.reason, hasAccess: false }, { status: 403 });
      return cors(request, response);
    }

    // Get NudgeAddTogether configuration
    const nudgeAddTogetherConfig = await prisma.nudgeAddTogether.findUnique({
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

    if (!nudgeAddTogetherConfig || !nudgeAddTogetherConfig.isActive) {
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
      matchingRule = nudgeAddTogetherConfig.rules.find((rule: any) => 
        rule.triggerType === "product" && rule.triggerValue === productHandle
      );

      // 2. If no specific product rule, check for collection rules
      if (!matchingRule) {
        // Get all collection rules
        const collectionRules = nudgeAddTogetherConfig.rules.filter((rule: any) => 
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
        matchingRule = nudgeAddTogetherConfig.rules.find((rule: any) => 
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
        title: nudgeAddTogetherConfig.title || "Complete your purchase",
        subtitle: nudgeAddTogetherConfig.subtitle || "Add these products together",
        layout: nudgeAddTogetherConfig.layout || "grid",
        overlayColor: nudgeAddTogetherConfig.overlayColor || "#000000",
        overlayOpacity: nudgeAddTogetherConfig.overlayOpacity ?? 50,
        popupBackgroundColor: nudgeAddTogetherConfig.popupBackgroundColor || "#FFFFFF",
        popupBorderRadius: nudgeAddTogetherConfig.popupBorderRadius ?? 8,
        titleColor: nudgeAddTogetherConfig.titleColor || "#000000",
        subtitleColor: nudgeAddTogetherConfig.subtitleColor || "#666666",
        addSelectedButtonText: nudgeAddTogetherConfig.addSelectedButtonText || "Add Selected to Cart",
        addSelectedButtonColor: nudgeAddTogetherConfig.addSelectedButtonColor || "#4F46E5",
        addSelectedButtonTextColor: nudgeAddTogetherConfig.addSelectedButtonTextColor || "#FFFFFF",
        closeButtonColor: nudgeAddTogetherConfig.closeButtonColor || "#999999",
        showProductImage: nudgeAddTogetherConfig.showProductImage ?? true,
        showProductPrice: nudgeAddTogetherConfig.showProductPrice ?? true,
        showProductComparePrice: nudgeAddTogetherConfig.showProductComparePrice ?? true,
        showProductDescription: nudgeAddTogetherConfig.showProductDescription ?? false,
        maxProducts: nudgeAddTogetherConfig.maxProducts ?? 4,
        enableAnimation: nudgeAddTogetherConfig.enableAnimation ?? true,
        animationType: nudgeAddTogetherConfig.animationType || "fade",
        recommendationType: "manual",
        showOnAddToCart: nudgeAddTogetherConfig.showOnAddToCart ?? true,
        popupDelay: nudgeAddTogetherConfig.popupDelay ?? 0,
      },
      recommendations
    });

    return cors(request, response);
  } catch (error) {
    console.error("Error fetching Nudge Add Together data:", error);
    const response = json(
      { error: "Failed to fetch Nudge Add Together configuration" },
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

