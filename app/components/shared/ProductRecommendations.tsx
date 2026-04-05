/**
 * Shared Product Recommendations Component
 * Premium redesign — works in any Shopify theme (light)
 */

import React, { useState, useEffect, useRef } from 'react';
import { VariantPickerSheet, VariantPickerProduct, ProductVariant } from './VariantPickerSheet';

interface Product {
  id: string;
  shopifyProductId?: string;
  shopifyVariantId?: string;
  title: string;
  price: number;
  compareAtPrice?: number;
  imageUrl?: string;
  variants?: ProductVariant[];
  options?: string[];
}

interface ProductRecommendationsProps {
  title?: string;
  products: Product[];
  layout?: 'carousel' | 'grid';
  maxProducts?: number;
  showDiscount?: boolean;
  showDiscountBadge?: boolean;
  showAddButton?: boolean;
  onAddToCart?: (variantId: string) => void;
  onImpression?: () => void;
  onProductClick?: (productId: string, variantId?: string) => void;
  isPreview?: boolean;
}

const RECO_KEYFRAMES = `
  @keyframes sd-reco-slide-in {
    0% { opacity: 0; transform: translateX(20px); }
    100% { opacity: 1; transform: translateX(0); }
  }
  @keyframes sd-reco-add-success {
    0% { transform: scale(1); }
    40% { transform: scale(0.9); }
    70% { transform: scale(1.1); }
    100% { transform: scale(1); }
  }
  @keyframes sd-reco-quick-add-up {
    0% { opacity: 0; transform: translateY(100%); }
    100% { opacity: 1; transform: translateY(0); }
  }
  @keyframes sd-bottom-sheet-up {
    from { transform: translateY(100%); }
    to { transform: translateY(0); }
  }
  @keyframes sd-backdrop-fade {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes sd-spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

export const ProductRecommendations: React.FC<ProductRecommendationsProps> = ({
  title = "You may also like",
  products = [],
  layout = 'carousel',
  maxProducts = 4,
  showDiscount = true,
  showDiscountBadge = true,
  showAddButton = true,
  onAddToCart,
  onImpression,
  onProductClick,
  isPreview = false
}) => {
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [containerHovered, setContainerHovered] = useState(false);
  const [addingIds, setAddingIds] = useState<Set<string>>(new Set());
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [pickerProduct, setPickerProduct] = useState<VariantPickerProduct | null>(null);
  const [showAllModal, setShowAllModal] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const impressionTracked = useRef(false);

  const isGrid = layout === 'grid';
  // Always enforce solid groupings of 3 across both grid and carousel previews
  const maxValid = products.length >= 3 ? Math.floor(products.length / 3) * 3 : products.length;
  const allValidProducts = products.slice(0, maxValid);
  
  const displayLimit = isGrid ? 3 : maxProducts;
  const displayProducts = allValidProducts.slice(0, displayLimit);
  const showSeeAll = allValidProducts.length > displayProducts.length;

  useEffect(() => {
    if (!impressionTracked.current && onImpression && !isPreview && displayProducts.length > 0) {
      onImpression();
      impressionTracked.current = true;
    }
  }, [onImpression, isPreview, displayProducts.length]);

  const updateScrollState = () => {
    const container = scrollContainerRef.current;
    if (!container || isGrid) return;
    const maxScrollLeft = container.scrollWidth - container.clientWidth;
    const currentScroll = container.scrollLeft;
    setCanScrollLeft(currentScroll > 5);
    setCanScrollRight(currentScroll < maxScrollLeft - 5);
  };

  useEffect(() => {
    updateScrollState();
    const container = scrollContainerRef.current;
    if (container && !isGrid) {
      container.addEventListener('scroll', updateScrollState);
      return () => container.removeEventListener('scroll', updateScrollState);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products.length, isGrid]);

  const handleScroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;
    container.scrollBy({ left: direction === 'left' ? -160 : 160, behavior: 'smooth' });
  };

  // ─── Variant-aware add handler ───────────────────────────────────────────
  const handleAddClick = async (product: Product, stableKey: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPreview) return;

    const hasMultipleVariants = Array.isArray(product.variants) && product.variants.length > 1;

    if (hasMultipleVariants) {
      // Open variant picker sheet
      setPickerProduct({
        id: product.id,
        title: product.title,
        imageUrl: product.imageUrl,
        // price from product is in rupees; convert to cents for picker
        price: Math.round(product.price * 100),
        compareAtPrice: product.compareAtPrice ? Math.round(product.compareAtPrice * 100) : null,
        variants: product.variants!,
        options: product.options || [],
      });
      return;
    }

    // Single variant — add directly
    const variantId = product.shopifyVariantId || product.shopifyProductId;
    if (!variantId || !onAddToCart) return;

    setAddingIds(prev => new Set([...prev, stableKey]));
    try {
      onAddToCart(variantId);
      await new Promise(r => setTimeout(r, 600));
      setAddedIds(prev => new Set([...prev, stableKey]));
      setTimeout(() => {
        setAddedIds(prev => { const next = new Set(prev); next.delete(stableKey); return next; });
      }, 1500);
    } finally {
      setAddingIds(prev => { const next = new Set(prev); next.delete(stableKey); return next; });
    }
  };
  // ─────────────────────────────────────────────────────────────────────────

  const handleCardClick = (product: Product) => {
    if (onProductClick) {
      const variantId = product.shopifyVariantId || product.shopifyProductId;
      onProductClick(product.id, variantId);
    }
  };

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
      return `${symbol}${amount.toLocaleString()}`;
    }
  };

  if (products.length === 0) return null;

  const renderProductCard = (product: Product, idx: number, isModal: boolean = false) => {
    const stableKey = `${product.id}-${idx}`;
    const discount = product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
      : 0;
    const isAdding = addingIds.has(stableKey);
    const isAdded = addedIds.has(stableKey);
    const isCardHovered = hoveredId === stableKey;
    const hasMultipleVariants = Array.isArray(product.variants) && product.variants.length > 1;

    return (
      <div
        key={stableKey}
        onClick={() => handleCardClick(product)}
        onMouseEnter={() => setHoveredId(stableKey)}
        onMouseLeave={() => setHoveredId(null)}
        style={{
          ...(isGrid || isModal ? {} : {
            flex: '0 0 calc((100% - 12px) / 3)',
            scrollSnapAlign: 'start',
          }),
          borderRadius: '8px',
          border: `1px solid ${isCardHovered ? '#c4b5fd' : '#e5e7eb'}`,
          background: '#ffffff',
          boxShadow: isCardHovered
            ? '0 12px 32px rgba(124,58,237,0.12)'
            : '0 2px 8px rgba(0,0,0,0.06)',
          transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column' as const,
          transform: isCardHovered ? 'translateY(-3px)' : 'translateY(0)',
          animation: `sd-reco-slide-in 0.35s ease ${idx * 0.05}s both`,
          position: 'relative',
        }}
      >
        <div style={{
          position: 'relative',
          aspectRatio: '1',
          background: '#fff',
          borderRadius: '8px 8px 0 0',
          padding: '4px',
        }}>
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.title}
              style={{
                width: '100%', height: '100%', objectFit: 'contain',
                display: 'block',
              }}
            />
          ) : (
            <div style={{
              width: '100%', height: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '32px',
            }}>📦</div>
          )}

          {showDiscountBadge && discount > 0 && (
            <div style={{
              position: 'absolute', top: 0, right: 0,
              background: '#6b21a8',
              color: 'white', fontSize: '8px', fontWeight: '800',
              padding: '4px',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              borderBottomLeftRadius: '8px',
              borderTopRightRadius: '8px',
              lineHeight: '1',
              boxShadow: '0 2px 4px rgba(107,33,168,0.3)',
              zIndex: 2,
            }}>
              <span>{discount}%</span>
              <span style={{ fontSize: '6px' }}>off</span>
            </div>
          )}
        </div>

        <div style={{ padding: '2px 4px 6px', flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <div style={{
            fontSize: '10px', fontWeight: '600', color: '#1f2937',
            lineHeight: '1.25',
            display: '-webkit-box',
            WebkitLineClamp: 1,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {product.title}
          </div>

          <div style={{
            fontSize: '9px', color: '#6b7280', fontWeight: '500',
            display: 'flex', alignItems: 'center', gap: '2px'
          }}>
            {hasMultipleVariants ? 'Options' : (product.options?.[0] || '1 Item')}
            <svg width="6" height="6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', flexWrap: 'wrap', marginTop: '1px' }}>
            {showDiscount && product.compareAtPrice && product.compareAtPrice > product.price && (
              <span style={{ textDecoration: 'line-through', color: '#9ca3af', fontSize: '9px' }}>
                {formatMoney(product.compareAtPrice * 100)}
              </span>
            )}
            <span style={{ fontWeight: '800', fontSize: '12px', color: '#111827', letterSpacing: '-0.02em' }}>
              {formatMoney(product.price * 100)}
            </span>
          </div>

          {showAddButton && (
            <button
              onClick={(e) => handleAddClick(product, stableKey, e)}
              style={{
                width: '100%',
                padding: '3px 0',
                marginTop: '3px',
                background: isAdded ? '#10b981' : '#ffffff',
                color: isAdded ? '#ffffff' : '#db2777',
                border: isAdded ? '1px solid #10b981' : '1px solid #db2777',
                borderRadius: '4px',
                fontSize: '10px', fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
              }}
            >
              {isAdding ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'sd-spin 0.7s linear infinite' }}>
                  <circle cx="12" cy="12" r="10" strokeOpacity="0.3" />
                  <path d="M12 2a10 10 0 0 1 10 10" />
                </svg>
              ) : isAdded ? 'Added' : 'Add'}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <style>{RECO_KEYFRAMES}</style>
      <div style={{ marginTop: '8px' }}>
        {/* Section Header */}
        <div style={{
          display: 'flex', alignItems: 'center',
          marginBottom: '10px', padding: '0 4px'
        }}>
          <h4 style={{
            fontSize: '14px', fontWeight: '700', color: '#111827',
            margin: 0, letterSpacing: '-0.01em'
          }}>
            {title}
          </h4>
        </div>

        {/* Scroll Container Wrapper */}
        <div
          style={{ position: 'relative', overflow: 'hidden' }}
          onMouseEnter={() => setContainerHovered(true)}
          onMouseLeave={() => setContainerHovered(false)}
        >
          {/* Left Arrow */}
          {!isGrid && canScrollLeft && (
            <button
              onClick={() => handleScroll('left')}
              style={{
                position: 'absolute', left: '0', top: '50%',
                transform: `translateY(-50%) ${containerHovered ? 'scale(1)' : 'scale(0.8)'}`,
                background: 'rgba(255,255,255,0.95)',
                border: '1.5px solid #e5e7eb',
                borderRadius: '50%', width: '34px', height: '34px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', zIndex: 10,
                boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
                opacity: containerHovered ? 1 : 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#7c3aed';
                e.currentTarget.style.borderColor = '#7c3aed';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.95)';
                e.currentTarget.style.borderColor = '#e5e7eb';
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          )}

          {/* Right Arrow */}
          {!isGrid && canScrollRight && (
            <button
              onClick={() => handleScroll('right')}
              style={{
                position: 'absolute', right: '0', top: '50%',
                transform: `translateY(-50%) ${containerHovered ? 'scale(1)' : 'scale(0.8)'}`,
                background: 'rgba(255,255,255,0.95)',
                border: '1.5px solid #e5e7eb',
                borderRadius: '50%', width: '34px', height: '34px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', zIndex: 10,
                boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
                opacity: containerHovered ? 1 : 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#7c3aed';
                e.currentTarget.style.borderColor = '#7c3aed';
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.95)';
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.color = 'inherit';
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          )}

          {/* Products scroll */}
          <div
            ref={scrollContainerRef}
            style={isGrid ? {
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '6px',
            } : {
              display: 'flex',
              gap: '6px',
              overflowX: 'auto',
              scrollSnapType: 'x mandatory',
              WebkitOverflowScrolling: 'touch',
              paddingBottom: '8px',
              paddingTop: '4px',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none' as any,
              paddingLeft: '4px',
              paddingRight: '4px',
            }}
          >
            {displayProducts.map((product, idx) => renderProductCard(product, idx, false))}
          </div>
        </div>

        {/* See All link */}
        {showSeeAll && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '12px', marginBottom: '8px' }}>
            <div
              onClick={() => setShowAllModal(true)}
              style={{
                fontSize: '12px', fontWeight: '700', color: '#db2777',
                cursor: 'pointer', padding: '6px 16px', background: '#fdf2f8',
                borderRadius: '100px', display: 'flex', alignItems: 'center', gap: '4px'
              }}
            >
              See All {allValidProducts.length} <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
          </div>
        )}
      </div>

      {/* ALL PRODUCTS BOTTOM SHEET POPUP */}
      {showAllModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          zIndex: 999999,
          display: 'flex', flexDirection: 'column',
          justifyContent: 'flex-end',
        }}>
          {/* Backdrop */}
          <div 
             onClick={() => setShowAllModal(false)}
             style={{
               position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
               background: 'rgba(0,0,0,0.5)',
               animation: 'sd-backdrop-fade 0.3s ease'
             }} 
          />
          
          {/* Bottom Sheet */}
          <div style={{
            position: 'relative',
            background: '#ffffff',
            borderTopLeftRadius: '16px', borderTopRightRadius: '16px',
            maxHeight: '85vh',
            display: 'flex', flexDirection: 'column',
            animation: 'sd-bottom-sheet-up 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            boxShadow: '0 -4px 20px rgba(0,0,0,0.1)'
          }}>
            {/* Grabber indicator */}
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '10px' }}>
               <div style={{ width: '36px', height: '4px', background: '#d1d5db', borderRadius: '100px' }} />
            </div>

            {/* Header */}
            <div style={{
              padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              borderBottom: '1px solid #f3f4f6'
            }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#111827' }}>
                All Recommendations
              </h3>
              <button
                onClick={() => setShowAllModal(false)}
                style={{
                  border: 'none', background: '#f3f4f6', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '6px', color: '#111827',
                  borderRadius: '50%'
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {/* Grid Content */}
            <div style={{
              flex: 1, overflowY: 'auto', padding: '12px',
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px',
              alignContent: 'start',
              paddingBottom: 'safe-area-inset-bottom'
            }}>
              {allValidProducts.map((product, idx) => renderProductCard(product, idx, true))}
            </div>
          </div>
        </div>
      )}

      {/* Variant Picker Sheet */}
      {pickerProduct && (
        <VariantPickerSheet
          product={pickerProduct}
          onClose={() => setPickerProduct(null)}
          onAddToCart={(variantId) => {
            if (onAddToCart) onAddToCart(variantId);
            setPickerProduct(null);
          }}
          currency={(typeof window !== 'undefined' && (window as any).selldrawer_config?.currency?.code) || 'USD'}
          accentColor="#7c3aed"
        />
      )}
    </>
  );
};
