import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { cors } from "remix-utils/cors";
import prisma from "../db.server";
import { normalizeFeatureOrder } from "../utils/featureOrder";

/**
 * Public API endpoint for cart drawer data
 * This is called from the theme extension to get configuration
 * URL: /api/cart-drawer?shop=example.myshopify.com
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");

  if (!shop) {
    const response = json({ error: "Shop parameter is required" }, { status: 400 });
    return cors(request, response);
  }

  try {
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

    const features = {
      freeShippingProgressBar: cartDrawer.freeShippingProgressBarEnabled && cartDrawer.freeShippingBars[0]
        ? cartDrawer.freeShippingBars[0]
        : null,
      promotionalBanner: cartDrawer.promotionalBannerEnabled
        ? activePromotionalBanners[0]
        : null,
      productRecommendations: cartDrawer.productRecommendationsEnabled && cartDrawer.productRecommendations[0]
        ? cartDrawer.productRecommendations[0]
        : null,
      couponCodeField: cartDrawer.couponCodeFieldEnabled && couponCodeField?.isActive
        ? couponCodeField
        : null,
      savingsDisplay: cartDrawer.savingsDisplayEnabled
        ? cartDrawer.savingsDisplays[0]
        : null,
      freeShippingMessage: cartDrawer.freeShippingMessageEnabled
        ? cartDrawer.freeShippingMessages[0]
        : null,
    };

    console.log('API Debug - Free Shipping Message:', {
      enabled: cartDrawer.freeShippingMessageEnabled,
      messages: cartDrawer.freeShippingMessages,
      result: features.freeShippingMessage
    });

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

