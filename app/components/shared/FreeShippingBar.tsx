/**
 * Shared Free Shipping Progress Bar Component
 * Premium redesign — works in any Shopify theme (light)
 */

import React, { useEffect, useRef, useState } from 'react';
import { VariantPickerSheet, VariantPickerProduct } from './VariantPickerSheet';

interface Cart {
  item_count: number;
  total_price: number;
  items?: { variant_id: number | string;[key: string]: any }[];
}

interface ProductVariant {
  id: string;
  title: string;
  available: boolean;
  price: number;
  compareAtPrice?: number | null;
  option1?: string | null;
  option2?: string | null;
  option3?: string | null;
  featured_image?: { url: string } | null;
}

interface Product {
  id: string;
  variantId: string;
  title: string;
  handle: string;
  price: number;
  compareAtPrice: number | null;
  imageUrl: string | null;
  currency: string;
  variants?: ProductVariant[];
  options?: string[];
}

interface FreeShippingBarProps {
  thresholdMode: 'amount' | 'count';
  thresholdAmount?: number;
  thresholdCount?: number;
  beforeThresholdMessage?: string;
  afterThresholdMessage?: string;
  backgroundColor?: string;
  progressBarColor?: string;
  borderColor?: string;
  showPercentage?: boolean;
  currency?: string;
  cart: Cart;
  isPreview?: boolean;
  showProductUpsell?: boolean;
  upsellHeaderText?: string;
  appUrl?: string;
  shop?: string;
  onAddProduct?: (variantId: string) => void;
  upsellProducts?: any[];
}

