/**
 * Shared FBT Widget Component
 * Used in both production FBT widget and Remix preview
 */

import React, { useState, useEffect, useRef } from 'react';
import { FBTProductCard, FBTProduct } from './FBTProductCard';
import { FBTTemplateMinimal } from './FBTTemplateMinimal';
import { FBTTemplateClassic } from './FBTTemplateClassic';

interface FBTConfig {
  title?: string;
  templateType?: 'classic' | 'minimal';
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
  maxUpsellsShown?: number;
}

interface FBTWidgetProps {
  config: FBTConfig;
  recommendations: FBTProduct[];
  parentProduct?: FBTProduct | null;
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
  parentProduct,
  selectedProductIds: initialSelectedIds,
  onSelectionChange,
  onAddToCart,
  onImpression,
  onProductClick,
  isPreview = false
}) => {
  // Initialize selected products including parent product by default
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(() => {
    const initial = new Set<string>();

    // Always select parent product first
    if (parentProduct) {
      initial.add(parentProduct.variantId || parentProduct.id);
    }

    // Then add recommendations based on initial selection or limit
    if (initialSelectedIds) {
      initialSelectedIds.forEach(id => initial.add(id));
    } else {
      recommendations.forEach(r => initial.add(r.variantId || r.id));
    }

    return initial;
  });
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

  const maxUpsells = null;

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
    // Prevent deselection of parent product
    const parentVariantId = parentProduct?.variantId || parentProduct?.id;
    if (!checked && variantId === parentVariantId) {
      return; // Don't allow deselecting parent product
    }

    const newSelected = new Set(selectedProducts);

    if (checked) {
      newSelected.add(variantId);
    } else {
      newSelected.delete(variantId);
    }

    setSelectedProducts(newSelected);
    if (onSelectionChange) {
      onSelectionChange(newSelected);
    }
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

  // Format money - Shopify prices are already in dollars/rupees
  const formatMoney = (price: number): string => {
    // Shopify GraphQL and Storefront API return prices in currency units (not cents)
    // So we just format them directly
    return `₹${Math.round(price)}`;
  };

  const calculateTotal = () => {
    let total = 0;

    // Include parent product price
    if (parentProduct) {
      const parentVariantId = parentProduct.variantId || parentProduct.id;
      if (selectedProducts.has(parentVariantId)) {
        total += parsePrice(parentProduct.price);
      }
    }

    // Include recommendations prices
    recommendations.forEach(product => {
      const variantId = product.variantId || product.id;
      if (selectedProducts.has(variantId)) {
        const price = parsePrice(product.price);
        total += price;
      }
    });

    // Return total WITHOUT FBT bundle discount
    // (This allows templates to show original vs discounted price)
    return total;
  };

  const calculateDiscountedTotal = (originalTotal: number) => {
    let discountedTotal = originalTotal;

    // Apply FBT bundle discount if configured
    if (config.discountValue && config.discountType) {
      const discountValue = parsePrice(config.discountValue);
      if (config.discountType === 'percentage') {
        discountedTotal = originalTotal * (1 - discountValue / 100);
      } else if (config.discountType === 'fixed') {
        discountedTotal = Math.max(0, originalTotal - discountValue);
      }
    }

    return discountedTotal;
  };

  const calculateOriginalTotal = () => {
    let total = 0;

    // Include parent product original price
    if (parentProduct) {
      const parentVariantId = parentProduct.variantId || parentProduct.id;
      if (selectedProducts.has(parentVariantId)) {
        const comparePrice = parsePrice(parentProduct.compareAtPrice);
        const regularPrice = parsePrice(parentProduct.price);
        total += comparePrice > 0 ? comparePrice : regularPrice;
      }
    }

    // Include recommendations original prices
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


  const templateType = config.templateType || 'classic';

  // Calculate totals
  const bundleTotal = calculateTotal(); // Original total without FBT bundle discount
  const total = calculateDiscountedTotal(bundleTotal); // Apply FBT bundle discount
  const originalTotal = calculateOriginalTotal(); // Total using compareAtPrice if available

  // Show discount if:
  // 1. FBT bundle discount is configured (discountType and discountValue exist)
  // 2. OR if there are compareAtPrice differences
  const hasFBTDiscount = Boolean(config.discountType && config.discountValue && bundleTotal > total);
  const hasCompareAtDiscount = config.showDiscount && originalTotal > bundleTotal;
  const hasDiscount = hasFBTDiscount || hasCompareAtDiscount;

  // For display, show bundleTotal with strikethrough if FBT discount exists
  // Otherwise show originalTotal (compareAtPrice) with strikethrough
  const displayOriginalPrice = hasFBTDiscount ? bundleTotal : originalTotal;

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
    // For minimal template: use carousel on mobile
    // For classic template: never use carousel, just stack with flexWrap
    const useCarousel = templateType === 'minimal' && isMobileCarousel && recommendations.length > 1;

    // Render Minimal Template
    if (templateType === 'minimal') {
      if (useCarousel) {
        // Carousel layout for minimal template
        return (
          <div style={{ position: 'relative', width: '100%' }}>
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
                parentProduct={parentProduct}
                selectedProducts={selectedProducts}
                config={config}
                handleToggle={handleToggle}
                isPreview={isPreview}
                isAtLimit={isAtLimit}
                total={total}
                originalTotal={displayOriginalPrice}
                bundleTotal={bundleTotal}
                hasDiscount={hasDiscount}
                hasFBTDiscount={hasFBTDiscount}
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
          parentProduct={parentProduct}
          selectedProducts={selectedProducts}
          config={config}
          handleToggle={handleToggle}
          isPreview={isPreview}
          isAtLimit={isAtLimit}
          total={total}
          originalTotal={displayOriginalPrice}
          bundleTotal={bundleTotal}
          hasDiscount={hasDiscount}
          hasFBTDiscount={hasFBTDiscount}
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
          parentProduct={parentProduct}
          selectedProducts={selectedProducts}
          config={config}
          handleToggle={handleToggle}
        />
      );
    }
  };

  return (
    <div className="upsellity-fbt-content">
      <h2
        className="upsellity-fbt-title"
        style={{
          fontSize: '1em',
          fontWeight: '600',
          marginBottom: '0.75em',
          color: '#111827',
          lineHeight: 1.2
        }}
      >
        {config.title || 'Frequently Bought Together'}
      </h2>

      <div
        className="upsellity-fbt-layout"
        style={{
          display: 'flex',
          flexDirection: templateType === 'minimal' ? 'column' : 'row',
          flexWrap: 'wrap',
          gap: '1em',
          alignItems: templateType === 'minimal' ? 'stretch' : 'center',
          width: '100%'
        }}
      >
        {renderTemplate()}

        {templateType !== 'minimal' && (
          <div
            className="upsellity-fbt-actions"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75em',
              alignItems: 'center',
              maxWidth: '350px',
              width: '100%'
            }}
          >
            {config.showTotalPrice && (
              <div
                className="upsellity-fbt-total"
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5em',
                  padding: '0.625em 1em',
                  background: '#f9fafb',
                  borderRadius: '6px',
                  border: '1px solid #e5e7eb',
                  width: '100%'
                }}
              >
                <span
                  className="upsellity-fbt-total-label"
                  style={{
                    fontSize: '0.8125em',
                    fontWeight: '600',
                    color: '#6b7280'
                  }}
                >
                  Total:
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375em' }}>
                  {hasDiscount && (
                    <span
                      className="upsellity-fbt-total-original"
                      style={{
                        textDecoration: 'line-through',
                        color: '#9ca3af',
                        fontSize: '0.8125em',
                        fontWeight: '400'
                      }}
                    >
                      {formatMoney(displayOriginalPrice)}
                    </span>
                  )}
                  <span
                    className="upsellity-fbt-total-price"
                    style={{
                      fontSize: '1em',
                      fontWeight: '700',
                      color: hasDiscount ? '#059669' : '#111827'
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
                padding: '0.75em 1.25em',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.875em',
                fontWeight: '600',
                cursor: (selectedCount === 0 || isAdding || isPreview) ? 'not-allowed' : 'pointer',
                transition: 'opacity 0.2s, transform 0.1s',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
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

