/**
 * Shared FBT Widget Component
 * Used in both production FBT widget and Remix preview
 */

import React, { useState, useEffect, useRef } from 'react';
import { FBTProductCard, FBTProduct } from './FBTProductCard';
import { FBTTemplateCompact } from './FBTTemplateCompact';
import { FBTTemplateMinimal } from './FBTTemplateMinimal';
import { FBTTemplateClassic } from './FBTTemplateClassic';

interface FBTConfig {
  title?: string;
  layout?: 'horizontal' | 'carousel';
  templateType?: 'classic' | 'compact' | 'minimal';
  buttonText?: string;
  buttonColor?: string;
  buttonTextColor?: string;
  showDiscount?: boolean;
  showTotalPrice?: boolean;
  showIndividualPrices?: boolean;
  showCheckboxes?: boolean;
  showProductReviews?: boolean;
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
  limitUpsellsInCart?: boolean;
  maxUpsellsInCart?: number;
}

interface FBTWidgetProps {
  config: FBTConfig;
  recommendations: FBTProduct[];
  selectedProductIds?: Set<string>;
  onSelectionChange?: (selectedIds: Set<string>) => void;
  onAddToCart?: (selectedIds: Set<string>) => void;
  onImpression?: () => void;
  onProductClick?: (productId: string, variantId?: string) => void;
  isPreview?: boolean;
}

