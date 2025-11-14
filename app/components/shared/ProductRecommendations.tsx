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

    const scrollAmount = isPreview ? 140 : 140;
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
    <div style={{ marginTop: isPreview ? '16px' : '8px' }}>
      <h4 style={{ 
        fontSize: isPreview ? '15px' : '14px', 
        fontWeight: '600', 
        marginBottom: '8px',
        color: '#111827'
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

        {/* Right Arrow - Only show for carousel layout */}
        {!isGrid && canScrollRight && (
          <button
            onClick={() => handleScroll('right')}
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
          ref={scrollContainerRef}
          style={isGrid ? {
            display: 'grid',
            gridTemplateColumns: `repeat(auto-fit, minmax(${isPreview ? '120px' : '120px'}, 1fr))`,
            gap: '8px',
            paddingBottom: '8px'
          } : {
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            scrollBehavior: 'smooth',
            paddingBottom: '8px',
            scrollbarWidth: 'thin',
            scrollbarColor: '#cbd5e1 #f1f5f9',
            paddingLeft: canScrollLeft ? '40px' : '0',
            paddingRight: canScrollRight ? '40px' : '0',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch'
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
                  padding: '8px',
                  textAlign: 'center',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                } : {
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  padding: '8px',
                  textAlign: 'center',
                  minWidth: isPreview ? '120px' : '120px',
                  flexShrink: 0,
                  backgroundColor: '#ffffff',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                }}
              >
                {/* Product Image */}
                <div style={{ position: 'relative', marginBottom: '6px' }}>
                  {product.imageUrl ? (
                    <img 
                      src={product.imageUrl} 
                      alt={product.title}
                      style={{ 
                        width: '100%', 
                        height: '60px', 
                        objectFit: 'cover',
                        borderRadius: '4px'
                      }} 
                    />
                  ) : (
                    <div style={{ 
                      width: '100%', 
                      height: '60px', 
                      backgroundColor: '#f3f4f6',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '24px'
                    }}>📦</div>
                  )}
                  
                  {/* Discount Badge */}
                  {showDiscountBadge && discount > 0 && (
                    <div style={{ 
                      position: 'absolute',
                      top: '4px',
                      right: '4px',
                      backgroundColor: '#10b981',
                      color: 'white',
                      padding: '2px 6px',
                      borderRadius: '10px',
                      fontSize: '9px',
                      fontWeight: '600',
                      zIndex: 1
                    }}>
                      {discount}% off
                    </div>
                  )}
                </div>

                {/* Product Title */}
                <div style={{ 
                  fontSize: '11px', 
                  fontWeight: '600', 
                  marginBottom: '4px', 
                  lineHeight: '1.3',
                  color: '#111827',
                  minHeight: '28px',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {product.title}
                </div>

                {/* Price */}
                <div style={{ marginBottom: '4px' }}>
                  {showDiscount && product.compareAtPrice && product.compareAtPrice > product.price ? (
                    <>
                      <span style={{ 
                        textDecoration: 'line-through',
                        color: '#9ca3af',
                        fontSize: '10px',
                        marginRight: '4px'
                      }}>
                        ₹{Math.round(product.compareAtPrice)}
                      </span>
                      <span style={{ fontWeight: '600', fontSize: '11px', color: '#111827' }}>
                        ₹{Math.round(product.price)}
                      </span>
                    </>
                  ) : (
                    <span style={{ fontWeight: '600', fontSize: '11px', color: '#111827' }}>
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
                      backgroundColor: '#f97316',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#ea580c';
                      e.currentTarget.style.transform = 'scale(1.02)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#f97316';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    + Add
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

