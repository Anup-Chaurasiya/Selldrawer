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
  handle?: string;
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
  initialProductsShow?: number;
  seeAllLink?: string;
  showDiscount?: boolean;
  showDiscountBadge?: boolean;
  showAddButton?: boolean;
  onAddToCart?: (variantId: string) => void;
  onImpression?: () => void;
  onProductClick?: (productId: string, variantId?: string) => void;
  isPreview?: boolean;
}

const RECO_KEYFRAMES = `
  @keyframes sd-reco-fade-up {
    0% { opacity: 0; transform: translateY(12px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  @keyframes sd-reco-image-zoom {
    0% { transform: scale(1); }
    100% { transform: scale(1.06); }
  }
  @keyframes sd-reco-success-pop {
    0% { transform: scale(1); }
    50% { transform: scale(0.92); }
    100% { transform: scale(1); }
  }
  @keyframes sd-reco-shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
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
  @keyframes sd-check-draw {
    from { stroke-dashoffset: 20; }
    to { stroke-dashoffset: 0; }
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
  isPreview = false,
  initialProductsShow = 6,
  seeAllLink = '/collections/all',
}) => {
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [containerHovered, setContainerHovered] = useState(false);
  const [addingIds, setAddingIds] = useState<Set<string>>(new Set());
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [pickerProduct, setPickerProduct] = useState<VariantPickerProduct | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const impressionTracked = useRef(false);

  const isGrid = layout === 'grid';

  // displayLimit is now strictly driven by initialProductsShow (dynamic)
  // We cap it at the actual products length
  const limit = initialProductsShow || maxProducts || 4;
  const displayLimit = isGrid
    ? Math.min(products.length, Math.floor(limit / 3) * 3 || 3)
    : Math.min(products.length, limit);

  const displayProducts = products.slice(0, displayLimit);
  const showSeeAll = products.length > displayLimit;

  // Drag-to-scroll state
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  useEffect(() => {
    if (!impressionTracked.current && onAddToCart && !isPreview && displayProducts.length > 0) {
      if (onImpression) onImpression();
      impressionTracked.current = true;
    }
  }, [onImpression, isPreview, displayProducts.length, onAddToCart]);

  const updateScrollState = () => {
    const container = scrollContainerRef.current;
    if (!container || isGrid) return;
    const maxScrollLeft = container.scrollWidth - container.clientWidth;
    const currentScroll = container.scrollLeft;
    setCanScrollLeft(currentScroll > 10);
    setCanScrollRight(currentScroll < maxScrollLeft - 10);
  };

  useEffect(() => {
    updateScrollState();
    const container = scrollContainerRef.current;
    if (container && !isGrid) {
      container.addEventListener('scroll', updateScrollState);
      return () => container.removeEventListener('scroll', updateScrollState);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products.length, isGrid, displayLimit]);

  // Support for horizontal mouse wheel
  const handleWheel = (e: React.WheelEvent) => {
    const container = scrollContainerRef.current;
    if (!container || isGrid) return;
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      e.preventDefault();
      container.scrollLeft += e.deltaX;
      updateScrollState();
    }
  };

  // Drag to scroll logic (Free Shipping style)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isGrid || !scrollContainerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
    scrollContainerRef.current.style.scrollSnapType = 'none'; // Disable snap while dragging
    scrollContainerRef.current.style.cursor = 'grabbing';
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || isGrid || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 1.5; // Scroll speed
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  const stopDragging = () => {
    if (isDragging && scrollContainerRef.current) {
      scrollContainerRef.current.style.scrollSnapType = 'x mandatory'; // Re-enable snap
      scrollContainerRef.current.style.cursor = 'pointer';
    }
    setIsDragging(false);
  };

  const handleScroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Scroll by exactly one card width if possible
    const card = container.firstElementChild as HTMLElement;
    const scrollAmount = card ? card.offsetWidth + 10 : container.clientWidth * 0.8;
    container.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
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
    // 1. Track analytics via callback
    if (onProductClick) {
      const variantId = product.shopifyVariantId || product.shopifyProductId;
      onProductClick(product.id, variantId);
    }

    // 2. Perform redirection "nicely"
    if (isPreview) return;

    const handle = product.handle || product.shopifyProductId;
    if (handle) {
      // If it looks like a GID, don't use it as a handle directly
      const finalHandle = typeof handle === 'string' && handle.includes('gid://') 
        ? handle.split('/').pop() 
        : handle;
      
      window.location.href = `/products/${finalHandle}`;
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
    const accentColor = '#db2777'; // Premium pink/purple

    return (
      <div
        key={stableKey}
        onClick={() => handleCardClick(product)}
        onMouseEnter={() => setHoveredId(stableKey)}
        onMouseLeave={() => setHoveredId(null)}
        style={{
          ...(isGrid || isModal ? {} : {
            flex: '0 0 calc((100% - 16px) / 3)',
            scrollSnapAlign: 'start',
          }),
          borderRadius: '14px',
          border: '1px solid transparent',
          background: '#ffffff',
          boxShadow: isCardHovered
            ? '0 12px 24px -8px rgba(0,0,0,0.15), 0 4px 12px -4px rgba(0,0,0,0.08)'
            : '0 4px 10px -4px rgba(0,0,0,0.05), 0 1px 4px -2px rgba(0,0,0,0.03)',
          transition: 'all 0.4s cubic-bezier(0.2, 1, 0.3, 1)',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column' as const,
          transform: isCardHovered ? 'translateY(-4px)' : 'translateY(0)',
          animation: `sd-reco-fade-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${idx * 0.08}s both`,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Discount Badge - Pill style */}
        {showDiscountBadge && discount > 0 && (
          <div style={{
            position: 'absolute', top: '8px', left: '8px',
            background: 'linear-gradient(135deg, #f472b6, #db2777)',
            color: 'white', fontSize: '9px', fontWeight: '800',
            padding: '3px 8px',
            borderRadius: '100px',
            zIndex: 10,
            boxShadow: '0 4px 10px rgba(219,39,119,0.3)',
            letterSpacing: '0.02em',
            display: 'flex', alignItems: 'center', gap: '2px'
          }}>
            <span>{discount}%</span>
            <span style={{ fontSize: '7px', opacity: 0.9, textTransform: 'uppercase' }}>OFF</span>
          </div>
        )}

        <div style={{
          position: 'relative',
          aspectRatio: '1 / 1.1',
          background: '#F9FAFB',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.title}
              style={{
                width: '90%', height: '90%', objectFit: 'contain',
                display: 'block',
                transition: 'transform 0.6s cubic-bezier(0.2, 1, 0.3, 1)',
                transform: isCardHovered ? 'scale(1.1)' : 'scale(1)',
              }}
            />
          ) : (
            <div style={{
              width: '100%', height: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '32px',
            }}>📦</div>
          )}
        </div>

        <div style={{ padding: '8px 10px 10px', flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{
            fontSize: '11px', fontWeight: '700', color: '#111827',
            lineHeight: '1.3',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            minHeight: '2.6em',
            letterSpacing: '-0.01em',
          }}>
            {product.title}
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 'auto' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
              {showDiscount && product.compareAtPrice && product.compareAtPrice > product.price && (
                <span style={{ textDecoration: 'line-through', color: '#9CA3AF', fontSize: '9px', fontWeight: '500' }}>
                  {formatMoney(product.compareAtPrice * 100)}
                </span>
              )}
              <span style={{ fontWeight: '850', fontSize: '13px', color: '#111827', letterSpacing: '-0.02em' }}>
                {formatMoney(product.price * 100)}
              </span>
            </div>

            {hasMultipleVariants && (
              <div style={{
                fontSize: '8px', color: '#6B7280', fontWeight: '700',
                textTransform: 'uppercase', letterSpacing: '0.05em',
                background: '#F3F4F6', padding: '2px 6px', borderRadius: '4px'
              }}>
                Options
              </div>
            )}
          </div>

          {showAddButton && (
            <button
              onClick={(e) => handleAddClick(product, stableKey, e)}
              style={{
                width: '100%',
                padding: '7px 0',
                marginTop: '6px',
                background: isAdded ? '#10B981' : isCardHovered ? '#111827' : '#ffffff',
                color: isAdded ? '#ffffff' : isCardHovered ? '#ffffff' : '#111827',
                border: isAdded ? '1px solid #10B981' : '1.5px solid #E5E7EB',
                borderRadius: '8px',
                fontSize: '11px', fontWeight: '800',
                cursor: 'pointer',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                boxShadow: isCardHovered && !isAdded ? '0 4px 12px rgba(0,0,0,0.1)' : 'none',
                transform: isAdding ? 'scale(0.98)' : 'scale(1)',
              }}
            >
              {isAdding ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ animation: 'sd-spin 0.7s linear infinite' }}>
                  <circle cx="12" cy="12" r="10" strokeOpacity="0.3" />
                  <path d="M12 2a10 10 0 0 1 10 10" />
                </svg>
              ) : isAdded ? (
                <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" style={{ strokeDasharray: 20, strokeDashoffset: 20, animation: 'sd-check-draw 0.3s forwards' }}>
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Added
                </>
              ) : (
                <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  Add
                </>
              )}
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
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: '12px', padding: '0 6px'
        }}>
          <h4 style={{
            fontSize: '15px', fontWeight: '850', color: '#111827',
            margin: 0, letterSpacing: '-0.02em',
            display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            {title}
            <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#db2777' }}></span>
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
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={stopDragging}
            onMouseLeave={stopDragging}
            onWheel={handleWheel}
            style={isGrid ? {
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '10px',
            } : {
              display: 'flex',
              gap: '10px',
              overflowX: 'auto',
              scrollSnapType: isDragging ? 'none' : 'x mandatory',
              WebkitOverflowScrolling: 'touch',
              paddingBottom: isGrid ? '0' : '8px',
              paddingTop: '6px',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none' as any,
              paddingLeft: '6px',
              paddingRight: '6px',
              cursor: isDragging ? 'grabbing' : 'pointer',
              userSelect: 'none',
            }}
          >
            {displayProducts.map((product, idx) => renderProductCard(product, idx, false))}
          </div>
        </div>

        {/* Unified See All Button - Flush & Integrated Footer */}
        {showSeeAll && (
          <div style={{ marginTop: '0', padding: '0' }}>
            <a
              href={seeAllLink}
              style={{
                width: '100%',
                fontSize: '13px', fontWeight: '850', color: '#db2777',
                textDecoration: 'none',
                cursor: 'pointer',
                padding: '1px 0',
                background: '#fdf2f8',
                borderRadius: '0 0 14px 14px', // Rounded only at bottom
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                transition: 'all 0.3s cubic-bezier(0.2, 1, 0.3, 1)',
                borderTop: '1px solid rgba(219,39,119,0.1)',
                borderLeft: '1px solid rgba(219,39,119,0.05)',
                borderRight: '1px solid rgba(219,39,119,0.05)',
                borderBottom: '1px solid rgba(219,39,119,0.05)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#db2777';
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = '#fdf2f8';
                e.currentTarget.style.color = '#db2777';
              }}
            >
              See All Items ({products.length})
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </a>
          </div>
        )}
      </div>

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
