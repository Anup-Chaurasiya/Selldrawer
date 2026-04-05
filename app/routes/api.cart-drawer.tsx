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
    let cartDrawer = await prisma.cartDrawer.findUnique({
      where: {
        shop
      },
      include: {
        freeShippingBars: {
          where: { isActive: true },
          orderBy: { priority: 'desc' },
          take: 1,
          include: {
            upsellProducts: {
              orderBy: { position: 'asc' },
            },
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
        promotionalBanners: {
          where: { isActive: true },
          include: {
            images: { orderBy: { order: 'asc' } },
            carouselSettings: true,
          }
        },
        freeGifts: {
          where: { isActive: true },
          include: {
            giftProducts: { orderBy: { position: 'asc' } },
            targets: true,
          },
          orderBy: { priority: 'asc' }
        },
        trustBadges: { where: { isActive: true }, take: 1 },
        countdownTimers: { where: { isActive: true }, take: 1 },
        acceleratedCheckouts: { where: { isActive: true }, take: 1 },
      },
    });

    // If config doesn't exist, create with defaults
    if (!cartDrawer) {
      cartDrawer = await prisma.cartDrawer.create({
        data: {
          id: crypto.randomUUID(),
          shop,
          isActive: true,
          updatedAt: new Date(),
        },
      include: {
        freeShippingBars: {
          where: { isActive: true },
          include: {
            upsellProducts: {
              orderBy: { position: 'asc' },
            },
          },
        },
        productRecommendations: {
          where: { isActive: true },
          include: {
            products: { orderBy: { position: 'asc' } },
          },
        },
        savingsDisplays: { where: { isActive: true } },
        freeShippingMessages: { where: { isActive: true } },
        cartTotals: { where: { isActive: true } },
        milestones: {
          where: { isActive: true },
          include: { targets: true },
          orderBy: { priority: 'asc' },
        },
        freeGifts: {
          where: { isActive: true },
          include: {
            giftProducts: { orderBy: { position: 'asc' } },
            targets: true,
          },
          orderBy: { priority: 'asc' },
        },
        promotionalBanners: {
          where: { isActive: true },
          include: {
            images: { orderBy: { order: 'asc' } },
            carouselSettings: true,
          }
        },
        trustBadges: { where: { isActive: true }, take: 1 },
        countdownTimers: { where: { isActive: true }, take: 1 },
        acceleratedCheckouts: { where: { isActive: true }, take: 1 },
      },
      });
    }

    const featureOrder = cartDrawer ? normalizeFeatureOrder(cartDrawer.featureOrder) : [];

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

    cartDrawer.featureOrder = featureOrder;

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
      milestones: cartDrawer.milestones || [],
      milestonesEnabled: cartDrawer.milestonesEnabled,
      milestonesProgressBarColor: (cartDrawer as any).milestonesProgressBarColor || "#3b82f6",
      milestonesAllUnlockedMessage: (cartDrawer as any).milestonesAllUnlockedMessage || "🎉 Congratulations! All rewards unlocked!",
      freeGiftsEnabled: cartDrawer.freeGiftsEnabled,
      freeGifts: cartDrawer.freeGifts || [],
      promotionalBanner: cartDrawer.promotionalBannerEnabled && cartDrawer.promotionalBanners[0]
        ? {
            ...cartDrawer.promotionalBanners[0],
            slides: cartDrawer.promotionalBanners[0].images || [],
            carouselSettings: cartDrawer.promotionalBanners[0].carouselSettings || {
              autoRotate: true,
              rotationSpeed: 5000,
              showDots: true,
              showArrows: true,
            }
          }
        : null,
      trustBadgesEnabled: cartDrawer.trustBadgesEnabled,
      trustBadges: cartDrawer.trustBadges || [],
      countdownTimerEnabled: cartDrawer.countdownTimerEnabled,
      countdownTimers: cartDrawer.countdownTimers || [],
      acceleratedCheckoutEnabled: cartDrawer.acceleratedCheckoutEnabled,
      acceleratedCheckouts: cartDrawer.acceleratedCheckouts || [],
    };

    const response = json({
      enabled: cartDrawer.isActive,
      theme: cartDrawer.theme,
      primaryColor: cartDrawer.primaryColor,
      featureOrder: featureOrder,
      shop, // Add shop domain for milestone upsell API calls
      appUrl: process.env.APP_URL || `https://${request.headers.get('host')}`,
      // Order Intelligence fields
      orderNoteEnabled: cartDrawer.orderNoteEnabled,
      orderNotePlaceholder: cartDrawer.orderNotePlaceholder,
      termsConditionsEnabled: cartDrawer.termsConditionsEnabled,
      termsConditionsText: cartDrawer.termsConditionsText,
      deliveryEstimatesEnabled: cartDrawer.deliveryEstimatesEnabled,
      deliveryEstimatesText: cartDrawer.deliveryEstimatesText,
      processingDaysMin: cartDrawer.processingDaysMin,
      processingDaysMax: cartDrawer.processingDaysMax,
      transitDaysMin: cartDrawer.transitDaysMin,
      transitDaysMax: cartDrawer.transitDaysMax,
      shippingProtectionEnabled: cartDrawer.shippingProtectionEnabled,
      shippingProtectionProductId: cartDrawer.shippingProtectionProductId,
      shippingProtectionTitle: (cartDrawer as any).shippingProtectionTitle || "Shipping Protection",
      shippingProtectionPrice: (cartDrawer as any).shippingProtectionPrice ? parseFloat((cartDrawer as any).shippingProtectionPrice.toString()) : 0,
      // New feature flags at top level for consistent storefront access
      trustBadgesEnabled: cartDrawer.trustBadgesEnabled,
      countdownTimerEnabled: cartDrawer.countdownTimerEnabled,
      acceleratedCheckoutEnabled: cartDrawer.acceleratedCheckoutEnabled,
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
    console.error("Error in api/cart-drawer:", error);
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

