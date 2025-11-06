import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, useSubmit, useFetcher } from "@remix-run/react";
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
import {
  DEFAULT_FEATURE_ORDER,
  FEATURE_ORDER_SENTINEL,
  normalizeFeatureOrder,
  reorderFeatureOrder,
  splitFeatureOrder,
} from "../utils/featureOrder";

// Reusable Promotional Banner Component
export function PromotionalBannerCard({ 
  slides, 
  carouselIndex, 
  carouselSettings,
  onPrevious,
  onNext,
  onDotClick
}: { 
  slides: any[]; 
  carouselIndex: number;
  carouselSettings?: any;
  onPrevious?: () => void;
  onNext?: () => void;
  onDotClick?: (index: number) => void;
}) {
  if (!slides || slides.length === 0) {
    return (
      <div style={{
        marginBottom: '16px',
        borderRadius: '12px',
        overflow: 'hidden',
        backgroundColor: '#fff',
        border: '1px solid #e5e7eb',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        {/* Media Section */}
        <div style={{
          position: 'relative',
          overflow: 'hidden',
          height: '200px',
          backgroundColor: '#f9fafb'
        }}>
          <img 
            src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=200&fit=crop&crop=center"
            alt="Sample promotional banner"
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'cover'
            }}
          />
          
          {/* Dot Indicators */}
          <div style={{
            position: 'absolute',
            bottom: '6px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '4px',
            zIndex: 10
          }}>
            <div style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: '#007bff',
              border: '1px solid rgba(255,255,255,0.9)',
              boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
            }} />
            <div style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.6)',
              border: '1px solid rgba(255,255,255,0.9)',
              boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
            }} />
          </div>

          {/* Navigation Arrows */}
          <button
            style={{
              position: 'absolute',
              left: '4px',
              top: '50%',
              transform: 'translateY(-50%)',
              backgroundColor: 'rgba(255,255,255,0.9)',
              borderRadius: '50%',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              border: 'none',
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#333',
              boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
              transition: 'all 0.2s ease'
            }}
          >
            ‹
          </button>
          <button
            style={{
              position: 'absolute',
              right: '4px',
              top: '50%',
              transform: 'translateY(-50%)',
              backgroundColor: 'rgba(255,255,255,0.9)',
              borderRadius: '50%',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              border: 'none',
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#333',
              boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
              transition: 'all 0.2s ease'
            }}
          >
            ›
          </button>
        </div>
        
        {/* Text Content Section */}
        <div style={{
          backgroundColor: '#fff',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          minHeight: '70px'
        }}>
          {/* Title & Description - Left Side */}
          <div style={{ 
            flex: 1,
            textAlign: 'left',
            minWidth: 0
          }}>
            <div style={{ 
              fontWeight: '700', 
              fontSize: '15px', 
              color: '#111827',
              marginBottom: '4px',
              lineHeight: '1.3',
              wordBreak: 'break-word'
            }}>
              Summer Sale
            </div>
            <div style={{ 
              fontSize: '12px', 
              color: '#6b7280',
              lineHeight: '1.4',
              wordBreak: 'break-word'
            }}>
              Get 20% Off on Summer Items
            </div>
          </div>

          {/* CTA Button - Right Side */}
          <div style={{ flexShrink: 0 }}>
            <button style={{
              backgroundColor: '#f3f4f6',
              color: '#374151',
              border: '1px solid #e5e7eb',
              padding: '8px 20px',
              borderRadius: '8px',
              fontWeight: '500',
              cursor: 'pointer',
              fontSize: '13px',
              transition: 'all 0.2s ease',
              minWidth: '80px'
            }}>
              shop
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentSlide = slides[carouselIndex] || slides[0];

  // Helper function to get YouTube embed URL
  const getYouTubeEmbedUrl = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    const videoId = (match && match[2].length === 11) ? match[2] : null;
    return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&showinfo=0&rel=0` : null;
  };

  // Helper function to get Vimeo embed URL
  const getVimeoEmbedUrl = (url: string) => {
    const regExp = /(?:vimeo)\.com.*(?:videos|video|channels|)\/([\d]+)/i;
    const match = url.match(regExp);
    const videoId = match ? match[1] : null;
    return videoId ? `https://player.vimeo.com/video/${videoId}?autoplay=1&loop=1&muted=1&background=1` : null;
  };

  // Determine what to render
  const renderMedia = () => {
    if (currentSlide.videoUrl && currentSlide.videoType) {
      if (currentSlide.videoType === 'youtube') {
        const embedUrl = getYouTubeEmbedUrl(currentSlide.videoUrl);
        if (embedUrl) {
          return (
            <iframe
              src={embedUrl}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                objectFit: 'cover'
              }}
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          );
        }
      } else if (currentSlide.videoType === 'vimeo') {
        const embedUrl = getVimeoEmbedUrl(currentSlide.videoUrl);
        if (embedUrl) {
          return (
            <iframe
              src={embedUrl}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                objectFit: 'cover'
              }}
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          );
        }
      } else if (currentSlide.videoType === 'mp4') {
        return (
          <video
            src={currentSlide.videoUrl}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
            autoPlay
            loop
            muted
            playsInline
          />
        );
      }
    }
    // Fallback to image
    return (
      <img 
        src={currentSlide.imageUrl || 'https://via.placeholder.com/400x200'}
        alt="Promotional banner"
        style={{ 
          width: '100%', 
          height: '100%', 
          objectFit: 'cover'
        }}
      />
    );
  };

  return (
    <div style={{
      marginBottom: '16px',
      borderRadius: '12px',
      overflow: 'hidden',
      backgroundColor: '#fff',
      border: '1px solid #e5e7eb',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
    }}>
      {/* Media Section */}
      <div style={{
        position: 'relative',
        overflow: 'hidden',
        height: '200px',
        backgroundColor: '#f9fafb'
      }}>
        {/* Media (Image or Video) */}
        {renderMedia()}

        {/* Dot Indicators */}
        {slides.length > 1 && (carouselSettings?.showDots !== false) && (
          <div style={{
            position: 'absolute',
            bottom: '6px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '4px',
            zIndex: 10
          }}>
            {slides.map((_: any, index: number) => (
              <div 
                key={index} 
                onClick={() => onDotClick?.(index)}
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: index === carouselIndex ? '#007bff' : 'rgba(255,255,255,0.6)',
                  border: '1px solid rgba(255,255,255,0.9)',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
                }} 
              />
            ))}
          </div>
        )}

        {/* Navigation Arrows */}
        {slides.length > 1 && (carouselSettings?.showArrows !== false) && (
          <>
            <button
              onClick={() => onPrevious?.()}
              style={{
                position: 'absolute',
                left: '4px',
                top: '50%',
                transform: 'translateY(-50%)',
                backgroundColor: 'rgba(255,255,255,0.9)',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                border: 'none',
                fontSize: '14px',
                fontWeight: 'bold',
                color: '#333',
                boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
              }}
            >
              ‹
            </button>
            <button
              onClick={() => onNext?.()}
              style={{
                position: 'absolute',
                right: '4px',
                top: '50%',
                transform: 'translateY(-50%)',
                backgroundColor: 'rgba(255,255,255,0.9)',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                border: 'none',
                fontSize: '14px',
                fontWeight: 'bold',
                color: '#333',
                boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
              }}
            >
              ›
            </button>
          </>
        )}
      </div>
      
      {/* Text Content Section (Below Image) */}
      <div style={{
        backgroundColor: '#fff',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        minHeight: '70px'
      }}>
        {/* Title & Description - Left Side */}
        {(currentSlide.title || currentSlide.description) && (
          <div style={{ 
            flex: 1,
            textAlign: 'left',
            minWidth: 0
          }}>
            {currentSlide.title && (
              <div style={{ 
                fontWeight: '700', 
                fontSize: '15px', 
                color: '#111827',
                marginBottom: currentSlide.description ? '4px' : '0',
                lineHeight: '1.3',
                wordBreak: 'break-word'
              }}>
                {currentSlide.title}
              </div>
            )}
            {currentSlide.description && (
              <div style={{ 
                fontSize: '12px', 
                color: '#6b7280',
                lineHeight: '1.4',
                wordBreak: 'break-word'
              }}>
                {currentSlide.description}
              </div>
            )}
          </div>
        )}

        {/* CTA Button - Right Side */}
        {currentSlide.ctaText && (
          <div style={{ flexShrink: 0 }}>
            <button style={{
              backgroundColor: '#f3f4f6',
              color: '#374151',
              border: '1px solid #e5e7eb',
              padding: '8px 20px',
              borderRadius: '8px',
              fontWeight: '500',
              cursor: 'pointer',
              fontSize: '13px',
              transition: 'all 0.2s ease',
              minWidth: '80px'
            }}>
              {currentSlide.ctaText}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request);
  const shop = session.shop;

  // Check if app embed is enabled
  let appEmbedEnabled = false;
  try {
    // Query to check if theme app extension is enabled
    const response = await admin.graphql(
      `#graphql
        query {
          app {
            installation {
              launchUrl
            }
          }
        }
      `
    );
    // In a real implementation, you'd need to check the specific theme settings
    // For now, we'll default to false - the merchant needs to enable it manually
    appEmbedEnabled = false;
  } catch (error) {
    console.error("Error checking app embed status:", error);
  }

  // Get or create cart drawer configuration
  let cartDrawer = await prisma.cartDrawer.findUnique({
    where: { shop },
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
        promotionalBanners: {
          include: {
            images: { orderBy: { order: 'asc' } },
            carouselSettings: true,
          }
        },
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
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "toggle-feature") {
    const featureId = formData.get("featureId") as string;
    const enabled = formData.get("enabled") === "true";


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
      await prisma.cartDrawer.update({
        where: { shop },
        data: updateData,
      });
      return redirect("/app/cart-drawer");
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
        where: { shop },
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
  
  // State for product recommendations navigation
  const [scrollPosition, setScrollPosition] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  
  // State for carousel
  const [carouselIndex, setCarouselIndex] = useState(0);

  // Handle scroll for product recommendations
  const handleScroll = (scrollContainer: HTMLElement) => {
    const maxScrollLeft = scrollContainer.scrollWidth - scrollContainer.clientWidth;
    const currentScroll = scrollContainer.scrollLeft;
    
    setScrollPosition(currentScroll);
    setCanScrollLeft(currentScroll > 0);
    setCanScrollRight(currentScroll < maxScrollLeft);
  };

  const scrollLeft = (scrollContainer: HTMLElement) => {
    const scrollAmount = 140; // Width of one product card + gap
    scrollContainer.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
  };

  const scrollRight = (scrollContainer: HTMLElement) => {
    const scrollAmount = 140; // Width of one product card + gap
    scrollContainer.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  // Initialize scroll state on component mount
  React.useEffect(() => {
    const scrollContainer = document.querySelector('.product-recommendations-scroll') as HTMLElement;
    if (scrollContainer) {
      // Check initial scroll state
      const maxScrollLeft = scrollContainer.scrollWidth - scrollContainer.clientWidth;
      setCanScrollRight(maxScrollLeft > 0);
      setCanScrollLeft(false);
    }
  }, [cartDrawer?.productRecommendationsEnabled]);

  // Auto-rotate carousel
  React.useEffect(() => {
    if (promotionalBanner?.images && 
        promotionalBanner.images.length > 1 && 
        promotionalBanner.carouselSettings?.autoRotate !== false &&
        cartDrawer?.promotionalBannerEnabled) {
      const interval = setInterval(() => {
        setCarouselIndex((prev) => (prev + 1) % promotionalBanner.images.length);
      }, promotionalBanner.carouselSettings?.rotationSpeed || 5000);
      return () => clearInterval(interval);
    }
  }, [promotionalBanner?.images, promotionalBanner?.carouselSettings, cartDrawer?.promotionalBannerEnabled]);

  // Dynamic sample cart data based on configuration
  const getSampleCart = () => {
    if (!freeShippingBar) {
      return {
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
    };
  };

  const sampleCart = getSampleCart();
  const normalizedOrder = normalizeFeatureOrder(featureOrder ?? cartDrawer.featureOrder);
  const { beforeItems, afterItems } = splitFeatureOrder(normalizedOrder);

  // Calculate free shipping progress
  const calculateProgress = () => {
    if (!freeShippingBar) return 0;
    
    if (freeShippingBar.thresholdMode === "amount") {
      const threshold = Number(freeShippingBar.thresholdAmount);
      return Math.min((sampleCart.total / threshold) * 100, 100);
    } else {
      const threshold = Number(freeShippingBar.thresholdCount);
      return Math.min((sampleCart.itemCount / threshold) * 100, 100);
    }
  };

  const calculateRemaining = () => {
    if (!freeShippingBar) return 0;
    
    if (freeShippingBar.thresholdMode === "amount") {
      const threshold = Number(freeShippingBar.thresholdAmount);
      return Math.max(threshold - sampleCart.total, 0);
    } else {
      const threshold = Number(freeShippingBar.thresholdCount);
      return Math.max(threshold - sampleCart.itemCount, 0);
    }
  };

  const getProgressMessage = () => {
    if (!freeShippingBar) return null;
    
    const progress = calculateProgress();
    const remaining = calculateRemaining();
    
    if (progress >= 100) {
      return freeShippingBar.afterThresholdMessage || "You've unlocked FREE shipping!";
    } else {
      let message = freeShippingBar.beforeThresholdMessage || "Add {remaining} for FREE shipping";
      if (freeShippingBar.thresholdMode === "amount") {
        message = message.replace('{remaining}', `₹${Math.round(remaining)}`);
      } else {
        message = message.replace('{remaining}', `${Math.round(remaining)} more items`);
      }
      return message;
    }
  };

  const renderFeature = (featureId: string) => {
    switch (featureId) {
      case 'free-shipping-bar':
  return (
          cartDrawer?.freeShippingProgressBarEnabled &&
          freeShippingBar &&
          getProgressMessage() && (
            <div style={{ 
              padding: '8px',
              background: freeShippingBar.backgroundColor 
                ? `linear-gradient(135deg, ${freeShippingBar.backgroundColor} 0%, ${freeShippingBar.backgroundColor}dd 100%)`
                : 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
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
                  {getProgressMessage()}
                </span>
                {(freeShippingBar.showPercentage ?? true) && (
                  <span style={{ 
                    background: calculateProgress() >= 100
                      ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                      : freeShippingBar.progressBarColor
                        ? `linear-gradient(135deg, ${freeShippingBar.progressBarColor} 0%, ${freeShippingBar.progressBarColor}dd 100%)`
                        : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                    color: 'white',
                    padding: '4px 12px',
                    borderRadius: '16px',
                    fontSize: '12px',
                    fontWeight: '700',
                    boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)'
                  }}>
                    {calculateProgress().toFixed(0)}%
                  </span>
                )}
              </div>
              <div style={{ 
                width: '100%', 
                height: '10px', 
                backgroundColor: freeShippingBar.backgroundColor || '#e0f2fe',
                borderRadius: '6px',
                overflow: 'hidden',
                boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.1)'
              }}>
                <div style={{
                  width: `${calculateProgress()}%`,
                  height: '100%',
                  background: calculateProgress() >= 100
                    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                    : freeShippingBar.progressBarColor
                      ? `linear-gradient(135deg, ${freeShippingBar.progressBarColor} 0%, ${freeShippingBar.progressBarColor}dd 100%)`
                      : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  borderRadius: '6px',
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>
          )
        );

      case 'promotional-banner':
        return (
          cartDrawer?.promotionalBannerEnabled && (
            <PromotionalBannerCard 
              slides={promotionalBanner?.images || []}
              carouselIndex={carouselIndex}
              carouselSettings={promotionalBanner?.carouselSettings}
              onPrevious={() => setCarouselIndex((prev) => (prev - 1 + (promotionalBanner?.images?.length || 1)) % (promotionalBanner?.images?.length || 1))}
              onNext={() => setCarouselIndex((prev) => (prev + 1) % (promotionalBanner?.images?.length || 1))}
              onDotClick={(index) => setCarouselIndex(index)}
            />
          )
        );

      case 'product-recommendations':
        return (cartDrawer?.productRecommendationsEnabled && (
          <div style={{ marginTop: '8px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
              {productRecommendation?.title || "You may also like"}
            </h4>
            <div style={{ 
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Left Arrow */}
              {canScrollLeft && (
                <button
                  onClick={(e) => {
                    const container = e.currentTarget.parentElement?.querySelector('.product-recommendations-scroll') as HTMLElement;
                    if (container) scrollLeft(container);
                  }}
                  style={{
                    position: 'absolute',
                    left: '0',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'rgba(255, 255, 255, 0.9)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    zIndex: 10,
                    opacity: 0.7,
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '1';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 1)';
                    e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '0.7';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
                    e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                  }}
                >
                  <span style={{ fontSize: '16px', color: '#374151' }}>‹</span>
                </button>
              )}

              {/* Right Arrow */}
              {canScrollRight && (
                <button
                  onClick={(e) => {
                    const container = e.currentTarget.parentElement?.querySelector('.product-recommendations-scroll') as HTMLElement;
                    if (container) scrollRight(container);
                  }}
                  style={{
                    position: 'absolute',
                    right: '0',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'rgba(255, 255, 255, 0.9)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    zIndex: 10,
                    opacity: 0.7,
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '1';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 1)';
                    e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '0.7';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
                    e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                  }}
                >
                  <span style={{ fontSize: '16px', color: '#374151' }}>›</span>
                </button>
              )}

              <div 
                className="product-recommendations-scroll"
                style={{ 
                  display: 'flex',
                  gap: '8px',
                  overflowX: 'auto',
                  scrollBehavior: 'smooth',
                  paddingBottom: '8px',
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#cbd5e1 #f1f5f9',
                  paddingLeft: canScrollLeft ? '40px' : '0',
                  paddingRight: canScrollRight ? '40px' : '0'
                }}
                onScroll={(e) => handleScroll(e.currentTarget)}
              >
                {productRecommendation?.products && productRecommendation.products.length > 0 ? (
                  productRecommendation.products.slice(0, productRecommendation.maxProducts || 4).map((product: any, index: number) => (
                    <div key={product.id} style={{ 
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      padding: '8px',
                      textAlign: 'center',
                      minWidth: '120px',
                      flexShrink: 0,
                      backgroundColor: '#ffffff',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                    }}>
                      {product.imageUrl ? (
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
                      ) : (
                        <div style={{ 
                          width: '100%', 
                          height: '60px', 
                          backgroundColor: '#f3f4f6',
                          borderRadius: '4px',
                          marginBottom: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '24px'
                        }}>📦</div>
                      )}
                      <div style={{ fontSize: '11px', fontWeight: '600', marginBottom: '4px', lineHeight: '1.3' }}>
                        {product.title.length > 20 ? product.title.substring(0, 20) + '...' : product.title}
                      </div>
                      <div style={{ marginBottom: '4px' }}>
                        {productRecommendation?.showDiscount && product.compareAtPrice && product.compareAtPrice > product.price ? (
                          <>
                            <span style={{ 
                              textDecoration: 'line-through',
                              color: '#9ca3af',
                              fontSize: '10px',
                              marginRight: '4px'
                            }}>
                              ₹{Math.round(product.compareAtPrice)}
                            </span>
                            <span style={{ fontWeight: '600', fontSize: '11px' }}>₹{Math.round(product.price)}</span>
                          </>
                        ) : (
                          <span style={{ fontWeight: '600', fontSize: '11px' }}>₹{Math.round(product.price)}</span>
                        )}
                      </div>
                      {productRecommendation?.showDiscountBadge && product.compareAtPrice && product.compareAtPrice > product.price && (
                        <div style={{ 
                          display: 'inline-block',
                          backgroundColor: '#10b981',
                          color: 'white',
                          padding: '2px 6px',
                          borderRadius: '10px',
                          fontSize: '9px',
                          marginBottom: '6px',
                          fontWeight: '600'
                        }}>
                          {Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)}% off
                        </div>
                      )}
                      {productRecommendation?.showAddButton && (
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
                      )}
                    </div>
                  ))
                ) : (
                  // Sample product recommendations when no real data
                  [
                    { id: 'sample1', title: 'Sample Product 1', price: 999, imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=60&h=60&fit=crop&crop=center' },
                    { id: 'sample2', title: 'Sample Product 2', price: 1299, imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=60&h=60&fit=crop&crop=center' },
                    { id: 'sample3', title: 'Sample Product 3', price: 1599, imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=60&h=60&fit=crop&crop=center' },
                    { id: 'sample4', title: 'Sample Product 4', price: 899, imageUrl: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=60&h=60&fit=crop&crop=center' }
                  ].map((product: any, index: number) => (
                    <div key={product.id} style={{ 
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      padding: '8px',
                      textAlign: 'center',
                      minWidth: '120px',
                      flexShrink: 0,
                      backgroundColor: '#ffffff',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease'
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
          </div>
        ));
        
      case 'savings-display':
        return (
          cartDrawer?.savingsDisplayEnabled && savingsDisplay && (
            <div style={{
              padding: '12px 16px',
              backgroundColor: savingsDisplay.backgroundColor || '#10B981',
              border: `1px solid ${savingsDisplay.highlightColor || savingsDisplay.textColor || '#FFFFFF'}`,
              borderRadius: '6px',
              textAlign: 'center',
              fontSize: '16px',
              fontWeight: '600',
              color: savingsDisplay.textColor || '#FFFFFF'
            }}>
              {(savingsDisplay.message || '{amount} Saved so far!').replace('{amount}', `₹${Math.round(sampleCart.savings)}`)}
            </div>
          )
        );

      case 'free-shipping-message':
        return (
          cartDrawer?.freeShippingMessageEnabled && (
            <div style={{
              padding: '14px 18px',
              backgroundColor: freeShippingMessage?.backgroundColor || '#E6F3FF',
              border: `2px solid ${freeShippingMessage?.textColor || '#0ea5e9'}`,
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontSize: '14px',
              fontWeight: '700',
              color: freeShippingMessage?.textColor || '#1E3A8A',
              marginBottom: '8px',
              boxShadow: '0 3px 6px rgba(0, 0, 0, 0.1)',
              position: 'relative',
              overflow: 'hidden'
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
              {/* Delivery truck icon */}
              <div style={{
                fontSize: '20px',
                flexShrink: 0,
                position: 'relative',
                zIndex: 1
              }}>
                🚚
              </div>
              {/* Message text */}
              <span style={{ 
                position: 'relative', 
                zIndex: 1,
                textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                flex: 1
              }}>
                {freeShippingMessage?.beforeThresholdMessage?.replace('{threshold}', `₹${freeShippingMessage?.thresholdAmount || 5000}`) || `Free shipping on orders over ₹${freeShippingMessage?.thresholdAmount || 5000}`}
              </span>
            </div>
          ));

        {/* Coupon Code Field */}
      case 'coupon-code':
        return (cartDrawer?.couponCodeFieldEnabled && (
          <div style={{ 
            marginTop: '12px', 
            padding: '16px', 
            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', 
            borderRadius: '12px', 
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Subtle background pattern */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.03) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(16, 185, 129, 0.03) 0%, transparent 50%)',
              pointerEvents: 'none'
            }} />
            
            <div style={{ 
              display: 'flex', 
              gap: '10px',
              alignItems: 'center',
              marginBottom: couponCodeField?.enableAutoApply || couponCodeField?.showAllOffers ? '16px' : '0',
              position: 'relative',
              zIndex: 1
            }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <input 
                  type="text" 
                  placeholder={couponCodeField?.placeholder || "Enter coupon code"}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '10px',
                    fontSize: '14px',
                    outline: 'none',
                    backgroundColor: 'white',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02)',
                    fontWeight: '500'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3b82f6';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.02)';
                  }}
                />
              </div>
              <button style={{
                padding: '12px 20px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                const target = e.target as HTMLButtonElement;
                target.style.transform = 'translateY(-1px)';
                target.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.4)';
              }}
              onMouseLeave={(e) => {
                const target = e.target as HTMLButtonElement;
                target.style.transform = 'translateY(0)';
                target.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
              }}>
                <span style={{ position: 'relative', zIndex: 1 }}>
                  {couponCodeField?.buttonText || 'Apply'}
                </span>
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(45deg, rgba(255,255,255,0.2) 0%, transparent 50%)',
                  pointerEvents: 'none'
                }} />
              </button>
            </div>
            
            {/* Auto-Applied Discount Preview */}
            {couponCodeField?.enableAutoApply && (
              <div style={{
                padding: '14px 16px',
                background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
                border: '2px solid #10b981',
                borderRadius: '10px',
                marginBottom: '12px',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.15)'
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
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  position: 'relative',
                  zIndex: 1
                }}>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)'
                  }}>✓</div>
                  <div>
                    <div style={{ 
                      fontWeight: '700', 
                      color: '#047857', 
                      fontSize: '14px', 
                      marginBottom: '2px',
                      textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                    }}>
                      SUMMER20 - 20% OFF
                    </div>
                    <div style={{ 
                      fontSize: '12px', 
                      color: '#065f46',
                      fontWeight: '500'
                    }}>
                      Best offer automatically applied
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Show All Offers Button Preview */}
            {couponCodeField?.showAllOffers && (
              <button style={{
                width: '100%',
                padding: '12px 16px',
                background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                color: '#374151',
                border: '2px solid #e5e7eb',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                transition: 'all 0.3s ease',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.04)',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                const target = e.target as HTMLButtonElement;
                target.style.borderColor = '#3b82f6';
                target.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.15)';
                target.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                const target = e.target as HTMLButtonElement;
                target.style.borderColor = '#e5e7eb';
                target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.04)';
                target.style.transform = 'translateY(0)';
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '16px' }}>🎁</span>
                  <span>{couponCodeField?.showAllOffersButtonText || 'Show all offers'} (3 available)</span>
                </span>
                <span style={{ 
                  fontSize: '12px',
                  color: '#6b7280',
                  transition: 'transform 0.3s ease'
                }}>▼</span>
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(45deg, rgba(59, 130, 246, 0.05) 0%, transparent 50%)',
                  pointerEvents: 'none',
                  opacity: 0,
                  transition: 'opacity 0.3s ease'
                }} />
              </button>
            )}
          </div>
        ));

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
          {beforeItems.map((featureId) => (
            <React.Fragment key={featureId}>{renderFeature(featureId)}</React.Fragment>
          ))}

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
                    }}>🗑</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Feature sections rendered via featureOrder */}

          {afterItems.map((featureId) => (
            <React.Fragment key={featureId}>{renderFeature(featureId)}</React.Fragment>
          ))}

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
  const { cartDrawer, couponCodeField, appEmbedEnabled, shopDomain } = useLoaderData<typeof loader>();
  const submit = useSubmit();
  const fetcher = useFetcher();

  const [featureOrder, setFeatureOrder] = useState<string[]>(() =>
    normalizeFeatureOrder(cartDrawer.featureOrder)
  );
  const [draggedFeatureId, setDraggedFeatureId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

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
              <div style={{
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
                    <circle cx="5" cy="5" r="1.5"/>
                    <circle cx="10" cy="5" r="1.5"/>
                    <circle cx="15" cy="5" r="1.5"/>
                    <circle cx="5" cy="10" r="1.5"/>
                    <circle cx="10" cy="10" r="1.5"/>
                    <circle cx="15" cy="10" r="1.5"/>
                  </svg>
                </span>
                <span>Drag to reorder features</span>
              </div>
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
                                  <circle cx="3" cy="3" r="1.3"/>
                                  <circle cx="9" cy="3" r="1.3"/>
                                  <circle cx="3" cy="8" r="1.3"/>
                                  <circle cx="9" cy="8" r="1.3"/>
                                  <circle cx="3" cy="13" r="1.3"/>
                                  <circle cx="9" cy="13" r="1.3"/>
                                </svg>
                              </div>
                            </Box>
                            <Box>
                              <Icon source={isCartItems ? ProductIcon : feature!.icon} tone="base" />
                            </Box>
                            <BlockStack gap="100">
                              <InlineStack gap="200" blockAlign="center">
                                <Text as="h3" variant="headingMd">
                                  {isCartItems ? 'Selected Items' : feature!.title}
                                </Text>
                                {isCartItems && (
                                  <Badge tone="info">Cart Items</Badge>
                                )}
                              </InlineStack>
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
          paddingLeft: '12px'
        }}>
          <MiniCartDrawerPreview
            cartDrawer={cartDrawer}
            couponCodeField={couponCodeField}
            featureOrder={featureOrder}
          />
        </div>
      </div>
    </Page>
  );
}

