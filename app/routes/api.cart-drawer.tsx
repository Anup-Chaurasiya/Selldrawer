import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { cors } from "remix-utils/cors";
import prisma from "../db.server";
import { normalizeFeatureOrder } from "../utils/featureOrder";
import { checkPlanAccess } from "../utils/planAccess.server";

/**
 * Public API endpoint for cart drawer data
 * This is called from the theme extension to get configuration
 * URL: /api/cart-drawer?shop=example.myshopify.com
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  // Handle OPTIONS preflight requests immediately
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Cache-Control, Pragma",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");

  if (!shop) {
    const response = json({ error: "Shop parameter is required" }, { status: 400 });
    return cors(request, response);
  }

  try {
    // Check plan access for cart drawer feature
    const planAccess = await checkPlanAccess(shop, 'cart_drawer');
    
    if (!planAccess.hasAccess) {
      const response = json({ error: planAccess.reason, hasAccess: false }, { status: 403 });
      return cors(request, response);
    }

    // Get cart drawer configuration
    const cartDrawer = await prisma.cartDrawer.findUnique({
      where: { shop },
      include: {
        freeShippingBars: {
          where: { isActive: true },
          orderBy: { priority: 'desc' },
          take: 1,
        },
        promotionalBanners: {
          where: { isActive: true },
          orderBy: { priority: 'desc' },
          include: {
            images: {
              orderBy: { order: 'asc' },
            },
            carouselSettings: true,
          },
        },
        productRecommendations: {
          where: { isActive: true },
          orderBy: { priority: 'desc' },
          take: 1,
          include: {
            products: {
              orderBy: { position: 'asc' },
            },
          },
        },
        savingsDisplays: {
          where: { isActive: true },
          take: 1,
        },
        freeShippingMessages: {
          where: { isActive: true },
          take: 1,
        },
        cartTotals: {
          where: { isActive: true },
          take: 1,
        },
        milestones: {
          where: { isActive: true },
          include: {
            targets: true,
          },
          orderBy: { priority: 'asc' },
          take: 3, // Maximum 3 milestones
        },
      },
    });

    const featureOrder = cartDrawer ? normalizeFeatureOrder(cartDrawer.featureOrder) : undefined;

    const couponCodeField = await prisma.couponCodeField.findUnique({
      where: { shop },
    });

    // If no configuration exists, return default disabled state
    if (!cartDrawer) {
      const response = json({
        enabled: false,
        features: {},
      });
      return cors(request, response);
    }

    // Filter promotional banners by date
    const now = new Date();
    const activePromotionalBanners = cartDrawer.promotionalBanners.filter(banner => {
      if (banner.startDate && new Date(banner.startDate) > now) return false;
      if (banner.endDate && new Date(banner.endDate) < now) return false;
      return true;
    });

    if (cartDrawer) {
      cartDrawer.featureOrder = featureOrder ?? cartDrawer.featureOrder;
    }

    // Transform product recommendations to ensure proper data structure
    let productRecommendations = null;
    if (cartDrawer.productRecommendationsEnabled && cartDrawer.productRecommendations[0]) {
      const rec = cartDrawer.productRecommendations[0];
      productRecommendations = {
        ...rec,
        products: (rec.products || []).map((product: any) => ({
          id: product.shopifyProductId || product.id,
          shopifyProductId: product.shopifyProductId,
          shopifyVariantId: product.shopifyVariantId,
          title: product.title,
          price: typeof product.price === 'string' ? parseFloat(product.price) : product.price,
          compareAtPrice: product.compareAtPrice ? (typeof product.compareAtPrice === 'string' ? parseFloat(product.compareAtPrice) : product.compareAtPrice) : null,
          imageUrl: product.imageUrl,
        }))
      };
    }

    const features = {
      freeShippingProgressBar: cartDrawer.freeShippingProgressBarEnabled && cartDrawer.freeShippingBars[0]
        ? cartDrawer.freeShippingBars[0]
        : null,
      promotionalBanner: cartDrawer.promotionalBannerEnabled
        ? activePromotionalBanners[0]
        : null,
      productRecommendations,
      couponCodeField: cartDrawer.couponCodeFieldEnabled && couponCodeField?.isActive
        ? couponCodeField
        : null,
      savingsDisplay: cartDrawer.savingsDisplayEnabled
        ? cartDrawer.savingsDisplays[0]
        : null,
      freeShippingMessage: cartDrawer.freeShippingMessageEnabled
        ? cartDrawer.freeShippingMessages[0]
        : null,
      cartTotals: (cartDrawer.cartTotalsEnabled !== false) && cartDrawer.cartTotals && cartDrawer.cartTotals[0]
        ? cartDrawer.cartTotals[0]
        : null,
      milestonesEnabled: cartDrawer.milestonesEnabled,
      milestonesProgressBarColor: (cartDrawer as any).milestonesProgressBarColor || "#3b82f6",
      milestonesAllUnlockedMessage: (cartDrawer as any).milestonesAllUnlockedMessage || "🎉 Congratulations! All rewards unlocked!",
    };

    const response = json({
      enabled: cartDrawer.isActive,
      theme: cartDrawer.theme,
      primaryColor: cartDrawer.primaryColor,
      featureOrder: featureOrder ?? [],
      features,
    }, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
        "Pragma": "no-cache",
        "Expires": "0",
      }
    });

    return cors(request, response);
  } catch (error) {
    console.error("Error fetching cart drawer config:", error);
    const response = json({ error: "Internal server error" }, { status: 500 });
    return cors(request, response);
  }
};

// Handle CORS preflight requests (backup - also handled in loader)
export const OPTIONS = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Cache-Control, Pragma",
      "Access-Control-Max-Age": "86400",
    },
  });
};

