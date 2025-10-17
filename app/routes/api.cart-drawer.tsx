import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { cors } from "remix-utils/cors";
import prisma from "../db.server";

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

    // Create default progress bar configuration if none exists
    const defaultProgressBar = {
      id: 'default',
      thresholdAmount: 5000,
      currency: 'INR',
      beforeThresholdMessage: 'Add {remaining} for FREE shipping',
      achievedMessage: '🎉 You qualify for FREE shipping!',
      progressBarColor: '#10b981',
      backgroundColor: '#f3f4f6',
      showPercentage: true,
    };

    // Create default product recommendations configuration if none exists
    const defaultProductRecommendations = {
      id: 'default',
      title: 'You may also like',
      maxProducts: 4,
      layout: 'grid',
      recommendationType: 'manual',
      showDiscount: true,
      showDiscountBadge: true,
      showAddButton: true,
    };

    const response = json({
      enabled: cartDrawer.isActive,
      theme: cartDrawer.theme,
      primaryColor: cartDrawer.primaryColor,
      features: {
        freeShippingProgressBar: cartDrawer.freeShippingProgressBarEnabled
          ? (cartDrawer.freeShippingBars[0] || defaultProgressBar)
          : null,
        promotionalBanner: cartDrawer.promotionalBannerEnabled
          ? activePromotionalBanners[0]
          : null,
        productRecommendations: cartDrawer.productRecommendationsEnabled
          ? (cartDrawer.productRecommendations[0] || defaultProductRecommendations)
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
      },
    });

    return cors(request, response);
  } catch (error) {
    console.error("Error fetching cart drawer config:", error);
    const response = json({ error: "Internal server error" }, { status: 500 });
    return cors(request, response);
  }
};

