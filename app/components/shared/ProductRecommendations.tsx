/**
 * Shared Product Recommendations Component
 * Premium redesign — works in any Shopify theme (light)
 */

import React, { useState, useEffect, useRef } from 'react';

interface Product {
  id: string;
  shopifyProductId?: string;
  shopifyVariantId?: string;
  title: string;
  price: number;
  compareAtPrice?: number;
  imageUrl?: string;
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
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const impressionTracked = useRef(false);

  const isGrid = layout === 'grid';
  const displayProducts = products.slice(0, maxProducts);

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
  }, [products, isGrid]);

  const handleScroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;
    container.scrollBy({ left: direction === 'left' ? -160 : 160, behavior: 'smooth' });
  };

  const handleAddClick = async (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    const variantId = product.shopifyVariantId || product.shopifyProductId;
    if (!variantId || !onAddToCart || isPreview) return;

    setAddingIds(prev => new Set([...prev, product.id]));
    try {
      onAddToCart(variantId);
      await new Promise(r => setTimeout(r, 600));
      setAddedIds(prev => new Set([...prev, product.id]));
      setTimeout(() => {
        setAddedIds(prev => { const next = new Set(prev); next.delete(product.id); return next; });
      }, 1500);
    } finally {
      setAddingIds(prev => { const next = new Set(prev); next.delete(product.id); return next; });
    }
  };

  const handleCardClick = (product: Product) => {
    if (onProductClick) {
      const variantId = product.shopifyVariantId || product.shopifyProductId;
      onProductClick(product.id, variantId);
    }
  };

  if (displayProducts.length === 0) return null;

  return (
    <>
      <style>{RECO_KEYFRAMES}</style>
      <div style={{ marginTop: '8px' }}>
        {/* Section Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          marginBottom: '12px',
        }}>
          <div style={{
            width: '3px', height: '16px',
            background: 'linear-gradient(180deg, #7c3aed, #a78bfa)',
            borderRadius: '100px', flexShrink: 0,
          }} />
          <h4 style={{
            fontSize: '13px', fontWeight: '700', color: '#111827',
            letterSpacing: '-0.01em', margin: 0,
          }}>
            {title}
          </h4>
          <div style={{
            marginLeft: 'auto',
            fontSize: '10px', fontWeight: '600', color: '#7c3aed',
            background: '#f5f3ff', padding: '2px 8px',
            borderRadius: '100px', border: '1px solid #ede9fe',
          }}>
            {displayProducts.length} picks
          </div>
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
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: '10px',
            } : {
              display: 'flex',
              gap: '10px',
              overflowX: 'auto',
              scrollSnapType: 'x mandatory',
              WebkitOverflowScrolling: 'touch',
              paddingBottom: '6px',
              paddingTop: '2px',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none' as any,
              paddingLeft: canScrollLeft ? '40px' : '2px',
              paddingRight: canScrollRight ? '40px' : '2px',
            }}
          >
            {displayProducts.map((product, idx) => {
              const discount = product.compareAtPrice && product.compareAtPrice > product.price
                ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
                : 0;
              const isAdding = addingIds.has(product.id);
              const isAdded = addedIds.has(product.id);
              const isCardHovered = hoveredId === product.id;

              // Badge label logic
              const badgeLabel = discount >= 20 ? 'Best Seller' : discount > 0 ? `−${discount}%` : null;

              return (
                <div
                  key={product.id}
                  onClick={() => handleCardClick(product)}
                  onMouseEnter={() => setHoveredId(product.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{
                    ...(isGrid ? {} : {
                      minWidth: '140px', maxWidth: '140px',
                      flexShrink: 0,
                      scrollSnapAlign: 'start',
                    }),
                    borderRadius: '14px',
                    border: `1.5px solid ${isCardHovered ? '#c4b5fd' : '#e5e7eb'}`,
                    overflow: 'hidden',
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
                  {/* Image area */}
                  <div style={{
                    position: 'relative',
                    aspectRatio: '1',
                    overflow: 'hidden',
                    background: '#f4f4f8',
                    borderRadius: '12px 12px 0 0',
                  }}>
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.title}
                        style={{
                          width: '100%', height: '100%', objectFit: 'cover',
                          display: 'block',
                          transform: isCardHovered ? 'scale(1.08)' : 'scale(1)',
                          transition: 'transform 0.4s cubic-bezier(0.4,0,0.2,1)',
                        }}
                      />
                    ) : (
                      <div style={{
                        width: '100%', height: '100%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '32px',
                      }}>📦</div>
                    )}

                    {/* Badge */}
                    {showDiscountBadge && badgeLabel && (
                      <div style={{
                        position: 'absolute', top: '7px', left: '7px',
                        background: discount >= 20
                          ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                          : 'linear-gradient(135deg, #10b981, #059669)',
                        color: 'white', fontSize: '8px', fontWeight: '700',
                        padding: '3px 7px', borderRadius: '7px',
                        letterSpacing: '0.04em',
                        boxShadow: discount >= 20
                          ? '0 2px 8px rgba(245,158,11,0.4)'
                          : '0 2px 8px rgba(16,185,129,0.4)',
                      }}>
                        {discount >= 20 ? '⭐ ' : ''}{badgeLabel}
                      </div>
                    )}

                    {/* Quick Add overlay */}
                    {showAddButton && isCardHovered && (
                      <div
                        style={{
                          position: 'absolute', bottom: 0, left: 0, right: 0,
                          background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)',
                          padding: '20px 8px 8px',
                          animation: 'sd-reco-quick-add-up 0.2s ease',
                        }}
                        onClick={(e) => handleAddClick(product, e)}
                      >
                        <button
                          style={{
                            width: '100%',
                            padding: '7px 0',
                            background: isAdded
                              ? 'linear-gradient(135deg, #10b981, #059669)'
                              : 'rgba(255,255,255,0.92)',
                            backdropFilter: 'blur(4px)',
                            color: isAdded ? 'white' : '#111827',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '11px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            letterSpacing: '0.02em',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                            transition: 'all 0.25s ease',
                            animation: isAdded ? 'sd-reco-add-success 0.35s ease' : undefined,
                          }}
                        >
                          {isAdding ? (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'sd-spin 0.7s linear infinite' }}>
                              <circle cx="12" cy="12" r="10" strokeOpacity="0.3" />
                              <path d="M12 2a10 10 0 0 1 10 10" />
                            </svg>
                          ) : isAdded ? (
                            '✓ Added!'
                          ) : (
                            <>
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                              </svg>
                              Quick Add
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Info area */}
                  <div style={{ padding: '8px 10px 10px', flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    {/* Title */}
                    <div style={{
                      fontSize: '11px', fontWeight: '600', color: '#111827',
                      lineHeight: '1.3',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      letterSpacing: '-0.01em',
                      minHeight: '28px',
                    }}>
                      {product.title}
                    </div>

                    {/* Price */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
                      {showDiscount && product.compareAtPrice && product.compareAtPrice > product.price ? (
                        <>
                          <span style={{ textDecoration: 'line-through', color: '#d1d5db', fontSize: '10px' }}>
                            ₹{Math.round(product.compareAtPrice)}
                          </span>
                          <span style={{ fontWeight: '800', fontSize: '13px', color: '#d97706', letterSpacing: '-0.02em' }}>
                            ₹{Math.round(product.price)}
                          </span>
                        </>
                      ) : (
                        <span style={{ fontWeight: '800', fontSize: '13px', color: '#111827', letterSpacing: '-0.02em' }}>
                          ₹{Math.round(product.price)}
                        </span>
                      )}
                    </div>

                    {/* Add button (for non-hover / grid layout) */}
                    {showAddButton && (isGrid || !isCardHovered) && (
                      <button
                        onClick={(e) => handleAddClick(product, e)}
                        style={{
                          width: '100%',
                          padding: '6px 0',
                          marginTop: '2px',
                          background: isAdded
                            ? 'linear-gradient(135deg, #10b981, #059669)'
                            : 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                          color: 'white',
                          border: 'none', borderRadius: '8px',
                          fontSize: '10px', fontWeight: '700',
                          cursor: 'pointer',
                          letterSpacing: '0.02em',
                          boxShadow: isAdded
                            ? '0 2px 8px rgba(16,185,129,0.3)'
                            : '0 2px 8px rgba(124,58,237,0.3)',
                          transition: 'all 0.25s ease',
                          animation: isAdded ? 'sd-reco-add-success 0.35s ease' : undefined,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                        }}
                        onMouseEnter={(e) => {
                          if (!isAdded) {
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = '0 4px 14px rgba(124,58,237,0.4)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = isAdded
                            ? '0 2px 8px rgba(16,185,129,0.3)'
                            : '0 2px 8px rgba(124,58,237,0.3)';
                        }}
                      >
                        {isAdding ? (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" style={{ animation: 'sd-spin 0.7s linear infinite' }}>
                            <circle cx="12" cy="12" r="10" strokeOpacity="0.3" />
                            <path d="M12 2a10 10 0 0 1 10 10" />
                          </svg>
                        ) : isAdded ? '✓ Added!' : '+ Add'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};