export const FBTWidget: React.FC<FBTWidgetProps> = ({
  config,
  recommendations,
  selectedProductIds: initialSelectedIds,
  onSelectionChange,
  onAddToCart,
  onImpression,
  onProductClick,
  isPreview = false
}) => {
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(
    initialSelectedIds || new Set(
      recommendations.slice(0, config.maxUpsellsInCart || recommendations.length).map(r => r.variantId || r.id)
    )
  );
  const [isAdding, setIsAdding] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isMobileCarousel, setIsMobileCarousel] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const impressionTracked = useRef(false);

  useEffect(() => {
    if (!impressionTracked.current && onImpression && !isPreview && recommendations.length > 0) {
      onImpression();
      impressionTracked.current = true;
    }
  }, [onImpression, isPreview, recommendations.length]);

  const maxUpsells = config.limitUpsellsInCart && config.maxUpsellsInCart 
    ? config.maxUpsellsInCart 
    : null;

  // Check if we should show mobile carousel
  useEffect(() => {
    const checkMobile = () => {
      if (typeof window !== 'undefined') {
        setIsMobileCarousel(window.innerWidth <= 768);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handlePrevSlide = () => {
    if (carouselRef.current) {
      const cardWidth = carouselRef.current.querySelector('.upsellity-fbt-product')?.clientWidth || 200;
      const gap = 12; // 0.75rem gap
      carouselRef.current.scrollBy({
        left: -(cardWidth + gap),
        behavior: 'smooth'
      });
    }
  };

  const handleNextSlide = () => {
    if (carouselRef.current) {
      const cardWidth = carouselRef.current.querySelector('.upsellity-fbt-product')?.clientWidth || 200;
      const gap = 12; // 0.75rem gap
      carouselRef.current.scrollBy({
        left: cardWidth + gap,
        behavior: 'smooth'
      });
    }
  };

  // Mouse drag handlers for carousel
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!carouselRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - carouselRef.current.offsetLeft);
    setScrollLeft(carouselRef.current.scrollLeft);
    carouselRef.current.style.cursor = 'grabbing';
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    if (carouselRef.current) {
      carouselRef.current.style.cursor = 'grab';
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    if (carouselRef.current) {
      carouselRef.current.style.cursor = 'grab';
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !carouselRef.current) return;
    e.preventDefault();
    const x = e.pageX - carouselRef.current.offsetLeft;
    const walk = (x - startX) * 2; // Scroll speed multiplier
    carouselRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleToggle = (variantId: string, checked: boolean) => {
    const newSelected = new Set(selectedProducts);
    
    if (checked) {
      // Check if we're at the limit
      if (maxUpsells !== null && newSelected.size >= maxUpsells) {
        showLimitMessage(maxUpsells);
        return;
      }
      newSelected.add(variantId);
    } else {
      newSelected.delete(variantId);
    }
    
    setSelectedProducts(newSelected);
    if (onSelectionChange) {
      onSelectionChange(newSelected);
    }
  };

  const showLimitMessage = (max: number) => {
    // Only run in browser
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    
    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #fef3c7;
      border: 1px solid #f59e0b;
      color: #92400e;
      padding: 12px 16px;
      border-radius: 6px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      z-index: 10000;
      font-size: 14px;
      font-weight: 500;
    `;
    messageDiv.textContent = `Maximum ${max} upsell product${max > 1 ? 's' : ''} can be selected.`;
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
      messageDiv.remove();
    }, 3000);
  };

  // Helper function to convert price to number
  const parsePrice = (price: any): number => {
    if (price == null || price === undefined) return 0;
    if (typeof price === 'number') return price;
    if (typeof price === 'string') {
      const parsed = parseFloat(price);
      return isNaN(parsed) ? 0 : parsed;
    }
    // Handle Prisma Decimal type
    if (typeof price === 'object' && 'toNumber' in price) {
      return price.toNumber();
    }
    // Try to convert to string then parse
    try {
      const parsed = parseFloat(String(price));
      return isNaN(parsed) ? 0 : parsed;
    } catch {
      return 0;
    }
  };

  // Format money like cart drawer (₹ symbol, proper decimal parsing)
  const formatMoney = (price: number): string => {
    // If price is in cents (very large number), convert to currency unit
    const amount = price > 10000 ? price / 100 : price;
    // Round to whole number like cart drawer
    return `₹${Math.round(amount)}`;
  };

  const calculateTotal = () => {
    let total = 0;
    recommendations.forEach(product => {
      const variantId = product.variantId || product.id;
      if (selectedProducts.has(variantId)) {
        const price = parsePrice(product.price);
        total += price;
      }
    });

    // Apply discount if configured
    if (config.discountValue && config.discountType) {
      const discountValue = parsePrice(config.discountValue);
      if (config.discountType === 'percentage') {
        total = total * (1 - discountValue / 100);
      } else if (config.discountType === 'fixed') {
        total = Math.max(0, total - discountValue);
      }
    }

    return total;
  };

  const calculateOriginalTotal = () => {
    let total = 0;
    recommendations.forEach(product => {
      const variantId = product.variantId || product.id;
      if (selectedProducts.has(variantId)) {
        const comparePrice = parsePrice(product.compareAtPrice);
        const regularPrice = parsePrice(product.price);
        total += comparePrice > 0 ? comparePrice : regularPrice;
      }
    });
    return total;
  };

  const handleAddToCart = async () => {
    if (isPreview) return;
    
    setIsAdding(true);
    
    try {
      if (onAddToCart) {
        await onAddToCart(selectedProducts);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setIsAdding(false);
    }
  };

  const layout = config.layout || 'horizontal';
  const templateType = config.templateType || 'classic';
  const total = calculateTotal();
  const originalTotal = calculateOriginalTotal();
  const hasDiscount = config.showDiscount && originalTotal > total;
  const selectedCount = selectedProducts.size;
  const isAtLimit = maxUpsells !== null && selectedCount >= maxUpsells;

  if (showSuccess) {
    return (
      <div className="upsellity-fbt-content">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✓</div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#10b981', marginBottom: '0.5rem' }}>
            Items added to cart!
          </h3>
          <p style={{ color: '#6b7280' }}>Opening cart drawer...</p>
        </div>
      </div>
    );
  }

  // Render template based on type
  const renderTemplate = () => {
    // Check if carousel layout should be used
    const useCarousel = layout === 'carousel' || (isMobileCarousel && recommendations.length > 1);
    
    // Render Compact Template
    if (templateType === 'compact') {
      if (useCarousel) {
        // Carousel layout for compact template
        return (
          <div style={{ position: 'relative' }}>
            <div 
              ref={carouselRef}
              className="upsellity-fbt-carousel"
              onMouseDown={handleMouseDown}
              onMouseLeave={handleMouseLeave}
              onMouseUp={handleMouseUp}
              onMouseMove={handleMouseMove}
              style={{
                display: 'flex',
                overflow: 'auto',
                scrollSnapType: 'x mandatory',
                gap: '0.75rem',
                marginBottom: '1rem',
                cursor: 'grab',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch',
                userSelect: 'none'
              }}
            >
              <FBTTemplateCompact
                recommendations={recommendations}
                selectedProducts={selectedProducts}
                config={config}
                handleToggle={handleToggle}
                isPreview={isPreview}
                isAtLimit={isAtLimit}
                total={total}
                originalTotal={originalTotal}
                selectedCount={selectedCount}
                onAddToCart={handleAddToCart}
                isAdding={isAdding}
              />
            </div>
            
            {/* Carousel Navigation Controls */}
            {!isMobileCarousel && recommendations.length > 2 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <button
                  onClick={handlePrevSlide}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#2563eb'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#3b82f6'}
                >
                  ← Prev
                </button>
                <button
                  onClick={handleNextSlide}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#2563eb'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#3b82f6'}
                >
                  Next →
                </button>
              </div>
            )}
            
            {/* Mobile Carousel Indicators */}
            {isMobileCarousel && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.25rem', marginBottom: '0.75rem' }}>
                {recommendations.map((_, idx) => (
                  <div
                    key={idx}
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '4px',
                      background: '#d1d5db',
                      transition: 'all 0.2s'
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        );
      }
      
      // Horizontal layout for compact template
      return (
        <FBTTemplateCompact
          recommendations={recommendations}
          selectedProducts={selectedProducts}
          config={config}
          handleToggle={handleToggle}
          isPreview={isPreview}
          isAtLimit={isAtLimit}
          total={total}
          originalTotal={originalTotal}
          selectedCount={selectedCount}
          onAddToCart={handleAddToCart}
          isAdding={isAdding}
        />
      );
    } 
    
    // Render Minimal Template
    else if (templateType === 'minimal') {
      if (useCarousel) {
        // Carousel layout for minimal template
        return (
          <div style={{ position: 'relative' }}>
            <div 
              ref={carouselRef}
              className="upsellity-fbt-carousel"
              onMouseDown={handleMouseDown}
              onMouseLeave={handleMouseLeave}
              onMouseUp={handleMouseUp}
              onMouseMove={handleMouseMove}
              style={{
                display: 'flex',
                overflow: 'auto',
                scrollSnapType: 'x mandatory',
                gap: '0.75rem',
                marginBottom: '1rem',
                cursor: 'grab',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch',
                userSelect: 'none'
              }}
            >
              <FBTTemplateMinimal
                recommendations={recommendations}
                selectedProducts={selectedProducts}
                config={config}
                handleToggle={handleToggle}
                isPreview={isPreview}
                isAtLimit={isAtLimit}
                total={total}
                originalTotal={originalTotal}
                selectedCount={selectedCount}
                onAddToCart={handleAddToCart}
                isAdding={isAdding}
              />
            </div>
            
            {/* Carousel Navigation Controls */}
            {!isMobileCarousel && recommendations.length > 2 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <button
                  onClick={handlePrevSlide}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#2563eb'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#3b82f6'}
                >
                  ← Prev
                </button>
                <button
                  onClick={handleNextSlide}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#2563eb'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#3b82f6'}
                >
                  Next →
                </button>
              </div>
            )}
            
            {/* Mobile Carousel Indicators */}
            {isMobileCarousel && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.25rem', marginBottom: '0.75rem' }}>
                {recommendations.map((_, idx) => (
                  <div
                    key={idx}
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '4px',
                      background: '#d1d5db',
                      transition: 'all 0.2s'
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        );
      }
      
      // Horizontal layout for minimal template
      return (
        <FBTTemplateMinimal
          recommendations={recommendations}
          selectedProducts={selectedProducts}
          config={config}
          handleToggle={handleToggle}
          isPreview={isPreview}
          isAtLimit={isAtLimit}
          total={total}
          originalTotal={originalTotal}
          selectedCount={selectedCount}
          onAddToCart={handleAddToCart}
          isAdding={isAdding}
        />
      );
    } 
    
    // Render Classic Template
    else {
      if (useCarousel) {
        // Carousel layout for classic template
        return (
          <div style={{ position: 'relative' }}>
            <div 
              ref={carouselRef}
              className="upsellity-fbt-carousel"
              onMouseDown={handleMouseDown}
              onMouseLeave={handleMouseLeave}
              onMouseUp={handleMouseUp}
              onMouseMove={handleMouseMove}
              style={{
                display: 'flex',
                overflow: 'auto',
                scrollSnapType: 'x mandatory',
                gap: '0.75rem',
                marginBottom: '1rem',
                cursor: 'grab',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch',
                userSelect: 'none'
              }}
            >
              {recommendations.map((product) => {
                const variantId = product.variantId || product.id;
                const isSelected = selectedProducts.has(variantId);
                const isDisabled = isAtLimit && !isSelected;
                
                return (
                  <div 
                    key={variantId}
                    style={{
                      minWidth: isMobileCarousel ? '100%' : '180px',
                      scrollSnapAlign: 'start',
                      flexShrink: 0
                    }}
                  >
                    <FBTProductCard
                      product={product}
                      isSelected={isSelected}
                      isDisabled={isDisabled}
                      showCheckbox={config.showCheckboxes ?? true}
                      showDiscount={config.showDiscount ?? true}
                      showIndividualPrices={config.showIndividualPrices ?? true}
                      showReviews={config.showProductReviews ?? false}
                      onToggle={handleToggle}
                      isPreview={isPreview}
                    />
                  </div>
                );
              })}
            </div>
            
            {/* Carousel Navigation Controls */}
            {!isMobileCarousel && recommendations.length > 3 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <button
                  onClick={handlePrevSlide}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#2563eb'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#3b82f6'}
                >
                  ← Prev
                </button>
                <button
                  onClick={handleNextSlide}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#2563eb'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#3b82f6'}
                >
                  Next →
                </button>
              </div>
            )}
            
            {/* Mobile Carousel Indicators */}
            {isMobileCarousel && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.25rem', marginBottom: '0.75rem' }}>
                {recommendations.map((_, idx) => (
                  <div
                    key={idx}
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '4px',
                      background: '#d1d5db',
                      transition: 'all 0.2s'
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        );
      }
      
      // Horizontal layout for classic template
      return (
        <FBTTemplateClassic
          recommendations={recommendations}
          selectedProducts={selectedProducts}
          config={config}
          handleToggle={handleToggle}
          isPreview={isPreview}
          isAtLimit={isAtLimit}
        />
      );
    }
  };

  return (
    <div className="upsellity-fbt-content">
      <h2 
        className="upsellity-fbt-title"
        style={{
          fontSize: '1rem',
          fontWeight: '600',
          marginBottom: '0.75rem',
          color: '#111827',
          lineHeight: 1.2
        }}
      >
        {config.title || 'Frequently Bought Together'}
      </h2>
      
      <div 
        className="upsellity-fbt-layout"
        style={{
          display: (templateType === 'compact' || templateType === 'minimal') ? 'block' : 'grid',
          gridTemplateColumns: (templateType === 'compact' || templateType === 'minimal') ? '1fr' : (isMobileCarousel ? '1fr' : '1fr 220px'),
          gap: '0.75rem',
          alignItems: 'center'
        }}
      >
        {renderTemplate()}
        
        {templateType !== 'compact' && templateType !== 'minimal' && (
        <div 
          className="upsellity-fbt-sidebar"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            alignItems: 'stretch',
            justifyContent: 'center',
            minHeight: '100%'
          }}
        >
          {config.showTotalPrice && (
            <div 
              className="upsellity-fbt-total"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.25rem',
                padding: '0.5rem 0.625rem',
                background: '#f9fafb',
                borderRadius: '4px',
                marginBottom: '0.25rem',
                border: '1px solid #e5e7eb'
              }}
            >
              <span 
                className="upsellity-fbt-total-label"
                style={{
                  fontSize: '0.8125rem',
                  fontWeight: '600',
                  color: '#111827'
                }}
              >
                Total price:
              </span>
              <div>
                {hasDiscount && (
                <span 
                  className="upsellity-fbt-total-original"
                  style={{
                    textDecoration: 'line-through',
                    color: '#9ca3af',
                    marginRight: '0.375rem',
                    fontSize: '0.8125rem',
                    fontWeight: '400'
                  }}
                >
                  {formatMoney(originalTotal)}
                </span>
                )}
                <span 
                  className="upsellity-fbt-total-price"
                  style={{
                    fontSize: '1rem',
                    fontWeight: '700',
                    color: '#111827'
                  }}
                >
                  {formatMoney(total)}
                </span>
              </div>
            </div>
          )}
          
          <button 
            className="upsellity-fbt-button" 
            onClick={handleAddToCart}
            disabled={selectedCount === 0 || isAdding || isPreview}
            style={{
              width: '100%',
              padding: '0.75rem 0.625rem',
              border: 'none',
              borderRadius: '4px',
              fontSize: '0.8125rem',
              fontWeight: '600',
              cursor: (selectedCount === 0 || isAdding || isPreview) ? 'not-allowed' : 'pointer',
              transition: 'opacity 0.2s, transform 0.1s',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              backgroundColor: config.buttonColor || '#000000',
              color: config.buttonTextColor || '#FFFFFF',
              opacity: (selectedCount === 0 || isAdding) ? 0.5 : 1,
              lineHeight: 1.2
            }}
          >
            {isAdding ? 'Adding...' : `${config.buttonText || 'Add selected items'} ${selectedCount > 0 ? `(${selectedCount})` : ''}`}
          </button>
        </div>
        )}
      </div>
    </div>
  );
};

