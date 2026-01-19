import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, useActionData, useSubmit, useNavigate, useFetcher } from "@remix-run/react";
import { useState } from "react";
import React from "react";
import {
  Page,
  Layout,
  Card,
  BlockStack,
  Text,
  Button,
  InlineStack,
  Badge,
  Icon,
  Box,
  Banner,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import {
  ChartVerticalIcon,
  MegaphoneIcon,
  ProductIcon,
  DiscountIcon,
  CashDollarIcon,
  DeliveryIcon,
  CalculatorIcon,
  GiftCardIcon,
} from '@shopify/polaris-icons';
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import {
  DEFAULT_FEATURE_ORDER,
  FEATURE_ORDER_SENTINEL,
  normalizeFeatureOrder,
  reorderFeatureOrder,
  splitFeatureOrder,
} from "../utils/featureOrder";
import { checkAppEmbedEnabled } from "../utils/appEmbed.server";
import { checkPlanAccess } from "../utils/planAccess.server";
import { requireBilling } from "../utils/billing.server";
import { PromotionalBannerCard } from "../components/shared/PromotionalBannerCard";
import { ProductRecommendations } from "../components/shared/ProductRecommendations";
import { FreeShippingBar } from "../components/shared/FreeShippingBar";
import { SavingsDisplay } from "../components/shared/SavingsDisplay";
import { FreeShippingMessage } from "../components/shared/FreeShippingMessage";
import { CouponCodeField } from "../components/shared/CouponCodeField";
import { CartTotals } from "../components/shared/CartTotals";
import { CartItems } from "../components/shared/CartItems";
import { MilestonesWidget } from "../components/shared/MilestonesWidget";
import { FreeGiftSelector } from "../components/shared/FreeGiftSelector";
import { VersionManagementModal } from "../components/shared/VersionManagementModal";

// Wrapper component for the preview with state management
function PromotionalBannerPreview({
  slides,
  carouselSettings,
  promotionalBanner
}: {
  slides: any[];
  carouselSettings?: any;
  promotionalBanner?: any;
}) {
  return (
    <PromotionalBannerCard
      slides={slides}
      carouselSettings={carouselSettings}
      titleColor={promotionalBanner?.titleColor || '#111827'}
      descriptionColor={promotionalBanner?.descriptionColor || '#6b7280'}
      ctaTextColor={promotionalBanner?.ctaTextColor || '#374151'}
      ctaBackgroundColor={promotionalBanner?.ctaBackgroundColor || '#f3f4f6'}
      borderColor={promotionalBanner?.borderColor || '#e5e7eb'}
      onCtaClick={() => { }}
      isPreview={true}
    />
  );
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { billing, session, admin } = await authenticate.admin(request);
  const shop = session.shop;
  const url = new URL(request.url);
  const error = url.searchParams.get("error");

  // Get version parameter from URL (default to "default")
  const editingVersion = url.searchParams.get("version") || "default";

  // Check billing - if no active payment, return redirect URL
  const billingRedirectUrl = await requireBilling(billing);
  if (billingRedirectUrl) {
    return json({ billingRedirectUrl });
  }

  // Check plan access for cart drawer feature
  const planAccess = await checkPlanAccess(shop, 'cart_drawer');

  // Check if app embed is enabled
  const appEmbedEnabled = await checkAppEmbedEnabled(admin, session);

  // Get or create cart drawer configuration for this version
  let cartDrawer = await prisma.cartDrawer.findUnique({
    where: {
      shop_version: {
        shop,
        version: editingVersion
      }
    },
    include: {
      freeShippingBars: { where: { isActive: true } },
      promotionalBanners: {
        where: { isActive: true },
        include: {
          images: { orderBy: { order: 'asc' } },
          carouselSettings: true,
        }
      },
      productRecommendations: {
        where: { isActive: true },
        include: {
          products: {
            orderBy: { position: 'asc' }
          }
        }
      },
      savingsDisplays: { where: { isActive: true } },
      freeShippingMessages: { where: { isActive: true } },
      cartTotals: { where: { isActive: true } },
      milestones: {
        where: { isActive: true },
        include: {
          targets: true,
        },
        orderBy: { priority: 'asc' }
      },
      freeGifts: {
        where: { isActive: true },
        include: {
          giftProducts: {
            orderBy: { position: 'asc' },
          },
          targets: true,
        },
        orderBy: { priority: 'asc' }
      },
    },
  });

  if (!cartDrawer) {
    cartDrawer = await prisma.cartDrawer.create({
      data: {
        shop,
        version: editingVersion,
        isActive: true,
      },
      include: {
        freeShippingBars: true,
        promotionalBanners: {
          include: {
            images: { orderBy: { order: 'asc' } },
            carouselSettings: true,
          }
        },
        productRecommendations: {
          include: {
            products: { orderBy: { position: 'asc' } },
          },
        },
        savingsDisplays: true,
        freeShippingMessages: true,
        cartTotals: true,
        milestones: {
          include: {
            targets: true,
          },
          orderBy: { priority: 'asc' }
        },
        freeGifts: {
          include: {
            giftProducts: { orderBy: { position: 'asc' } },
            targets: true,
          },
          orderBy: { priority: 'asc' }
        },
      },
    });
  }

  // Auto-disable features if no data exists
  const updateData: any = {};

  if (cartDrawer.freeShippingProgressBarEnabled && cartDrawer.freeShippingBars.length === 0) {
    updateData.freeShippingProgressBarEnabled = false;
  }

  // Check promotional banner: needs to have either images or at least a banner record
  const hasPromotionalBannerData = cartDrawer.promotionalBanners.length > 0 &&
    cartDrawer.promotionalBanners.some(banner =>
      (banner.images && banner.images.length > 0) || (banner.imageUrls && banner.imageUrls.length > 0) || banner.title
    );
  if (cartDrawer.promotionalBannerEnabled && !hasPromotionalBannerData) {
    updateData.promotionalBannerEnabled = false;
  }

  // Check product recommendations: needs to have products
  const hasProductRecommendationsData = cartDrawer.productRecommendations.length > 0 &&
    cartDrawer.productRecommendations.some(rec => rec.products && rec.products.length > 0);
  if (cartDrawer.productRecommendationsEnabled && !hasProductRecommendationsData) {
    updateData.productRecommendationsEnabled = false;
  }

  if (cartDrawer.savingsDisplayEnabled && cartDrawer.savingsDisplays.length === 0) {
    updateData.savingsDisplayEnabled = false;
  }

  if (cartDrawer.freeShippingMessageEnabled && cartDrawer.freeShippingMessages.length === 0) {
    updateData.freeShippingMessageEnabled = false;
  }

  if (cartDrawer.cartTotalsEnabled && cartDrawer.cartTotals.length === 0) {
    updateData.cartTotalsEnabled = false;
  }

  if (cartDrawer.milestonesEnabled && cartDrawer.milestones.length === 0) {
    updateData.milestonesEnabled = false;
  }

  if (cartDrawer.freeGiftsEnabled && cartDrawer.freeGifts.length === 0) {
    updateData.freeGiftsEnabled = false;
  }

  if (Object.keys(updateData).length > 0) {
    cartDrawer = await prisma.cartDrawer.update({
      where: { shop_version: { shop, version: editingVersion } },
      data: updateData,
      include: {
        freeShippingBars: { where: { isActive: true } },
        promotionalBanners: {
          where: { isActive: true },
          include: {
            images: { orderBy: { order: 'asc' } },
            carouselSettings: true,
          }
        },
        productRecommendations: {
          where: { isActive: true },
          include: {
            products: {
              orderBy: { position: 'asc' }
            }
          }
        },
        savingsDisplays: { where: { isActive: true } },
        freeShippingMessages: { where: { isActive: true } },
        cartTotals: { where: { isActive: true } },
        milestones: {
          where: { isActive: true },
          include: {
            targets: true,
          },
          orderBy: { priority: 'asc' }
        },
        freeGifts: {
          where: { isActive: true },
          include: {
            giftProducts: {
              orderBy: { position: 'asc' },
            },
            targets: true,
          },
          orderBy: { priority: 'asc' }
        },
      },
    });
  }

  const normalizedFeatureOrder = normalizeFeatureOrder(cartDrawer.featureOrder);
  cartDrawer.featureOrder = normalizedFeatureOrder;

  const couponCodeField = await prisma.couponCodeField.findUnique({
    where: { shop },
  });

  return json({
    cartDrawer,
    couponCodeField,
    shop,
    appEmbedEnabled,
    shopDomain: process.env.SHOPIFY_SHOP_DOMAIN || shop,
    error,
    planAccess,
    editingVersion, // Which version is being edited
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  // Get version from URL or formData
  const url = new URL(request.url);
  const editingVersion = url.searchParams.get("version") || "default";

  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "toggle-feature") {
    const featureId = formData.get("featureId") as string;
    const enabled = formData.get("enabled") === "true";

    // Check if data exists before enabling any feature
    if (enabled) {
      const cartDrawer = await prisma.cartDrawer.findUnique({
        where: { shop_version: { shop, version: editingVersion } },
        include: {
          freeShippingBars: { where: { isActive: true } },
          promotionalBanners: {
            where: { isActive: true },
            include: {
              images: { orderBy: { order: 'asc' } },
            }
          },
          productRecommendations: {
            where: { isActive: true },
            include: {
              products: {
                orderBy: { position: 'asc' }
              }
            }
          },
          savingsDisplays: { where: { isActive: true } },
          freeShippingMessages: { where: { isActive: true } },
          cartTotals: { where: { isActive: true } },
          milestones: {
            where: { isActive: true },
            include: {
              targets: true,
            }
          },
          freeGifts: {
            where: { isActive: true },
            include: {
              giftProducts: true,
              targets: true,
            }
          },
        },
      });

      if (!cartDrawer) {
        return redirect(`/app/cart-drawer?version=${editingVersion}&error=feature-not-configured`);
      }

      // Check each feature for required data
      if (featureId === 'free-shipping-bar' && cartDrawer.freeShippingBars.length === 0) {
        return redirect(`/app/cart-drawer?version=${editingVersion}&error=free-shipping-bar-not-configured`);
      }

      // Check promotional banner: needs to have images or banner data
      if (featureId === 'promotional-banner') {
        const hasBannerData = cartDrawer.promotionalBanners.length > 0 &&
          cartDrawer.promotionalBanners.some(banner =>
            (banner.images && banner.images.length > 0) || (banner.imageUrls && banner.imageUrls.length > 0) || banner.title
          );
        if (!hasBannerData) {
          return redirect(`/app/cart-drawer?version=${editingVersion}&error=promotional-banner-not-configured`);
        }
      }

      // Check product recommendations: needs to have products
      if (featureId === 'product-recommendations') {
        const hasProducts = cartDrawer.productRecommendations.length > 0 &&
          cartDrawer.productRecommendations.some(rec => rec.products && rec.products.length > 0);
        if (!hasProducts) {
          return redirect(`/app/cart-drawer?version=${editingVersion}&error=product-recommendations-not-configured`);
        }
      }

      if (featureId === 'savings-display' && cartDrawer.savingsDisplays.length === 0) {
        return redirect(`/app/cart-drawer?version=${editingVersion}&error=savings-display-not-configured`);
      }

      if (featureId === 'free-shipping-message' && cartDrawer.freeShippingMessages.length === 0) {
        return redirect(`/app/cart-drawer?version=${editingVersion}&error=free-shipping-message-not-configured`);
      }

      if (featureId === 'cart-totals' && cartDrawer.cartTotals.length === 0) {
        return redirect(`/app/cart-drawer?version=${editingVersion}&error=cart-totals-not-configured`);
      }

      if (featureId === 'coupon-code') {
        const couponCodeField = await prisma.couponCodeField.findUnique({
          where: { shop },
        });
        if (!couponCodeField) {
          return redirect(`/app/cart-drawer?version=${editingVersion}&error=coupon-code-not-configured`);
        }
      }

      if (featureId === 'milestones' && cartDrawer.milestones.length === 0) {
        return redirect(`/app/cart-drawer?version=${editingVersion}&error=milestones-not-configured`);
      }

      if (featureId === 'free-gifts' && cartDrawer.freeGifts.length === 0) {
        return redirect(`/app/cart-drawer?version=${editingVersion}&error=free-gifts-not-configured`);
      }
    }

    // Map feature IDs to their corresponding database fields
    const featureFieldMap: { [key: string]: any } = {
      'free-shipping-bar': { freeShippingProgressBarEnabled: enabled },
      'promotional-banner': { promotionalBannerEnabled: enabled },
      'product-recommendations': { productRecommendationsEnabled: enabled },
      'coupon-code': { couponCodeFieldEnabled: enabled },
      'savings-display': { savingsDisplayEnabled: enabled },
      'free-shipping-message': { freeShippingMessageEnabled: enabled },
      'cart-totals': { cartTotalsEnabled: enabled },
      'milestones': { milestonesEnabled: enabled },
      'free-gifts': { freeGiftsEnabled: enabled },
    };

    const updateData = featureFieldMap[featureId];
    if (updateData) {
      await prisma.cartDrawer.update({
        where: { shop_version: { shop, version: editingVersion } },
        data: updateData,
      });
      return redirect(`/app/cart-drawer?version=${editingVersion}`);
    }
  }

  if (intent === "update-feature-order") {
    const orderPayload = formData.get("order");
    if (typeof orderPayload !== "string") {
      return json({ error: "Invalid order payload" }, { status: 400 });
    }

    try {
      const parsed = JSON.parse(orderPayload);
      if (!Array.isArray(parsed)) {
        throw new Error("Order should be an array");
      }

      const normalized = normalizeFeatureOrder(parsed as string[]);

      await prisma.cartDrawer.update({
        where: { shop_version: { shop, version: editingVersion } },
        data: { featureOrder: normalized },
      });

      return json({ success: true, featureOrder: normalized });
    } catch (error) {
      console.error("Failed to update feature order", error);
      return json({ error: "Failed to update feature order" }, { status: 500 });
    }
  }

  return json({ error: "Invalid intent" }, { status: 400 });
};

// Enhanced Cart Drawer Preview Component
function MiniCartDrawerPreview({
  cartDrawer,
  couponCodeField,
  featureOrder,
}: {
  cartDrawer: any;
  couponCodeField: any;
  featureOrder: string[];
}) {
  const freeShippingBar = cartDrawer?.freeShippingBars?.[0];
  const promotionalBanner = cartDrawer?.promotionalBanners?.[0];
  const productRecommendation = cartDrawer?.productRecommendations?.[0];
  const savingsDisplay = cartDrawer?.savingsDisplays?.[0];
  const freeShippingMessage = cartDrawer?.freeShippingMessages?.[0];
  const cartTotalsConfig = cartDrawer?.cartTotals?.[0];


  // Dynamic sample cart data based on configuration
  const getSampleCart = () => {
    if (!freeShippingBar) {
      return {
        items: [
          {
            id: 1,
            title: "Premium Running Shoes",
            variant: "Size 8 / Navy Blue",
            price: 50.00,
            originalPrice: 50.00,
            quantity: 1,
            image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=80&h=80&fit=crop&crop=center",
          }
        ],
        total: 2999.00,
        originalTotal: 4999.00,
        savings: 2000.00,
        itemCount: 1,
        item_count: 1,
        total_price: 299900, // in cents
      };
    }

    // Create realistic sample data based on configuration
    let sampleTotal, sampleItemCount;

    if (freeShippingBar.thresholdMode === "amount") {
      const threshold = Number(freeShippingBar.thresholdAmount);
      // Show 60% progress for mini preview
      sampleTotal = threshold * 0.6;
      sampleItemCount = Math.max(1, Math.floor(sampleTotal / 1500));
    } else {
      const threshold = Number(freeShippingBar.thresholdCount);
      // Show 60% progress for mini preview
      sampleItemCount = Math.max(1, Math.floor(threshold * 0.6));
      sampleTotal = sampleItemCount * 1500;
    }

    return {
      items: [
        {
          id: 1,
          title: "Premium Running Shoes",
          variant: "Size 8 / Navy Blue",
          price: sampleTotal / sampleItemCount,
          originalPrice: (sampleTotal / sampleItemCount) * 1.67,
          quantity: sampleItemCount,
          image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=80&h=80&fit=crop&crop=center",
        }
      ],
      total: sampleTotal,
      originalTotal: sampleTotal * 1.67,
      savings: sampleTotal * 0.67,
      itemCount: sampleItemCount,
      item_count: sampleItemCount,
      total_price: Math.round(sampleTotal * 100), // in cents
    };
  };

  const sampleCart = getSampleCart();
  const normalizedOrder = normalizeFeatureOrder(featureOrder ?? cartDrawer.featureOrder);
  const { beforeItems, afterItems } = splitFeatureOrder(normalizedOrder);

  const renderFeature = (featureId: string) => {
    switch (featureId) {
      case 'free-shipping-bar':
        return (
          cartDrawer?.freeShippingProgressBarEnabled && freeShippingBar && (
            <FreeShippingBar
              thresholdMode={freeShippingBar.thresholdMode || 'amount'}
              thresholdAmount={Number(freeShippingBar.thresholdAmount) || 0}
              thresholdCount={Number(freeShippingBar.thresholdCount) || 0}
              beforeThresholdMessage={freeShippingBar.beforeThresholdMessage || 'Add {remaining} for FREE shipping'}
              afterThresholdMessage={freeShippingBar.afterThresholdMessage || "You've unlocked FREE shipping!"}
              backgroundColor={freeShippingBar.backgroundColor || '#f0f9ff'}
              progressBarColor={freeShippingBar.progressBarColor || '#3b82f6'}
              borderColor={freeShippingBar.borderColor || '#e2e8f0'}
              showPercentage={freeShippingBar.showPercentage ?? true}
              currency="INR"
              cart={sampleCart}
              isPreview={true}
            />
          )
        );

      case 'promotional-banner':
        return (
          cartDrawer?.promotionalBannerEnabled && (
            <PromotionalBannerPreview
              slides={promotionalBanner?.images || []}
              carouselSettings={promotionalBanner?.carouselSettings}
              promotionalBanner={promotionalBanner}
            />
          )
        );

      case 'product-recommendations':
        return (
          cartDrawer?.productRecommendationsEnabled && (
            <ProductRecommendations
              title={productRecommendation?.title || "You may also like"}
              products={productRecommendation?.products && productRecommendation.products.length > 0
                ? productRecommendation.products
                : [
                  { id: 'sample1', title: 'Sample Product 1', price: 999, imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=60&h=60&fit=crop&crop=center' },
                  { id: 'sample2', title: 'Sample Product 2', price: 1299, imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=60&h=60&fit=crop&crop=center' },
                  { id: 'sample3', title: 'Sample Product 3', price: 1599, imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=60&h=60&fit=crop&crop=center' },
                  { id: 'sample4', title: 'Sample Product 4', price: 899, imageUrl: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=60&h=60&fit=crop&crop=center' }
                ]}
              layout={productRecommendation?.layout || 'carousel'}
              maxProducts={productRecommendation?.maxProducts || 4}
              showDiscount={productRecommendation?.showDiscount ?? true}
              showDiscountBadge={productRecommendation?.showDiscountBadge ?? true}
              showAddButton={productRecommendation?.showAddButton ?? true}
              onAddToCart={() => { }}
              isPreview={true}
            />
          )
        );

      case 'savings-display':
        return (
          cartDrawer?.savingsDisplayEnabled && savingsDisplay && (
            <SavingsDisplay
              message={savingsDisplay.message || 'You saved {amount}!'}
              amount={Math.round(sampleCart.savings * 100)} // Convert to cents
              backgroundColor={savingsDisplay.backgroundColor || '#dcfce7'}
              textColor={savingsDisplay.textColor || '#15803d'}
              borderColor={savingsDisplay.borderColor || '#ffffff'}
            />
          )
        );

      case 'free-shipping-message':
        return (
          cartDrawer?.freeShippingMessageEnabled && freeShippingMessage && (
            <FreeShippingMessage
              thresholdAmount={Number(freeShippingMessage.thresholdAmount) || 5000}
              cartTotal={Math.round(sampleCart.total * 100)} // Convert to cents
              beforeThresholdMessage={freeShippingMessage.beforeThresholdMessage || 'Add {remaining} more for FREE shipping'}
              achievedMessage={freeShippingMessage.achievedMessage || 'You qualify for FREE shipping!'}
              backgroundColor={freeShippingMessage.backgroundColor || '#fef3c7'}
              textColor={freeShippingMessage.textColor || '#92400e'}
              borderColor={freeShippingMessage.borderColor || '#92400e'}
              icon={freeShippingMessage.icon || '🚚'}
              currency="INR"
              isPreview={true}
            />
          ));

        {/* Coupon Code Field */ }
      case 'coupon-code':
        return (cartDrawer?.couponCodeFieldEnabled && couponCodeField && (
          <CouponCodeField
            id="upsellity-coupon-field-mini-preview"
            placeholder={couponCodeField.placeholder || 'Enter coupon code'}
            buttonText={couponCodeField.buttonText || 'Apply'}
            showAllOffers={couponCodeField.showAllOffers || false}
            showAllOffersButtonText={couponCodeField.showAllOffersButtonText || 'Show all offers'}
            enableAutoApply={couponCodeField.enableAutoApply || false}
            appliedDiscount={couponCodeField.enableAutoApply ? {
              code: 'SUMMER20',
              title: 'Summer Sale',
              description: '20% OFF',
              type: 'percentage',
              value: 20
            } : null}
            availableDiscounts={couponCodeField.showAllOffers ? [
              { code: 'SAVE10', title: 'Welcome Offer', description: '10% OFF', type: 'percentage', value: 10 },
              { code: 'SUMMER20', title: 'Summer Sale', description: '20% OFF', type: 'percentage', value: 20 },
              { code: 'FLAT500', title: 'Flat Discount', description: '₹500 OFF', type: 'fixed', value: 500 }
            ] : []}
            backgroundColor={(couponCodeField as any)?.backgroundColor || '#d1fae5'}
            textColor={(couponCodeField as any)?.textColor || '#065f46'}
            couponCodeColor={(couponCodeField as any)?.couponCodeColor || ''}
            borderColor={(couponCodeField as any)?.borderColor || '#059669'}
            appliedDiscountText={(couponCodeField as any)?.appliedDiscountText || ''}
            onApplyCoupon={() => { }}
            onRemoveDiscount={() => { }}
            onSwitchDiscount={() => { }}
            isPreview={true}
          />
        ));

      case 'milestones':
        return (
          cartDrawer?.milestonesEnabled && cartDrawer.milestones && cartDrawer.milestones.length > 0 && (
            <MilestonesWidget
              milestones={cartDrawer.milestones.map((m: any) => {
                const targetAmount = parseFloat(m.targetAmount.toString());
                const progress = Math.min((sampleCart.total / targetAmount) * 100, 100);
                const remaining = Math.max(targetAmount - sampleCart.total, 0);
                const status = sampleCart.total >= targetAmount ? 'unlocked' : sampleCart.total > 0 ? 'in_progress' : 'locked';

                const rewardText = m.title;
                const remainingFormatted = `₹${remaining.toFixed(2)} `;

                const message =
                  status === 'unlocked'
                    ? m.unlockedMessage?.replace('{reward}', rewardText) || `🎉 You've unlocked ${rewardText}!`
                    : status === 'in_progress'
                      ? m.inProgressMessage?.replace('{remaining}', remainingFormatted).replace('{reward}', rewardText) || `Only ${remainingFormatted} away from ${rewardText}!`
                      : m.lockedMessage?.replace('{remaining}', remainingFormatted).replace('{reward}', rewardText) || `Add ${remainingFormatted} to unlock ${rewardText}`;

                return {
                  id: m.id,
                  title: m.title,
                  description: m.description,
                  targetAmount,
                  rewardType: m.rewardType,
                  rewardValue: m.rewardValue ? parseFloat(m.rewardValue.toString()) : null,
                  icon: m.icon,
                  status,
                  progress,
                  remaining,
                  message,
                  showProgressBar: m.showProgressBar,
                  iconColor: m.iconColor,
                  titleColor: m.titleColor,
                  amountColor: m.amountColor,
                };
              })}
              cartTotal={sampleCart.total}
              isPreview={true}
              progressBarColor={(cartDrawer as any).milestonesProgressBarColor || "#3b82f6"}
              allUnlockedMessage={(cartDrawer as any).milestonesAllUnlockedMessage}
            />
          )
        );

      case 'free-gifts':
        return (
          cartDrawer?.freeGiftsEnabled && cartDrawer.freeGifts && cartDrawer.freeGifts.length > 0 && (
            <FreeGiftSelector
              freeGifts={cartDrawer.freeGifts.map((fg: any) => ({
                id: fg.id,
                name: fg.name,
                triggerType: fg.triggerType,
                triggerValue: parseFloat(fg.triggerValue.toString()),
                customerLimit: fg.customerLimit,
                discountCode: fg.discountCode,
                giftProducts: fg.giftProducts.map((p: any) => ({
                  id: p.id,
                  shopifyProductId: p.shopifyProductId,
                  shopifyVariantId: p.shopifyVariantId,
                  title: p.title,
                  price: 0, // Free gifts are always price 0 (discount applies at checkout)
                  compareAtPrice: p.compareAtPrice ? parseFloat(p.compareAtPrice.toString()) : parseFloat(p.price.toString()),
                  imageUrl: p.imageUrl,
                  handle: p.handle,
                })),
                qualified: true,
              }))}
              selectedGiftId={null}
              onSelectGift={() => { }}
              isPreview={true}
            />
          )
        );

      default:
        return null;
    }
  };

  return (
    <div style={{
      width: '100%',
      maxWidth: '380px',
      border: '1px solid #e5e7eb',
      borderRadius: '16px',
      backgroundColor: '#ffffff',
      boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.15)',
      overflow: 'hidden',
      position: 'relative',
      transformOrigin: 'top center',
    }}>
      {/* Header */}
      <div style={{
        padding: '8px 12px',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        position: 'relative'
      }}>
        <div>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '700',
            margin: 0,
            color: '#111827',
            lineHeight: '1.2'
          }}>
            Cart Drawer Preview
          </h3>
        </div>
        <button style={{
          background: 'none',
          border: 'none',
          fontSize: '24px',
          cursor: 'pointer',
          color: '#6b7280',
          padding: '8px',
          borderRadius: '8px',
          transition: 'all 0.2s',
          lineHeight: '1',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '40px',
          height: '40px'
        }}>×</button>
      </div>

      <div style={{ padding: '16px 16px 16px 16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {beforeItems.map((featureId) => (
            <React.Fragment key={featureId}>{renderFeature(featureId)}</React.Fragment>
          ))}

          {/* Cart Items */}
          <div style={{ marginBottom: '8px' }}>
            <CartItems
              items={sampleCart.items.map(item => ({
                key: String(item.id),
                title: item.title,
                variant_title: item.variant,
                price: Math.round(item.price * 100), // Convert to cents
                final_price: Math.round(item.price * 100),
                quantity: item.quantity,
                line_price: Math.round(item.price * item.quantity * 100),
                original_line_price: Math.round(item.originalPrice * item.quantity * 100),
                original_price: Math.round(item.originalPrice * 100),
                variant_id: item.id,
                image: item.image
              }))}
              productCompareAtPrices={{}}
              appliedDiscount={null}
              onUpdateQuantity={() => { }}
              onRemoveItem={() => { }}
              isPreview={true}
            />
          </div>

          {/* Feature sections rendered via featureOrder */}

          {afterItems.map((featureId) => (
            <React.Fragment key={featureId}>{renderFeature(featureId)}</React.Fragment>
          ))}

          {/* Cart Totals */}
          <CartTotals
            items={[{
              original_price: Math.round(sampleCart.originalTotal / sampleCart.itemCount),
              final_price: Math.round(sampleCart.total / sampleCart.itemCount),
              quantity: sampleCart.itemCount
            }]}
            totalPrice={Math.round(sampleCart.total * 100)} // Convert to cents
            appliedDiscount={null}
            config={cartTotalsConfig ? {
              showOriginalPrice: cartTotalsConfig.showOriginalPrice,
              showItemDiscounts: cartTotalsConfig.showItemDiscounts,
              showSubtotal: cartTotalsConfig.showSubtotal,
              showCouponDiscount: cartTotalsConfig.showCouponDiscount,
              showTaxNotice: cartTotalsConfig.showTaxNotice,
              subtotalLabel: cartTotalsConfig.subtotalLabel,
              totalLabel: cartTotalsConfig.totalLabel,
              taxNoticeText: cartTotalsConfig.taxNoticeText,
              originalPriceLabel: cartTotalsConfig.originalPriceLabel,
              itemDiscountsLabel: cartTotalsConfig.itemDiscountsLabel,
              borderColor: cartTotalsConfig.borderColor,
              backgroundColor: cartTotalsConfig.backgroundColor,
              textColor: cartTotalsConfig.textColor,
              totalTextColor: cartTotalsConfig.totalTextColor,
              discountColor: cartTotalsConfig.discountColor,
            } : undefined}
            isPreview={true}
          />

          {/* Checkout Button */}
          <button style={{
            width: '100%',
            padding: '16px',
            backgroundColor: '#1f2937',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: '700',
            cursor: 'pointer',
            marginTop: '0px',
            boxShadow: '0 4px 12px -2px rgba(31, 41, 55, 0.3)',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <span>Checkout</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CartDrawerIndex() {
  const loaderData = useLoaderData<typeof loader>();
  const submit = useSubmit();
  const fetcher = useFetcher();
  const navigate = useNavigate();

  // Check if we need to redirect for billing
  if ('billingRedirectUrl' in loaderData) {
    if (typeof window !== 'undefined') {
      window.top!.location.href = loaderData.billingRedirectUrl;
    }
    return null;
  }

  const { cartDrawer, couponCodeField, appEmbedEnabled, shopDomain, error, planAccess, editingVersion } = loaderData as Exclude<typeof loaderData, { billingRedirectUrl: string }>;

  const [featureOrder, setFeatureOrder] = useState<string[]>(() =>
    normalizeFeatureOrder(cartDrawer.featureOrder)
  );
  const [draggedFeatureId, setDraggedFeatureId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [showManualAssignModal, setShowManualAssignModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const currentVersion = editingVersion; // Alias for clarity in UI

  React.useEffect(() => {
    setFeatureOrder(normalizeFeatureOrder(cartDrawer.featureOrder));
  }, [cartDrawer.featureOrder]);

  const persistFeatureOrder = React.useCallback(
    (order: string[]) => {
      const formData = new FormData();
      formData.append("intent", "update-feature-order");
      formData.append("order", JSON.stringify(order));
      fetcher.submit(formData, { method: "post" });
    },
    [fetcher]
  );

  const arraysEqual = React.useCallback((a: string[], b: string[]) => {
    if (a === b) return true;
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i += 1) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }, []);

  const handleDragStart = React.useCallback(
    (featureId: string) => (event: React.DragEvent<HTMLDivElement>) => {
      setDraggedFeatureId(featureId);
      event.dataTransfer.effectAllowed = "move";
    },
    []
  );

  const handleDragOver = React.useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const handleDrop = React.useCallback(
    (targetId: string) => (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      if (!draggedFeatureId || draggedFeatureId === targetId) {
        return;
      }

      setFeatureOrder((current) => {
        const next = reorderFeatureOrder(current, draggedFeatureId, targetId);
        if (arraysEqual(current, next)) {
          return current;
        }
        persistFeatureOrder(next);
        return next;
      });
      setDraggedFeatureId(null);
      setDragOverId(null);
    },
    [arraysEqual, draggedFeatureId, persistFeatureOrder]
  );

  const handleDragEnd = React.useCallback(() => {
    setDraggedFeatureId(null);
    setDragOverId(null);
  }, []);

  const handleToggleFeature = (featureId: string, currentEnabled: boolean) => {
    const formData = new FormData();
    formData.append("intent", "toggle-feature");
    formData.append("featureId", featureId);
    formData.append("enabled", (!currentEnabled).toString());
    submit(formData, { method: "post" });
  };

  const features = [
    {
      id: 'free-shipping-bar',
      title: 'Free Shipping Progress Bar',
      description: 'Display remaining amount for free shipping.',
      icon: ChartVerticalIcon,
      enabled: cartDrawer.freeShippingProgressBarEnabled,
      count: cartDrawer.freeShippingBars.length,
      path: '/app/cart-drawer/free-shipping-bar',
      isConfigured: cartDrawer.freeShippingBars.length > 0,
    },
    {
      id: 'milestones',
      title: 'Cart Milestones',
      description: 'Rewards at cart value thresholds',
      icon: GiftCardIcon,
      enabled: cartDrawer.milestonesEnabled,
      count: cartDrawer.milestones.length,
      path: '/app/cart-drawer/milestones',
      isConfigured: cartDrawer.milestones.length > 0,
    },
    {
      id: 'free-gifts',
      title: 'Free Gifts',
      description: 'Let customers choose free gifts on qualifying orders',
      icon: GiftCardIcon,
      enabled: cartDrawer.freeGiftsEnabled,
      count: cartDrawer.freeGifts.length,
      path: '/app/cart-drawer/free-gifts',
      isConfigured: cartDrawer.freeGifts.length > 0,
    },
    {
      id: 'promotional-banner',
      title: 'Promotional Banner',
      description: 'Display promotional offers and sales in the cart',
      icon: MegaphoneIcon,
      enabled: cartDrawer.promotionalBannerEnabled,
      count: cartDrawer.promotionalBanners.length,
      path: '/app/cart-drawer/promotional-banner',
      isConfigured: cartDrawer.promotionalBanners.length > 0 &&
        cartDrawer.promotionalBanners.some(banner =>
          (banner.images && banner.images.length > 0) ||
          (banner.imageUrls && banner.imageUrls.length > 0) ||
          banner.title
        ),
    },
    {
      id: 'product-recommendations',
      title: 'Product Recommendations',
      description: 'Upsell related products with "You may also like"',
      icon: ProductIcon,
      enabled: cartDrawer.productRecommendationsEnabled,
      count: cartDrawer.productRecommendations.length,
      path: '/app/cart-drawer/product-recommendations',
      isConfigured: cartDrawer.productRecommendations.length > 0 &&
        cartDrawer.productRecommendations.some(rec =>
          rec.products && rec.products.length > 0
        ),
    },
    {
      id: 'coupon-code',
      title: 'Coupon Code Field',
      description: 'Allow customers to apply discount codes in cart',
      icon: DiscountIcon,
      enabled: cartDrawer.couponCodeFieldEnabled,
      count: couponCodeField ? 1 : 0,
      path: '/app/cart-drawer/coupon-code',
      isConfigured: couponCodeField !== null,
    },
    {
      id: 'savings-display',
      title: 'Savings Display',
      description: 'Show total amount saved to encourage checkout',
      icon: CashDollarIcon,
      enabled: cartDrawer.savingsDisplayEnabled,
      count: cartDrawer.savingsDisplays.length,
      path: '/app/cart-drawer/savings-display',
      isConfigured: cartDrawer.savingsDisplays.length > 0,
    },
    {
      id: 'free-shipping-message',
      title: 'Free Shipping Message',
      description: 'Display free shipping threshold at bottom of cart',
      icon: DeliveryIcon,
      enabled: cartDrawer.freeShippingMessageEnabled,
      count: cartDrawer.freeShippingMessages.length,
      path: '/app/cart-drawer/free-shipping-message',
      isConfigured: cartDrawer.freeShippingMessages.length > 0,
    },
    {
      id: 'cart-totals',
      title: 'Cart Totals',
      description: 'Customize cart totals display and styling',
      icon: CalculatorIcon,
      enabled: cartDrawer.cartTotalsEnabled,
      count: cartDrawer.cartTotals.length,
      path: '/app/cart-drawer/cart-totals',
      isConfigured: cartDrawer.cartTotals.length > 0,
    },
  ];

  const featureLookup = React.useMemo(() => {
    const map = new Map<string, (typeof features)[number]>();
    features.forEach((feature) => {
      map.set(feature.id, feature);
    });
    return map;
  }, [features]);

  const orderedFeatureCards = React.useMemo(() => {
    const normalized = normalizeFeatureOrder(featureOrder);
    const ordered = normalized
      .map((id) => {
        if (id === FEATURE_ORDER_SENTINEL) {
          return { id: FEATURE_ORDER_SENTINEL, isCartItems: true };
        }
        return featureLookup.get(id);
      })
      .filter((item): item is (typeof features)[number] | { id: string; isCartItems: boolean } => Boolean(item));

    const missing = features.filter((feature) => !ordered.some(item => 'isCartItems' in item ? false : item.id === feature.id));
    return [...ordered, ...missing];
  }, [featureLookup, featureOrder, features]);

  return (
    <Page>
      <TitleBar title="Cart Drawer Customization" />

      <div style={{
        display: 'flex',
        gap: '24px',
        minHeight: 'calc(100vh - 200px)',
        padding: '0'
      }}>
        {/* LEFT SIDE - Configuration Options */}
        <div style={{
          flex: '0 0 60%',
          minWidth: '500px',
          paddingRight: '12px'
        }}>
          <BlockStack gap="500">
            {/* Header Card */}
            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between" blockAlign="center">
                  <BlockStack gap="100">
                    <InlineStack gap="200" blockAlign="center">
                      <Text as="h2" variant="headingLg">
                        Customize Your Cart Drawer
                      </Text>
                      <Badge tone={appEmbedEnabled ? "success" : "warning"}>
                        {appEmbedEnabled ? "Enabled" : "Disabled"}
                      </Badge>
                    </InlineStack>
                    {!appEmbedEnabled &&
                      <Text as="p" variant="bodyMd" tone="subdued">
                        Enable and configure features to enhance your cart drawer. Toggle features on/off to see how they enhance the shopping experience.
                      </Text>}
                  </BlockStack>
                  {!appEmbedEnabled &&
                    <Button
                      url="/app/cart-drawer/installation"
                      variant="secondary"
                    >
                      View Installation Instructions
                    </Button>
                  }
                </InlineStack>
              </BlockStack>
            </Card>

            {/* App Embed Activation Banner */}
            {!appEmbedEnabled && (
              <Card>
                <BlockStack gap="400">
                  <InlineStack gap="200" blockAlign="start">
                    <Box>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        backgroundColor: '#FEF3C7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px'
                      }}>
                        ⚠️
                      </div>
                    </Box>
                    <BlockStack gap="200">
                      <Text as="h3" variant="headingMd">
                        Please connect Upsellity Bridge
                      </Text>
                      <Text as="p" variant="bodyMd" tone="subdued">
                        Now that you've installed Upsellity, you need to enable the <strong>Upsellity Bridge</strong> in your Shopify theme. This will not set your cart live yet.
                      </Text>
                      <BlockStack gap="200">
                        <Text as="p" variant="bodyMd">
                          <strong>1.</strong> Click the button below to enable the Upsellity Bridge from your theme editor.
                        </Text>
                        <Text as="p" variant="bodyMd">
                          <strong>2.</strong> Ensure the Upsellity Bridge is toggled on and click <strong>save</strong>.
                        </Text>
                      </BlockStack>
                      <Box paddingBlockStart="200">
                        <Button
                          variant="primary"
                          url={`https://admin.shopify.com/store/${shopDomain.split('.')[0]}/themes/current/editor?context=apps`}
                          target="_blank"
                        >
                          Click here to enable the Upsellity Bridge
                        </Button>
                      </Box>
                    </BlockStack>
                  </InlineStack>
                </BlockStack>
              </Card>
            )}

            {/* Feature Configuration Cards */}
            <BlockStack gap="400">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 8px',
                margin: '4px 0 -4px 0',
                color: '#6b7280',
                fontSize: '12px',
                fontWeight: 600
              }}>
                <span aria-hidden="true" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" style={{ opacity: 0.7 }}>
                    <circle cx="5" cy="5" r="1.5" />
                    <circle cx="10" cy="5" r="1.5" />
                    <circle cx="15" cy="5" r="1.5" />
                    <circle cx="5" cy="10" r="1.5" />
                    <circle cx="10" cy="10" r="1.5" />
                    <circle cx="15" cy="10" r="1.5" />
                  </svg>
                </span>
                <span>Drag to reorder features</span></div><Button onClick={() => setShowVersionModal(true)} icon={ChartVerticalIcon} size="slim">Manage Versions</Button></div>
              {orderedFeatureCards.map((item) => {
                const isCartItems = 'isCartItems' in item && item.isCartItems;
                const feature = isCartItems ? null : item as (typeof features)[number];
                const itemId = isCartItems ? FEATURE_ORDER_SENTINEL : feature!.id;

                return (
                  <div
                    key={itemId}
                    draggable
                    onDragStart={handleDragStart(itemId)}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop(itemId)}
                    onDragEnd={handleDragEnd}
                    onDragEnter={() => setDragOverId(itemId)}
                    onDragLeave={(e) => {
                      if (e.currentTarget === e.target) {
                        setDragOverId((current) => (current === itemId ? null : current));
                      }
                    }}
                    style={{
                      cursor: 'grab',
                      opacity: draggedFeatureId === itemId ? 0.6 : 1,
                      transition: 'box-shadow 0.15s ease, transform 0.15s ease, background-color 0.15s ease',
                      boxShadow: dragOverId === itemId ? '0 0 0 2px #93c5fd inset, 0 2px 8px rgba(59,130,246,0.15)' : 'none',
                      backgroundColor: dragOverId === itemId ? '#f8fafc' : 'transparent',
                      borderRadius: '12px'
                    }}
                  >
                    <Card>
                      <BlockStack gap="400">
                        <InlineStack align="space-between" blockAlign="center">
                          <InlineStack gap="300" blockAlign="center">
                            <Box>
                              <div
                                aria-label="Drag to reorder"
                                title="Drag to reorder"
                                style={{
                                  width: '20px',
                                  height: '28px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#9ca3af',
                                  cursor: 'grab',
                                }}
                              >
                                <svg width="12" height="16" viewBox="0 0 12 16" fill="currentColor">
                                  <circle cx="3" cy="3" r="1.3" />
                                  <circle cx="9" cy="3" r="1.3" />
                                  <circle cx="3" cy="8" r="1.3" />
                                  <circle cx="9" cy="8" r="1.3" />
                                  <circle cx="3" cy="13" r="1.3" />
                                  <circle cx="9" cy="13" r="1.3" />
                                </svg>
                              </div>
                            </Box>
                            <Box>
                              <Icon source={isCartItems ? ProductIcon : feature!.icon} tone="base" />
                            </Box>
                            <BlockStack gap="100">
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                <Text as="h3" variant="headingMd">
                                  {isCartItems ? 'Selected Items' : feature!.title}
                                </Text>
                                {!isCartItems && !feature!.isConfigured && (
                                  <span style={{
                                    fontSize: '9px',
                                    color: '#92400e',
                                    backgroundColor: '#fef3c7',
                                    padding: '2px 10px',
                                    borderRadius: '10px',
                                    fontWeight: 600,
                                    lineHeight: '1.4',
                                    whiteSpace: 'nowrap',
                                    border: '1px solidrgb(227, 171, 30)'
                                  }}>
                                    Not Configured
                                  </span>
                                )}
                                {isCartItems && (
                                  <Badge tone="info">Cart Items</Badge>
                                )}
                              </div>
                              <Text as="p" variant="bodyMd" tone="subdued">
                                {isCartItems ? 'Products added to cart by the customer' : feature!.description}
                              </Text>
                            </BlockStack>
                          </InlineStack>
                          {!isCartItems && (
                            <InlineStack gap="200">
                              <Button
                                onClick={() => handleToggleFeature(feature!.id, feature!.enabled)}
                                variant={feature!.enabled ? "secondary" : "primary"}
                                disabled={!feature!.isConfigured && !feature!.enabled}
                              >
                                {feature!.enabled ? "Disable" : "Enable"}
                              </Button>
                              <Button
                                url={feature!.path}
                                variant="primary"
                              >
                                Configure
                              </Button>
                            </InlineStack>
                          )}
                        </InlineStack>
                      </BlockStack>
                    </Card>
                  </div>
                );
              })}
            </BlockStack>
          </BlockStack>
        </div>

        {/* RIGHT SIDE - Live Preview */}
        <div style={{
          flex: '0 0 40%',
          minWidth: '350px',
          paddingLeft: '12px',
          position: 'sticky',
          top: '0',
          height: 'fit-content',
          maxHeight: 'calc(100vh)',
          overflowY: 'auto'
        }}>
          <MiniCartDrawerPreview
            cartDrawer={cartDrawer}
            couponCodeField={couponCodeField}
            featureOrder={featureOrder}
          />
        </div>
      </div>

      {/* Version Management Modal */}
      <VersionManagementModal
        open={showVersionModal}
        onClose={() => setShowVersionModal(false)}
        currentVersion={currentVersion}
        onVersionSwitch={(versionKey) => {
          setShowVersionModal(false);
          navigate(`/app/cart-drawer?version=${versionKey}`);
        }}
      />
    </Page>
  );
}

