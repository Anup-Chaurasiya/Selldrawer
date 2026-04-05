import prisma from "../db.server";
import { saveConfigToMetafields } from "../shopify.server";
import { normalizeFeatureOrder } from "./featureOrder";

/**
 * Centrally manages the synchronization of all Cart Drawer configurations 
 * to Shopify Metafields for zero-latency storefront access.
 */
export async function syncCartDrawerConfigToMetafields(admin: any, shop: string) {
  try {
    // 1. Fetch the complete CartDrawer configuration with all related features
    const cartDrawer = await prisma.cartDrawer.findUnique({
      where: { shop },
      include: {
        freeShippingBars: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        productRecommendations: {
          where: { isActive: true },
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
        },
        freeGifts: {
          where: { isActive: true },
          include: {
            giftProducts: { orderBy: { position: 'asc' } },
            targets: true,
          },
          orderBy: { priority: 'asc' },
        },
        trustBadges: { where: { isActive: true } },
        countdownTimers: { where: { isActive: true } },
        acceleratedCheckouts: { where: { isActive: true } },
      },
    });

    if (!cartDrawer) {
      console.warn(`[Sync] CartDrawer config not found for shop: ${shop}`);
      return null;
    }

    // 2. Fetch standalone configurations
    const couponCodeField = await prisma.couponCodeField.findUnique({
      where: { shop },
    });

    // FBT is not directly related to CartDrawer in the schema
    const fbtConfig = await prisma.frequentlyBoughtTogether.findUnique({
      where: { shop },
      include: {
        FBTRule: {
          include: {
            products: {
              orderBy: { position: 'asc' }
            }
          }
        }
      }
    });

    // 3. Format the data for the storefront (matching api.cart-drawer.tsx logic)
    const featureOrder = normalizeFeatureOrder(cartDrawer.featureOrder);
    
    // Transform product recommendations
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

    const configToSync = {
      enabled: cartDrawer.isActive,
      theme: cartDrawer.theme,
      primaryColor: cartDrawer.primaryColor,
      featureOrder: featureOrder ?? [],
      shop: cartDrawer.shop,
      features: {
        freeShippingProgressBar: cartDrawer.freeShippingProgressBarEnabled && cartDrawer.freeShippingBars[0]
          ? cartDrawer.freeShippingBars[0]
          : null,
        productRecommendations,
        couponCodeField: cartDrawer.couponCodeFieldEnabled && (couponCodeField as any)?.isActive !== false
          ? couponCodeField
          : null,
        savingsDisplay: cartDrawer.savingsDisplayEnabled && cartDrawer.savingsDisplays[0]
          ? cartDrawer.savingsDisplays[0]
          : null,
        freeShippingMessage: cartDrawer.freeShippingMessageEnabled && cartDrawer.freeShippingMessages[0]
          ? cartDrawer.freeShippingMessages[0]
          : null,
        cartTotals: (cartDrawer.cartTotalsEnabled !== false) && cartDrawer.cartTotals && cartDrawer.cartTotals[0]
          ? cartDrawer.cartTotals[0]
          : null,
        milestonesEnabled: cartDrawer.milestonesEnabled,
        milestonesProgressBarColor: (cartDrawer as any).milestonesProgressBarColor || "#3b82f6",
        milestonesAllUnlockedMessage: (cartDrawer as any).milestonesAllUnlockedMessage || "🎉 Congratulations! All rewards unlocked!",
        milestones: cartDrawer.milestonesEnabled ? cartDrawer.milestones : [],
        freeGiftsEnabled: cartDrawer.freeGiftsEnabled,
        freeGifts: cartDrawer.freeGiftsEnabled ? cartDrawer.freeGifts : [],
        shippingProtectionTitle: (cartDrawer as any).shippingProtectionTitle || "Shipping Protection",
        shippingProtectionPrice: cartDrawer.shippingProtectionPrice ? parseFloat(cartDrawer.shippingProtectionPrice.toString()) : 0,
        // New Features
        trustBadgesEnabled: cartDrawer.trustBadgesEnabled,
        trustBadges: cartDrawer.trustBadges || [],
        countdownTimerEnabled: cartDrawer.countdownTimerEnabled,
        countdownTimers: cartDrawer.countdownTimers || [],
        acceleratedCheckoutEnabled: cartDrawer.acceleratedCheckoutEnabled,
        acceleratedCheckouts: cartDrawer.acceleratedCheckouts || [],
      },
      // Order Intelligence (Top level for consistent frontend access)
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
      shippingProtectionPrice: cartDrawer.shippingProtectionPrice ? parseFloat(cartDrawer.shippingProtectionPrice.toString()) : 0,
      updatedAt: new Date().toISOString(),
    };

    // 4. Update the Shopify Metafield
    const result = await saveConfigToMetafields(admin, configToSync);
    console.log(`[Sync] Config successfully synced to Metafields for ${shop}`);
    return result;

  } catch (error) {
    console.error(`[Sync] Error syncing config to Metafields for ${shop}:`, error);
    // Don't throw error back to the action - we don't want to break the admin UI
    // if the metafield sync fails for some reason
    return null;
  }
}
