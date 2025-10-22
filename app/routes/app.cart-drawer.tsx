import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, Link, useSubmit } from "@remix-run/react";
import { useState } from "react";
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
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { 
  ChartVerticalIcon,
  MegaphoneIcon,
  ProductIcon,
  DiscountIcon,
  CashDollarIcon,
  DeliveryIcon,
} from '@shopify/polaris-icons';
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  // Get or create cart drawer configuration
  let cartDrawer = await prisma.cartDrawer.findUnique({
    where: { shop },
    include: {
      freeShippingBars: { where: { isActive: true } },
      promotionalBanners: { where: { isActive: true } },
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
    },
  });

  if (!cartDrawer) {
    cartDrawer = await prisma.cartDrawer.create({
      data: {
        shop,
        isActive: true,
      },
      include: {
        freeShippingBars: true,
        promotionalBanners: true,
        productRecommendations: {
          include: {
            products: {
              orderBy: { position: 'asc' }
            }
          }
        },
        savingsDisplays: true,
        freeShippingMessages: true,
      },
    });
  }

  const couponCodeField = await prisma.couponCodeField.findUnique({
    where: { shop },
  });

  return json({ cartDrawer, couponCodeField, shop });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "toggle-feature") {
    const featureId = formData.get("featureId") as string;
    const enabled = formData.get("enabled") === "true";

    console.log('Action - Toggle Feature:', { featureId, enabled, shop });

    // Map feature IDs to their corresponding database fields
    const featureFieldMap: { [key: string]: any } = {
      'free-shipping-bar': { freeShippingProgressBarEnabled: enabled },
      'promotional-banner': { promotionalBannerEnabled: enabled },
      'product-recommendations': { productRecommendationsEnabled: enabled },
      'coupon-code': { couponCodeFieldEnabled: enabled },
      'savings-display': { savingsDisplayEnabled: enabled },
      'free-shipping-message': { freeShippingMessageEnabled: enabled },
    };

    const updateData = featureFieldMap[featureId];
    if (updateData) {
      console.log('Action - Updating database:', updateData);
      await prisma.cartDrawer.update({
        where: { shop },
        data: updateData,
      });
      console.log('Action - Database updated, redirecting...');
      return redirect("/app/cart-drawer");
    }
  }

  return json({ error: "Invalid intent" }, { status: 400 });
};

