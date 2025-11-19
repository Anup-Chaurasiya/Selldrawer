/**
 * Shared FBT Widget Component
 * Used in both production FBT widget and Remix preview
 */

import React, { useState, useEffect, useRef } from 'react';
import { FBTProductCard, FBTProduct } from './FBTProductCard';
import { FBTTemplateCompact } from './FBTTemplateCompact';
import { FBTTemplateMinimal } from './FBTTemplateMinimal';

interface FBTConfig {
  title?: string;
  layout?: 'horizontal' | 'vertical' | 'grid';
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
  isPreview?: boolean;
}

export const FBTWidget: React.FC<FBTWidgetProps> = ({
  config,
  recommendations,
  selectedProductIds: initialSelectedIds,
  onSelectionChange,
  onAddToCart,
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
    setCurrentSlide(prev => Math.max(0, prev - 1));
  };

  const handleNextSlide = () => {
    setCurrentSlide(prev => Math.min(recommendations.length - 1, prev + 1));
  };

  useEffect(() => {
    if (carouselRef.current && isMobileCarousel) {
      const slideWidth = carouselRef.current.offsetWidth;
      carouselRef.current.scrollTo({
        left: currentSlide * slideWidth,
        behavior: 'smooth'
      });
    }
  }, [currentSlide, isMobileCarousel]);

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

  const calculateTotal = () => {
    let total = 0;
    recommendations.forEach(product => {
      const variantId = product.variantId || product.id;
      if (selectedProducts.has(variantId)) {
        total += product.price || 0;
      }
    });

    // Apply discount if configured
    if (config.discountValue && config.discountType) {
      if (config.discountType === 'percentage') {
        total = total * (1 - config.discountValue / 100);
      } else if (config.discountType === 'fixed') {
        total = Math.max(0, total - config.discountValue);
      }
    }

    return total;
  };

  const calculateOriginalTotal = () => {
    let total = 0;
    recommendations.forEach(product => {
      const variantId = product.variantId || product.id;
      if (selectedProducts.has(variantId)) {
        total += product.compareAtPrice || product.price || 0;
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
    if (templateType === 'compact') {
      return (
        <FBTTemplateCompact
          recommendations={recommendations}
          selectedProducts={selectedProducts}
          config={config}
          handleToggle={handleToggle}
          isPreview={isPreview}
          isAtLimit={isAtLimit}
        />
      );
    } else if (templateType === 'minimal') {
      return (
        <FBTTemplateMinimal
          recommendations={recommendations}
          selectedProducts={selectedProducts}
          config={config}
          handleToggle={handleToggle}
          isPreview={isPreview}
          isAtLimit={isAtLimit}
        />
      );
    } else {
      // Classic template with carousel support for mobile
      if (isMobileCarousel && recommendations.length > 1) {
        return (
          <div style={{ position: 'relative' }}>
            <div 
              ref={carouselRef}
              className="upsellity-fbt-carousel"
              style={{
                display: 'flex',
                overflow: 'hidden',
                scrollSnapType: 'x mandatory',
                gap: '1rem',
                marginBottom: '1rem'
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
                      minWidth: '100%',
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
            
            {/* Carousel Controls */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <button
                onClick={handlePrevSlide}
                disabled={currentSlide === 0}
                style={{
                  padding: '0.5rem 1rem',
                  background: currentSlide === 0 ? '#e5e7eb' : '#3b82f6',
                  color: currentSlide === 0 ? '#9ca3af' : 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: currentSlide === 0 ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '600'
                }}
              >
                ← Prev
              </button>
              <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                {recommendations.map((_, idx) => (
                  <div
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    style={{
                      width: idx === currentSlide ? '24px' : '8px',
                      height: '8px',
                      borderRadius: '4px',
                      background: idx === currentSlide ? '#3b82f6' : '#d1d5db',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  />
                ))}
              </div>
              <button
                onClick={handleNextSlide}
                disabled={currentSlide === recommendations.length - 1}
                style={{
                  padding: '0.5rem 1rem',
                  background: currentSlide === recommendations.length - 1 ? '#e5e7eb' : '#3b82f6',
                  color: currentSlide === recommendations.length - 1 ? '#9ca3af' : 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: currentSlide === recommendations.length - 1 ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '600'
                }}
              >
                Next →
              </button>
            </div>
          </div>
        );
      }
      
      // Classic desktop layout
      return (
        <div 
          className={`upsellity-fbt-products layout-${layout}`}
          style={{
            display: layout === 'grid' ? 'grid' : 'flex',
            gap: '0.5rem',
            marginBottom: '0.75rem',
            flexWrap: 'wrap',
            alignItems: 'stretch',
            ...(layout === 'horizontal' ? { flexDirection: 'row' } : {}),
            ...(layout === 'vertical' ? { flexDirection: 'column' } : {}),
            ...(layout === 'grid' ? { 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' 
            } : {})
          }}
        >
          {recommendations.map((product, index) => {
            const variantId = product.variantId || product.id;
            const isSelected = selectedProducts.has(variantId);
            const isDisabled = isAtLimit && !isSelected;
            
            return (
              <React.Fragment key={variantId}>
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
                {index < recommendations.length - 1 && (
                  <div 
                    className="upsellity-fbt-plus"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1rem',
                      color: '#6b7280',
                      fontWeight: '600',
                      minWidth: '20px',
                      flexShrink: 0
                    }}
                  >
                    +
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
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
          display: 'grid',
          gridTemplateColumns: isMobileCarousel ? '1fr' : '1fr 240px',
          gap: '0.75rem',
          alignItems: 'center'
        }}
      >
        {renderTemplate()}
        
        <div 
          className="upsellity-fbt-sidebar"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
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
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.5rem 0.625rem',
                background: '#f9fafb',
                borderRadius: '4px',
                marginBottom: '0.5rem',
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
                    ${originalTotal.toFixed(2)}
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
                  ${total.toFixed(2)}
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
              padding: '0.625rem',
              border: 'none',
              borderRadius: '4px',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: (selectedCount === 0 || isAdding || isPreview) ? 'not-allowed' : 'pointer',
              transition: 'opacity 0.2s, transform 0.1s',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              backgroundColor: config.buttonColor || '#000000',
              color: config.buttonTextColor || '#FFFFFF',
              opacity: (selectedCount === 0 || isAdding) ? 0.5 : 1
            }}
          >
            {isAdding ? 'Adding...' : `${config.buttonText || 'Add selected items'} ${selectedCount > 0 ? `(${selectedCount})` : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
};

