/**
 * Shared Product Recommendations Component
 * Used in both production cart drawer and Remix preview
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
  isPreview?: boolean;
}

export const ProductRecommendations: React.FC<ProductRecommendationsProps> = ({
  title = "You may also like",
  products = [],
  layout = 'carousel',
  maxProducts = 4,
  showDiscount = true,
  showDiscountBadge = true,
  showAddButton = true,
  onAddToCart,
  isPreview = false
}) => {
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const isGrid = layout === 'grid';
  const displayProducts = products.slice(0, maxProducts);

  // Handle scroll state for carousel layout
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

    const scrollAmount = 140;
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  const handleAddClick = (product: Product) => {
    const variantId = product.shopifyVariantId || product.shopifyProductId;
    if (variantId && onAddToCart) {
      onAddToCart(variantId);
    }
  };

  if (displayProducts.length === 0) {
    return null;
  }

  return (
    <div style={{ marginTop: '8px' }}>
      <style>{`
        .upsellity-product-recommendations-scroll::-webkit-scrollbar {
          display: none;
        }
        .upsellity-product-recommendations-scroll {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      <h4 style={{ 
        fontSize: '13px', 
        fontWeight: '600', 
        marginBottom: '4px',
        color: '#111827',
        letterSpacing: '-0.01em'
      }}>
        {title}
      </h4>
      
      <div style={{ 
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Left Arrow - Only show for carousel layout */}
        {!isGrid && canScrollLeft && (
          <button
            onClick={() => handleScroll('left')}
            style={{
              position: 'absolute',
              left: '4px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 10,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f9fafb';
              e.currentTarget.style.borderColor = '#d1d5db';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
              e.currentTarget.style.transform = 'translateY(-50%) scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#ffffff';
              e.currentTarget.style.borderColor = '#e5e7eb';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.12)';
              e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
            }}
          >
            <span style={{ fontSize: '18px', color: '#374151', fontWeight: '300' }}>‹</span>
          </button>
        )}

        {/* Right Arrow - Only show for carousel layout */}
        {!isGrid && canScrollRight && (
          <button
            onClick={() => handleScroll('right')}
            style={{
              position: 'absolute',
              right: '4px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 10,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f9fafb';
              e.currentTarget.style.borderColor = '#d1d5db';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
              e.currentTarget.style.transform = 'translateY(-50%) scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#ffffff';
              e.currentTarget.style.borderColor = '#e5e7eb';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.12)';
              e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
            }}
          >
            <span style={{ fontSize: '18px', color: '#374151', fontWeight: '300' }}>›</span>
          </button>
        )}

        <div 
          ref={scrollContainerRef}
          className={!isGrid ? 'upsellity-product-recommendations-scroll' : ''}
          style={isGrid ? {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: '6px',
            paddingBottom: '0px'
          } : {
            display: 'flex',
            gap: '6px',
            overflowX: 'auto',
            scrollBehavior: 'smooth',
            paddingBottom: '5px',
            paddingTop: '5px',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
            paddingLeft: canScrollLeft ? '44px' : '0',
            paddingRight: canScrollRight ? '44px' : '0'
          }}
        >
          {displayProducts.map((product) => {
            const discount = product.compareAtPrice && product.compareAtPrice > product.price
              ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
              : 0;

            return (
              <div 
                key={product.id} 
                style={isGrid ? {
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  padding: '6px',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%'
                } : {
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  padding: '6px',
                  minWidth: '120px',
                  maxWidth: '120px',
                  flexShrink: 0,
                  backgroundColor: '#ffffff',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.12)';
                  e.currentTarget.style.borderColor = '#d1d5db';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.08)';
                  e.currentTarget.style.borderColor = '#e5e7eb';
                }}
              >
                {/* Product Image */}
                <div style={{ 
                  position: 'relative', 
                  marginBottom: '4px',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  backgroundColor: '#f9fafb',
                  aspectRatio: '1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {product.imageUrl ? (
                    <img 
                      src={product.imageUrl} 
                      alt={product.title}
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover',
                        display: 'block'
                      }} 
                    />
                  ) : (
                    <div style={{ 
                      width: '100%', 
                      height: '100%', 
                      backgroundColor: '#f3f4f6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '24px',
                      color: '#9ca3af'
                    }}>📦</div>
                  )}
                  
                  {/* Discount Badge */}
                  {showDiscountBadge && discount > 0 && (
                    <div style={{ 
                      position: 'absolute',
                      top: '3px',
                      right: '3px',
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: 'white',
                      padding: '1px 5px',
                      borderRadius: '8px',
                      fontSize: '8px',
                      fontWeight: '700',
                      zIndex: 1,
                      boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)',
                      letterSpacing: '0.3px'
                    }}>
                      -{discount}%
                    </div>
                  )}
                </div>

                {/* Product Title */}
                <div style={{ 
                  fontSize: '10px', 
                  fontWeight: '500', 
                  marginBottom: '2px', 
                  lineHeight: '1.2',
                  color: '#111827',
                  minHeight: '24px',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  letterSpacing: '-0.01em'
                }}>
                  {product.title}
                </div>

                {/* Price */}
                <div style={{ 
                  marginBottom: '4px',
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: '4px',
                  flexWrap: 'wrap'
                }}>
                  {showDiscount && product.compareAtPrice && product.compareAtPrice > product.price ? (
                    <>
                      <span style={{ 
                        textDecoration: 'line-through',
                        color: '#9ca3af',
                        fontSize: '9px',
                        fontWeight: '400'
                      }}>
                        ₹{Math.round(product.compareAtPrice)}
                      </span>
                      <span style={{ 
                        fontWeight: '700', 
                        fontSize: '11px', 
                        color: '#111827',
                        letterSpacing: '-0.01em'
                      }}>
                        ₹{Math.round(product.price)}
                      </span>
                    </>
                  ) : (
                    <span style={{ 
                      fontWeight: '700', 
                      fontSize: '11px', 
                      color: '#111827',
                      letterSpacing: '-0.01em'
                    }}>
                      ₹{Math.round(product.price)}
                    </span>
                  )}
                </div>

                {/* Add Button */}
                {showAddButton && (
                  <button 
                    onClick={() => handleAddClick(product)}
                    style={{
                      width: '100%',
                      padding: '4px 8px',
                      background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '9px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: '0 1px 3px rgba(249, 115, 22, 0.3)',
                      letterSpacing: '0.2px',
                      marginTop: 'auto'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #ea580c 0%, #dc2626 100%)';
                      e.currentTarget.style.boxShadow = '0 2px 6px rgba(249, 115, 22, 0.4)';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)';
                      e.currentTarget.style.boxShadow = '0 1px 3px rgba(249, 115, 22, 0.3)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                    onMouseDown={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                    onMouseUp={(e) => {
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                  >
                    + Add to Cart
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