// Enhanced Cart Drawer Preview Component
function MiniCartDrawerPreview({ cartDrawer, couponCodeField }: { cartDrawer: any, couponCodeField: any }) {
  // Debug: Log the current configuration state
  console.log('Preview - Cart Drawer Config:', {
    promotionalBannerEnabled: cartDrawer?.promotionalBannerEnabled,
    freeShippingMessageEnabled: cartDrawer?.freeShippingMessageEnabled,
    freeShippingProgressBarEnabled: cartDrawer?.freeShippingProgressBarEnabled,
    savingsDisplayEnabled: cartDrawer?.savingsDisplayEnabled,
    productRecommendationsEnabled: cartDrawer?.productRecommendationsEnabled,
    couponCodeFieldEnabled: cartDrawer?.couponCodeFieldEnabled
  });
  // Enhanced sample cart data for preview
  const sampleCart = {
    items: [
      {
        id: 1,
        title: "Premium Running Shoes",
        variant: "Size 8 / Navy Blue",
        price: 2999.00,
        originalPrice: 4999.00,
        quantity: 1,
        image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=80&h=80&fit=crop&crop=center",
      }
    ],
    total: 2999.00,
    originalTotal: 4999.00,
    savings: 2000.00,
    itemCount: 1,
  };

  const freeShippingBar = cartDrawer?.freeShippingBars?.[0];
  const promotionalBanner = cartDrawer?.promotionalBanners?.[0];
  const productRecommendation = cartDrawer?.productRecommendations?.[0];
  const savingsDisplay = cartDrawer?.savingsDisplays?.[0];
  const freeShippingMessage = cartDrawer?.freeShippingMessages?.[0];

  // Sample data for preview when no real data exists
  const samplePromotionalBanner = promotionalBanner || {
    text: "🎉 Special Offer: 20% off on all items!",
    backgroundColor: "#fef3c7",
    textColor: "#92400e"
  };

  const sampleFreeShippingMessage = freeShippingMessage || {
    message: "🚚 Free shipping on orders over ₹5000"
  };

  const sampleFreeShippingBar = freeShippingBar || {
    thresholdAmount: 5000,
    text: "Add ₹{remaining} for FREE shipping"
  };

  // Calculate free shipping progress
  const calculateProgress = () => {
    const threshold = Number(sampleFreeShippingBar.thresholdAmount);
    return Math.min((sampleCart.total / threshold) * 100, 100);
  };

  const calculateRemaining = () => {
    const threshold = Number(sampleFreeShippingBar.thresholdAmount);
    return Math.max(threshold - sampleCart.total, 0);
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
      transform: 'scale(0.75)',
      transformOrigin: 'top center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
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
          <p style={{ 
            fontSize: '14px', 
            color: '#6b7280', 
            margin: '2px 0 0 0',
            fontWeight: '500'
          }}>
            {sampleCart.itemCount} {sampleCart.itemCount === 1 ? 'item' : 'items'}
          </p>
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
          {/* Free Shipping Progress Bar */}
          {cartDrawer?.freeShippingProgressBarEnabled && (
            <div style={{ 
              padding: '8px',
              background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
              borderRadius: '8px',
              border: '1px solid #bae6fd',
              marginBottom: '2px'
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '6px'
              }}>
                <span style={{ 
                  color: '#0c4a6e',
                  fontSize: '14px',
                  fontWeight: '600'
                }}>
                  Add ₹{Math.round(calculateRemaining())} for FREE shipping
                </span>
                <span style={{ 
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: '16px',
                  fontSize: '12px',
                  fontWeight: '700',
                  boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)'
                }}>
                  {calculateProgress().toFixed(0)}%
                </span>
              </div>
              <div style={{ 
                width: '100%', 
                height: '10px', 
                backgroundColor: '#e0f2fe',
                borderRadius: '6px',
                overflow: 'hidden',
                boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.1)'
              }}>
                <div style={{
                  width: `${calculateProgress()}%`,
                  height: '100%',
                  background: calculateProgress() >= 100
                    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                    : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  borderRadius: '6px',
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>
          )}

          {/* Promotional Banner */}
          {cartDrawer?.promotionalBannerEnabled && (
            <div style={{
              padding: '16px 20px',
              backgroundColor: '#fef3c7',
              color: '#92400e',
              borderRadius: '12px',
              textAlign: 'center',
              fontSize: '15px',
              fontWeight: '800',
              marginBottom: '8px',
              border: '2px solid #f59e0b',
              boxShadow: '0 4px 8px rgba(245, 158, 11, 0.2)',
              position: 'relative',
              overflow: 'hidden',
              background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)'
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(45deg, rgba(255,255,255,0.3) 0%, transparent 50%)',
                pointerEvents: 'none'
              }} />
              <span style={{ 
                position: 'relative', 
                zIndex: 1,
                textShadow: '0 1px 2px rgba(0,0,0,0.1)'
              }}>
                🎉 Special Offer: 20% off on all items!
              </span>
            </div>
          )}

          {/* Cart Items */}
          <div style={{ marginBottom: '8px' }}>
            {sampleCart.items.map((item) => (
              <div key={item.id} style={{ 
                display: 'flex', 
                gap: '12px',
                padding: '12px 0',
                borderBottom: '1px solid #f3f4f6',
                alignItems: 'flex-start'
              }}>
                <img 
                  src={item.image} 
                  alt={item.title}
                  style={{ 
                    width: '60px', 
                    height: '60px', 
                    objectFit: 'cover',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    flexShrink: 0
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ 
                    fontWeight: '600', 
                    marginBottom: '4px', 
                    fontSize: '14px', 
                    color: '#111827',
                    lineHeight: '1.3'
                  }}>
                    {item.title}
                  </div>
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#6b7280', 
                    marginBottom: '6px',
                    lineHeight: '1.3'
                  }}>
                    {item.variant}
                  </div>
                  <div style={{ marginBottom: '6px' }}>
                    <span style={{ 
                      textDecoration: 'line-through', 
                      color: '#9ca3af',
                      fontSize: '12px',
                      marginRight: '8px'
                    }}>
                      ₹{Math.round(item.originalPrice * item.quantity)}
                    </span>
                    <span style={{ 
                      fontWeight: '700', 
                      fontSize: '16px', 
                      color: '#111827' 
                    }}>
                      ₹{Math.round(item.price * item.quantity)}
                    </span>
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    marginTop: '6px'
                  }}>
                    <button style={{
                      width: '28px',
                      height: '28px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      background: '#ffffff',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#374151',
                      transition: 'all 0.2s'
                    }}>-</button>
                    <span style={{ 
                      fontSize: '14px', 
                      fontWeight: '600', 
                      minWidth: '20px', 
                      textAlign: 'center',
                      color: '#111827'
                    }}>
                      {item.quantity}
                    </span>
                    <button style={{
                      width: '28px',
                      height: '28px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      background: '#ffffff',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#374151',
                      transition: 'all 0.2s'
                    }}>+</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Product Recommendations */}
          {cartDrawer?.productRecommendationsEnabled && (
            <div style={{ marginTop: '8px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                {productRecommendation?.title || "You may also like"}
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {productRecommendation?.products && productRecommendation.products.length > 0 ? (
                  productRecommendation.products.slice(0, productRecommendation.maxProducts || 4).map((product: any, index: number) => (
                    <div key={product.id} style={{ 
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      padding: '8px',
                      textAlign: 'center'
                    }}>
                      {product.imageUrl ? (
                        <img 
                          src={product.imageUrl} 
                          alt={product.title}
                          style={{ 
                            width: '100%', 
                            height: '40px', 
                            objectFit: 'cover',
                            borderRadius: '4px',
                            marginBottom: '4px'
                          }} 
                        />
                      ) : (
                        <div style={{ 
                          width: '100%', 
                          height: '40px', 
                          backgroundColor: '#f3f4f6',
                          borderRadius: '4px',
                          marginBottom: '4px'
                        }} />
                      )}
                      <div style={{ fontSize: '10px', fontWeight: '500', marginBottom: '2px' }}>
                        {product.title.length > 15 ? product.title.substring(0, 15) + '...' : product.title}
                      </div>
                      <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '4px' }}>
                        ₹{Math.round(product.price)}
                      </div>
                      {product.compareAtPrice && product.compareAtPrice > product.price && (
                        <div style={{ fontSize: '9px', color: '#10b981', fontWeight: '600', marginBottom: '4px' }}>
                          {Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)}% off
                        </div>
                      )}
                      <button style={{
                        width: '100%',
                        padding: '4px 8px',
                        backgroundColor: '#f97316',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}>
                        + Add
                      </button>
                    </div>
                  ))
                ) : (
                  // Sample product recommendations when no real data
                  [
                    { id: 'sample1', title: 'Sample Product 1', price: 999, imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=60&h=60&fit=crop&crop=center' },
                    { id: 'sample2', title: 'Sample Product 2', price: 1299, imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=60&h=60&fit=crop&crop=center' }
                  ].map((product: any, index: number) => (
                    <div key={product.id} style={{ 
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      padding: '8px',
                      textAlign: 'center'
                    }}>
                      <img 
                        src={product.imageUrl} 
                        alt={product.title}
                        style={{ 
                          width: '100%', 
                          height: '60px', 
                          objectFit: 'cover',
                          borderRadius: '4px',
                          marginBottom: '6px'
                        }}
                      />
                      <div style={{ fontSize: '11px', fontWeight: '600', marginBottom: '4px' }}>
                        {product.title}
                      </div>
                      <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '6px' }}>
                        ₹{product.price}
                      </div>
                      <button style={{
                        width: '100%',
                        padding: '4px 8px',
                        backgroundColor: '#f97316',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}>
                        + Add
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Savings Display */}
          {cartDrawer?.savingsDisplayEnabled && (
            <div style={{
              padding: '8px 12px',
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '6px',
              textAlign: 'center',
              fontSize: '12px',
              fontWeight: '600',
              color: '#166534'
            }}>
              You saved ₹{Math.round(sampleCart.savings)}!
            </div>
          )}

          {/* Free Shipping Message */}
          {cartDrawer?.freeShippingMessageEnabled && (
            <div style={{
              padding: '14px 18px',
              backgroundColor: '#f0f9ff',
              border: '2px solid #0ea5e9',
              borderRadius: '12px',
              textAlign: 'center',
              fontSize: '14px',
              fontWeight: '700',
              color: '#0c4a6e',
              marginBottom: '8px',
              boxShadow: '0 3px 6px rgba(14, 165, 233, 0.15)',
              position: 'relative',
              overflow: 'hidden',
              background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)'
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(45deg, rgba(255,255,255,0.2) 0%, transparent 50%)',
                pointerEvents: 'none'
              }} />
              <span style={{ 
                position: 'relative', 
                zIndex: 1,
                textShadow: '0 1px 2px rgba(0,0,0,0.1)'
              }}>
                🚚 Free shipping on orders over ₹5000
              </span>
            </div>
          )}

          {/* Coupon Code Field */}
          {cartDrawer?.couponCodeFieldEnabled && (
            <div style={{ marginTop: '8px' }}>
              <div style={{ 
                display: 'flex', 
                gap: '0px',
                alignItems: 'center',
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                overflow: 'hidden',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}>
                <input 
                  type="text" 
                  placeholder={couponCodeField?.placeholder || "Enter coupon code"}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    border: 'none',
                    fontSize: '14px',
                    outline: 'none',
                    backgroundColor: 'transparent'
                  }}
                />
                <button style={{
                  padding: '12px 20px',
                  backgroundColor: '#1f2937',
                  color: 'white',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'background-color 0.2s'
                }}>
                  {couponCodeField?.buttonText || 'Apply'}
                </button>
              </div>
            </div>
          )}

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
            gap: '8px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <span>Checkout</span>
            <span style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              padding: '4px 12px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600'
            }}>
              ₹{Math.round(sampleCart.total)}
            </span>
            <span style={{
              position: 'absolute',
              right: '16px',
              fontSize: '18px',
              opacity: '0.8'
            }}>→</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CartDrawerIndex() {
  const { cartDrawer, couponCodeField } = useLoaderData<typeof loader>();
  const submit = useSubmit();

  const handleToggleFeature = (featureId: string, currentEnabled: boolean) => {
    console.log('Toggle Feature:', { featureId, currentEnabled, newEnabled: !currentEnabled });
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
      description: 'Show customers how much more they need to spend for free shipping',
      icon: ChartVerticalIcon,
      enabled: cartDrawer.freeShippingProgressBarEnabled,
      count: cartDrawer.freeShippingBars.length,
      path: '/app/cart-drawer/free-shipping-bar',
    },
    {
      id: 'promotional-banner',
      title: 'Promotional Banner',
      description: 'Display promotional offers and sales in the cart',
      icon: MegaphoneIcon,
      enabled: cartDrawer.promotionalBannerEnabled,
      count: cartDrawer.promotionalBanners.length,
      path: '/app/cart-drawer/promotional-banner',
    },
    {
      id: 'product-recommendations',
      title: 'Product Recommendations',
      description: 'Upsell related products with "You may also like"',
      icon: ProductIcon,
      enabled: cartDrawer.productRecommendationsEnabled,
      count: cartDrawer.productRecommendations.length,
      path: '/app/cart-drawer/product-recommendations',
    },
    {
      id: 'coupon-code',
      title: 'Coupon Code Field',
      description: 'Allow customers to apply discount codes in cart',
      icon: DiscountIcon,
      enabled: cartDrawer.couponCodeFieldEnabled,
      count: couponCodeField ? 1 : 0,
      path: '/app/cart-drawer/coupon-code',
    },
    {
      id: 'savings-display',
      title: 'Savings Display',
      description: 'Show total amount saved to encourage checkout',
      icon: CashDollarIcon,
      enabled: cartDrawer.savingsDisplayEnabled,
      count: cartDrawer.savingsDisplays.length,
      path: '/app/cart-drawer/savings-display',
    },
    {
      id: 'free-shipping-message',
      title: 'Free Shipping Message',
      description: 'Display free shipping threshold at bottom of cart',
      icon: DeliveryIcon,
      enabled: cartDrawer.freeShippingMessageEnabled,
      count: cartDrawer.freeShippingMessages.length,
      path: '/app/cart-drawer/free-shipping-message',
    },
  ];

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
                    <Text as="h2" variant="headingLg">
                      Customize Your Cart Experience
                    </Text>
                    <Text as="p" variant="bodyMd" tone="subdued">
                      Enable and configure features to enhance your cart drawer. Toggle features on/off to see how they enhance the shopping experience.
                    </Text>
                  </BlockStack>
                  <Button
                    url="/app/cart-drawer/installation"
                    variant="secondary"
                  >
                    View Installation Instructions
                  </Button>
                </InlineStack>
              </BlockStack>
            </Card>

            {/* Feature Configuration Cards */}
            <BlockStack gap="400">
              {features.map((feature) => (
                <Card key={feature.id}>
                  <BlockStack gap="400">
                    <InlineStack align="space-between" blockAlign="center">
                      <InlineStack gap="400" blockAlign="center">
                        <Box>
                          <Icon source={feature.icon} tone="base" />
                        </Box>
                        <BlockStack gap="100">
                          <InlineStack gap="200" blockAlign="center">
                            <Text as="h3" variant="headingMd">
                              {feature.title}
                            </Text>
                            {feature.enabled ? (
                              <Badge tone="success">Enabled</Badge>
                            ) : (
                              <Badge>Disabled</Badge>
                            )}
                          </InlineStack>
                          <Text as="p" variant="bodyMd" tone="subdued">
                            {feature.description}
                          </Text>
                        </BlockStack>
                      </InlineStack>
                      <InlineStack gap="200">
                        <Button
                          onClick={() => handleToggleFeature(feature.id, feature.enabled)}
                          variant={feature.enabled ? "secondary" : "primary"}
                        >
                          {feature.enabled ? "Disable" : "Enable"}
                        </Button>
                        <Button
                          url={feature.path}
                          variant="primary"
                        >
                          Configure
                        </Button>
                      </InlineStack>
                    </InlineStack>
                  </BlockStack>
                </Card>
              ))}
            </BlockStack>
          </BlockStack>
        </div>

        {/* RIGHT SIDE - Live Preview */}
        <div style={{ 
          flex: '0 0 40%', 
          minWidth: '350px',
          paddingLeft: '12px'
        }}>
          <MiniCartDrawerPreview cartDrawer={cartDrawer} couponCodeField={couponCodeField} />
        </div>
      </div>
    </Page>
  );
}