export const FreeShippingBar: React.FC<FreeShippingBarProps> = ({
  thresholdMode,
  thresholdAmount,
  thresholdCount,
  beforeThresholdMessage = 'Add {remaining} for FREE shipping',
  afterThresholdMessage = "🎉 You qualify for FREE shipping!",
  backgroundColor = '#f0f9ff',
  progressBarColor = '#7c3aed',
  borderColor = '#e8e0ff',
  showPercentage = true,
  currency = 'USD',
  cart,
  isPreview = false,
  showProductUpsell = true,
  upsellHeaderText = "Almost there! Add this to unlock free shipping:",
  appUrl,
  shop,
  onAddProduct,
  upsellProducts = [],
}) => {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [celebrated, setCelebrated] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [pickerProduct, setPickerProduct] = useState<VariantPickerProduct | null>(null);
  const prevCompleteRef = useRef(false);

  const calculateProgress = () => {
    if (thresholdMode === 'amount' && thresholdAmount) {
      const cartTotal = cart.total_price / 100;
      return Math.min((cartTotal / thresholdAmount) * 100, 100);
    } else if (thresholdMode === 'count' && thresholdCount) {
      return Math.min((cart.item_count / thresholdCount) * 100, 100);
    }
    return 0;
  };

  const calculateRemaining = () => {
    if (thresholdMode === 'amount' && thresholdAmount) {
      const cartTotal = cart.total_price / 100;
      return Math.max(thresholdAmount - cartTotal, 0);
    } else if (thresholdMode === 'count' && thresholdCount) {
      return Math.max(thresholdCount - cart.item_count, 0);
    }
    return 0;
  };

  const progress = calculateProgress();
  const remaining = calculateRemaining();
  const isComplete = thresholdMode === 'amount' && thresholdAmount
    ? Math.round(cart.total_price / 100) >= Math.round(thresholdAmount)
    : progress >= 100;

  // Animate progress on mount and change
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(progress);
    }, 80);
    return () => clearTimeout(timer);
  }, [progress]);

  // Celebration trigger — use ref to detect transition from false→true only once
  useEffect(() => {
    const wasComplete = prevCompleteRef.current;
    prevCompleteRef.current = isComplete;
    if (isComplete && !wasComplete) {
      setCelebrated(true);
      const t = setTimeout(() => setCelebrated(false), 2000);
      return () => clearTimeout(t);
    }
  }, [isComplete]);

  // Stable string key derived from cart item variant IDs — avoids array-reference churn
  const cartItemIdsKey = (cart.items || []).map((i) => String(i.variant_id)).join(',');

  // Sync prop products to internal state (filtering out items already in cart)
  useEffect(() => {
    if (showProductUpsell && !isComplete && Array.isArray(upsellProducts) && upsellProducts.length > 0) {
      const cartItemIds = cartItemIdsKey ? cartItemIdsKey.split(',') : [];
      const filtered = upsellProducts.filter(
        (p) => !cartItemIds.includes(String(p.variantId || p.shopifyVariantId || p.id))
      );
      setProducts(filtered as Product[]);
    } else {
      // Functional updater: only trigger re-render if array was non-empty
      setProducts((prev) => (prev.length === 0 ? prev : []));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [upsellProducts, isComplete, showProductUpsell, cartItemIdsKey]);

  // ─── Variant picker handler ─────────────────────────────
  const handleAddClick = (p: Product) => {
    if (isPreview || !onAddProduct) return;

    const variantId = String(p.variantId || p.id);
    const hasMultipleVariants = Array.isArray(p.variants) && p.variants.length > 1;

    if (!hasMultipleVariants) {
      // Single variant → add directly
      onAddProduct(variantId);
      return;
    }

    // Multiple variants → open picker sheet
    setPickerProduct({
      id: p.id,
      title: p.title,
      imageUrl: p.imageUrl,
      price: Math.round(p.price * 100), // convert to cents for the picker
      compareAtPrice: p.compareAtPrice ? Math.round(p.compareAtPrice * 100) : null,
      variants: p.variants!,
      options: p.options || [],
    });
  };
  // ─────────────────────────────────────────────

  const formatMoney = (cents: number) => {
    if (typeof cents !== 'number') return '';
    const amount = cents / 100;

    // Get active currency from Shopify config
    // @ts-ignore
    const currencyConfig = typeof window !== 'undefined' ? window.selldrawer_config?.currency : null;
    const isoCode = currencyConfig?.isoCode || currencyConfig?.code || 'USD';
      
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: isoCode,
        minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
        maximumFractionDigits: 2
      }).format(amount);
    } catch (e) {
      const symbol = currencyConfig?.symbol || '$';
      return `${symbol}${amount.toFixed(2)}`;
    }
  };

  const getMessage = () => {
    if (isComplete) return afterThresholdMessage;
    let message = beforeThresholdMessage;
    if (thresholdMode === 'amount') {
      message = message.replace('{remaining}', formatMoney(remaining * 100));
    } else {
      message = message.replace('{remaining}', `${Math.round(remaining)} more items`);
    }
    return message;
  };

  const message = getMessage();

  // Helper to determine contrast color
  const isDark = (color: string) => {
    if (!color || color === 'transparent') return false;
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 < 128;
  };

  const textColor = isDark(backgroundColor) ? '#ffffff' : '#1f2937';
  const subTextColor = isDark(backgroundColor) ? 'rgba(255,255,255,0.7)' : '#6b7280';
  const badgeBg = isDark(backgroundColor) ? 'rgba(255,255,255,0.15)' : 'rgba(156,163,175,0.2)';
  const badgeBorder = isDark(backgroundColor) ? 'rgba(255,255,255,0.25)' : 'rgba(156,163,175,0.3)';

  // Derive fill color from prop
  const fillColor = isComplete ? '#10b981' : progressBarColor;
  const glowColor = isComplete ? 'rgba(16,185,129,0.35)' : `${progressBarColor}55`;

  const keyframes = `
    @keyframes sd-truck-slide {
      0% { transform: translateX(-2px); }
      50% { transform: translateX(1px); }
      100% { transform: translateX(-2px); }
    }
    @keyframes sd-shimmer-bar {
      0% { background-position: -200% center; }
      100% { background-position: 200% center; }
    }
    @keyframes sd-celebrate-pulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.02); opacity: 0.9; }
    }
    @keyframes sd-flash-in {
      0% { opacity: 0; transform: translateY(4px); }
      100% { opacity: 1; transform: translateY(0); }
    }
  `;

  return (
    <>
      <style>{keyframes}</style>
      <div
        style={{
          background: backgroundColor,
          borderRadius: '16px',
          border: `2px solid ${borderColor}`,
          padding: '10px 12px',
          boxShadow: isComplete
            ? '0 4px 15px rgba(16,185,129,0.1)'
            : '0 4px 15px rgba(0,0,0,0.08)',
          animation: celebrated ? 'sd-celebrate-pulse 0.5s ease-in-out 2' : undefined,
          transition: 'all 0.4s cubic-bezier(0.4,0,0.2,1)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        {/* Top row: truck icon + message + badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Truck icon */}
          <div
            style={{
              fontSize: '18px',
              lineHeight: 1,
              flexShrink: 0,
              animation: isComplete ? undefined : 'sd-truck-slide 1.8s ease-in-out infinite',
              transition: 'all 0.4s ease',
            }}
            aria-hidden="true"
          >
            {isComplete ? '🎉' : '🚚'}
          </div>

          {/* Message */}
          <div
            style={{
              flex: 1,
              fontSize: '13px',
              fontWeight: '700',
              color: textColor,
              lineHeight: '1.3',
              letterSpacing: '-0.01em',
              animation: 'sd-flash-in 0.35s ease',
            }}
          >
            {message}
          </div>

          {/* Percentage badge */}
          {showPercentage && (
            <div
              style={{
                flexShrink: 0,
                fontSize: '11px',
                fontWeight: '700',
                color: textColor,
                background: badgeBg,
                padding: '3px 8px',
                borderRadius: '20px',
                letterSpacing: '0.02em',
                border: `1.5px solid ${badgeBorder}`,
              }}
            >
              {isComplete ? '✓ FREE' : `${Math.round(progress)}%`}
            </div>
          )}
        </div>

        {/* Progress bar container */}
        <div style={{ position: 'relative', height: '6px' }}>
          {/* Background track */}
          <div
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              borderRadius: '100px',
              background: isDark(backgroundColor) ? 'rgba(255,255,255,0.15)' : 'rgba(229,231,235,0.6)',
              overflow: 'hidden',
              display: 'block',
            }}
          >
            {/* Fill */}
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                height: '100%',
                width: `${animatedProgress}%`,
                borderRadius: '100px',
                background: fillColor,
                boxShadow: `0 0 10px ${glowColor}`,
                transition: 'width 0.7s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.4s ease',
                backgroundSize: '200% 100%',
                animation: !isComplete && animatedProgress > 5
                  ? 'sd-shimmer-bar 2.5s linear infinite'
                  : undefined,
                display: 'block',
              }}
            />
          </div>

          {/* Thumb dot at progress edge */}
          {!isComplete && animatedProgress > 3 && (
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: `${animatedProgress}%`,
                transform: 'translate(-50%, -50%)',
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: fillColor,
                boxShadow: `0 0 0 3px ${backgroundColor}, 0 0 0 4.5px ${fillColor}55`,
                transition: 'left 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
                zIndex: 2,
              }}
            />
          )}
        </div>

        {/* Integrated Product Carousel (inside the same card) */}
        {!isComplete && products.length > 0 && (
          <div style={{
            marginTop: '2px',
            paddingTop: '8px',
            borderTop: `1px solid ${isDark(backgroundColor) ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
            display: 'block'
          }}>
            <div style={{
              display: 'flex',
              gap: '8px',
              overflowX: 'auto',
              paddingBottom: '4px',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch',
            }}>
              {products.map((p: any) => {
                const variantId = String(p.variantId || p.shopifyVariantId || p.id);
                const imageUrl = p.imageUrl || p.featured_image;
                const hasMultipleVariants = Array.isArray(p.variants) && p.variants.length > 1;

                return (
                  <div
                    key={variantId}
                    style={{
                      minWidth: 'calc(100% - 40px)',
                      maxWidth: '300px',
                      padding: '6px',
                      background: isDark(backgroundColor) ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.03)',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      flexShrink: 0,
                    }}
                  >
                    {/* Product Image */}
                    {imageUrl && (
                      <div style={{
                        width: '36px',
                        height: '36px',
                        flexShrink: 0,
                        borderRadius: '8px',
                        overflow: 'hidden',
                        background: '#fff',
                      }}>
                        <img
                          src={imageUrl}
                          alt={p.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                    )}

                    {/* Product Info */}
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <div style={{
                        fontSize: '12px',
                        fontWeight: '600',
                        color: textColor,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}>
                        {p.title}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '12px', fontWeight: '800', color: isDark(backgroundColor) ? '#fbbf24' : '#ef4444' }}>
                          {formatMoney(Number(p.price) * 100)}
                        </span>
                        {/* Variant indicator */}
                        {hasMultipleVariants && (
                          <span style={{
                            fontSize: '9px', fontWeight: 600, color: subTextColor,
                            background: isDark(backgroundColor) ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.07)',
                            padding: '1px 5px', borderRadius: '4px',
                          }}>
                            {p.variants.length} options
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Add to Cart Button */}
                    <button
                      onClick={() => handleAddClick(p)}
                      style={{
                        padding: '5px 10px',
                        background: isDark(backgroundColor) ? '#ffffff' : progressBarColor,
                        color: isDark(backgroundColor) ? '#000000' : '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '10px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                        transition: 'transform 0.15s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.06)'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                    >
                      {hasMultipleVariants ? 'Select' : 'Add'}
                    </button>
                  </div>
                );
              })}

            </div>
            {/* Horizontal Indicator (Peeking logic) */}
            {products.length > 1 && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '4px',
                marginTop: '4px',
                opacity: 0.5
              }}>
                {products.slice(0, 5).map((_, i) => (
                  <div key={i} style={{ width: '4px', height: '4px', borderRadius: '50%', background: textColor }} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Variant Picker Sheet */}
      {pickerProduct && (
        <VariantPickerSheet
          product={pickerProduct}
          onClose={() => setPickerProduct(null)}
          onAddToCart={(variantId) => {
            if (onAddProduct) onAddProduct(variantId);
            setPickerProduct(null);
          }}
          currency={currency}
          accentColor={progressBarColor}
        />
      )}
    </>
  );
};
