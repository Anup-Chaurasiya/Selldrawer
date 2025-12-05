/**
 * Shared Nudge Popup Widget Component
 * Used in both production nudge widget and Remix preview
 */

import React, { useState, useEffect, CSSProperties } from 'react';

export interface NudgeProduct {
  id: string;
  variantId: string;
  title: string;
  handle: string;
  price: number;
  compareAtPrice?: number;
  imageUrl?: string;
  description?: string;
}

interface NudgeConfig {
  title: string;
  subtitle: string;
  layout: 'grid' | 'list' | 'carousel';
  maxProducts: number;
  showProductImage: boolean;
  showProductDescription: boolean;
  showProductPrice: boolean;
  showProductComparePrice: boolean;
  continueButtonText: string;
  continueButtonColor: string;
  continueButtonTextColor: string;
  selectButtonText: string;
  selectButtonColor: string;
  selectButtonTextColor: string;
  overlayColor: string;
  overlayOpacity: number;
  popupBackgroundColor: string;
  popupBorderRadius: number;
  closeButtonColor: string;
  titleColor: string;
  subtitleColor: string;
  enableAnimation: boolean;
  animationType: 'fade' | 'slide-up' | 'scale';
  popupDelay: number;
  showOnAddToCart: boolean;
}

interface NudgeWidgetProps {
  config: NudgeConfig;
  recommendations: NudgeProduct[];
  onClose?: () => void;
  onContinue?: () => void;
  onSelectProduct?: (product: NudgeProduct) => void;
  onSelectAll?: (products: NudgeProduct[]) => void;
  onImpression?: () => void;
  isPreview?: boolean;
  isVisible?: boolean;
  checkboxMode?: boolean; // Enable checkbox selection mode
  selectedProductIds?: Set<string>; // Set of selected product IDs for checkbox mode
}

export const NudgeWidget: React.FC<NudgeWidgetProps> = ({
  config,
  recommendations,
  onClose,
  onContinue,
  onSelectProduct,
  onSelectAll,
  onImpression,
  isPreview = false,
  isVisible = true,
  checkboxMode = false,
  selectedProductIds = new Set()
}) => {
  const [animationClass, setAnimationClass] = useState('');
  const impressionTracked = React.useRef(false);

  useEffect(() => {
    if (isVisible && !isPreview && !impressionTracked.current && onImpression) {
      onImpression();
      impressionTracked.current = true;
    }
  }, [isVisible, isPreview, onImpression]);

  useEffect(() => {
    if (isVisible && config.enableAnimation) {
      // Trigger animation after mount
      setTimeout(() => {
        setAnimationClass('upsellity-nudge-visible');
      }, 10);
    }
  }, [isVisible, config.enableAnimation]);

  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const formatPrice = (cents: number): string => {
    const amount = cents > 10000 ? cents / 100 : cents;
    return `₹${Math.round(amount)}`;
  };

  const stripHtml = (html: string): string => {
    if (typeof document !== 'undefined') {
      const tmp = document.createElement('div');
      tmp.innerHTML = html;
      return tmp.textContent || tmp.innerText || '';
    }
    return html.replace(/<[^>]*>/g, '');
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (isPreview) return;
    if (e.target === e.currentTarget && onClose) {
      onClose();
    }
  };

  const productsToShow = recommendations.slice(0, config.maxProducts);

  if (!isVisible) return null;

  const overlayOpacity = isPreview ? Math.min(config.overlayOpacity, 60) : config.overlayOpacity;

  const overlayStyle: CSSProperties = {
    backgroundColor: hexToRgba(config.overlayColor, overlayOpacity / 100),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: isPreview || !config.enableAnimation ? 1 : animationClass ? 1 : 0,
    transition: 'opacity 0.3s ease'
  };

  const popupStyle: CSSProperties = {
    position: 'relative',
    maxWidth: '900px',
    width: '90%',
    maxHeight: '90vh',
    overflowY: 'auto',
    padding: '2rem',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: config.popupBackgroundColor,
    borderRadius: `${config.popupBorderRadius}px`
  };

  if (isPreview) {
    Object.assign(overlayStyle, {
      position: 'relative',
      width: '100%',
      height: '100%',
      minHeight: '520px',
      borderRadius: '20px',
      // padding: '1.5rem',
      boxSizing: 'border-box'
    });

    Object.assign(popupStyle, {
      maxWidth: '520px',
      width: '100%',
      maxHeight: '100%',
      // padding: '1.5rem',
      boxShadow: '0 25px 60px rgba(15, 23, 42, 0.25)',
      transform: 'scale(0.95)',
      transformOrigin: 'top center'
    });
  } else {
    Object.assign(overlayStyle, {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 99999
    });
  }

  return (
    <div 
      className={`upsellity-nudge-overlay ${config.enableAnimation && !isPreview ? `upsellity-nudge-animation-${config.animationType}` : ''} ${animationClass}`}
      style={overlayStyle}
      onClick={handleOverlayClick}
    >
      <div 
        className="upsellity-nudge-popup"
        style={popupStyle}
      >
        {/* Close Button */}
        <button
          className="upsellity-nudge-close"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'none',
            border: 'none',
            fontSize: '2rem',
            cursor: isPreview ? 'not-allowed' : 'pointer',
            lineHeight: 1,
            padding: '0.25rem 0.5rem',
            transition: 'opacity 0.2s ease',
            zIndex: 1,
            color: config.closeButtonColor
          }}
        >
          &times;
        </button>

        {/* Title */}
        <h2 
          className="upsellity-nudge-title"
          style={{
            fontSize: '1.75rem',
            fontWeight: 600,
            margin: '0 0 0.5rem 0',
            paddingRight: '3rem',
            textAlign: 'center',
            width: '100%',
            color: config.titleColor
          }}
        >
          {config.title}
        </h2>

        {/* Subtitle */}
        <p 
          className="upsellity-nudge-subtitle"
          style={{
            fontSize: '1rem',
            margin: '0 0 1.5rem 0',
            opacity: 0.8,
            textAlign: 'center',
            width: '100%',
            color: config.subtitleColor
          }}
        >
          {config.subtitle}
        </p>

        {/* Products Container */}
        <div 
          className={`upsellity-nudge-products upsellity-nudge-layout-${config.layout} upsellity-nudge-products-${productsToShow.length}`}
          style={{
            display: config.layout === 'grid' ? 'grid' : 'flex',
            gridTemplateColumns: config.layout === 'grid' ? 'repeat(auto-fit, minmax(220px, 280px))' : undefined,
            flexDirection: config.layout === 'list' ? 'column' : undefined,
            gap: '1.5rem',
            marginBottom: '1.5rem',
            justifyContent: 'center',
            alignItems: 'flex-start',
            flexWrap: config.layout === 'carousel' ? 'nowrap' : 'wrap',
            overflow: config.layout === 'carousel' ? 'auto' : undefined,
            scrollSnapType: config.layout === 'carousel' ? 'x mandatory' : undefined,
            width: '100%',
            maxWidth: '100%'
          }}
        >
          {productsToShow.map((product) => {
            const isSelected = checkboxMode && selectedProductIds.has(product.id);
            return (
              <div
                key={product.id}
                className="upsellity-nudge-product-card"
                onClick={() => !isPreview && onSelectProduct && onSelectProduct(product)}
                style={{
                  border: checkboxMode && isSelected ? '2px solid #4F46E5' : '1px solid #e5e7eb',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  background: '#ffffff',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
                  width: '100%',
                  maxWidth: '280px',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: isPreview ? 'default' : 'pointer',
                  minWidth: config.layout === 'carousel' ? '250px' : undefined,
                  scrollSnapAlign: config.layout === 'carousel' ? 'start' : undefined,
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  if (!isPreview) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Checkbox for checkbox mode */}
                {checkboxMode && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '0.75rem',
                      right: '0.75rem',
                      zIndex: 2
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isPreview && onSelectProduct) {
                        onSelectProduct(product);
                      }
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      disabled={isPreview}
                      style={{
                        width: '20px',
                        height: '20px',
                        cursor: isPreview ? 'not-allowed' : 'pointer',
                        accentColor: config.selectButtonColor || '#4F46E5'
                      }}
                    />
                  </div>
                )}
              {config.showProductImage && product.imageUrl && (
                <img 
                  src={product.imageUrl}
                  alt={product.title}
                  className="upsellity-nudge-product-image"
                  style={{
                    width: '100%',
                    height: '200px',
                    objectFit: 'cover'
                  }}
                />
              )}

              <div 
                className="upsellity-nudge-product-details"
                style={{
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  flexGrow: 1
                }}
              >
                <h3 
                  className="upsellity-nudge-product-title"
                  style={{
                    fontSize: '1rem',
                    fontWeight: 600,
                    margin: '0 0 0.5rem 0',
                    lineHeight: 1.4,
                    paddingRight: checkboxMode ? '2rem' : '0'
                  }}
                >
                  {product.title}
                </h3>

                {config.showProductDescription && product.description && (
                  <p 
                    className="upsellity-nudge-product-description"
                    style={{
                      fontSize: '0.875rem',
                      color: '#6b7280',
                      margin: '0 0 0.75rem 0',
                      lineHeight: 1.5
                    }}
                  >
                    {stripHtml(product.description).substring(0, 100)}...
                  </p>
                )}

                {config.showProductPrice && (
                  <div 
                    className="upsellity-nudge-product-price-container"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginTop: 'auto',
                      paddingTop: '0.5rem'
                    }}
                  >
                    {config.showProductComparePrice && product.compareAtPrice && product.compareAtPrice > product.price && (
                      <span 
                        className="upsellity-nudge-product-compare-price"
                        style={{
                          fontSize: '0.875rem',
                          color: '#9ca3af',
                          textDecoration: 'line-through'
                        }}
                      >
                        {formatPrice(product.compareAtPrice)}
                      </span>
                    )}
                    <span 
                      className="upsellity-nudge-product-price"
                      style={{
                        fontSize: '1.125rem',
                        fontWeight: 600,
                        color: '#111827'
                      }}
                    >
                      {formatPrice(product.price)}
                    </span>
                  </div>
                )}
              </div>
            </div>
            );
          })}
        </div>

        {/* Bottom Action Section */}
        <div 
          className="upsellity-nudge-bottom-section"
          style={{
            display: 'flex',
            gap: '1rem',
            marginTop: '1.5rem',
            alignItems: 'flex-start',
            width: '100%',
            maxWidth: '100%'
          }}
        >
          {/* Continue Button - Hide in checkbox mode */}
          {!checkboxMode && onContinue && (
            <div 
              className="upsellity-nudge-continue-section"
              style={{
                flex: 1,
                minWidth: 0
              }}
            >
              <button
                className="upsellity-nudge-continue-btn"
                onClick={onContinue}
                disabled={isPreview}
                style={{
                  width: '100%',
                  padding: '1rem 1.5rem',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: isPreview ? 'not-allowed' : 'pointer',
                  transition: 'opacity 0.2s ease',
                  backgroundColor: config.continueButtonColor,
                  color: config.continueButtonTextColor,
                  opacity: isPreview ? 0.6 : 1
                }}
                onMouseEnter={(e) => {
                  if (!isPreview) e.currentTarget.style.opacity = '0.9';
                }}
                onMouseLeave={(e) => {
                  if (!isPreview) e.currentTarget.style.opacity = '1';
                }}
              >
                {config.continueButtonText}
              </button>
            </div>
          )}

          {/* Select All Button - Show only if not in checkbox mode or if checkbox mode, show as "Add Selected" */}
          {productsToShow.length > 0 && !checkboxMode && (
            <div 
              className="upsellity-nudge-selection-section"
              style={{
                flex: 1,
                minWidth: 0
              }}
            >
              <button
                className="upsellity-nudge-select-all-btn"
                onClick={() => !isPreview && onSelectAll && onSelectAll(productsToShow)}
                disabled={isPreview}
                style={{
                  width: '100%',
                  padding: '1rem 1.5rem',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: isPreview ? 'not-allowed' : 'pointer',
                  transition: 'opacity 0.2s ease',
                  backgroundColor: config.selectButtonColor,
                  color: config.selectButtonTextColor,
                  opacity: isPreview ? 0.6 : 1
                }}
                onMouseEnter={(e) => {
                  if (!isPreview) e.currentTarget.style.opacity = '0.9';
                }}
                onMouseLeave={(e) => {
                  if (!isPreview) e.currentTarget.style.opacity = '1';
                }}
              >
                {config.selectButtonText}
              </button>
            </div>
          )}
          {/* Add Selected Button for checkbox mode */}
          {checkboxMode && productsToShow.length > 0 && (
            <div 
              className="upsellity-nudge-selection-section"
              style={{
                flex: 1,
                minWidth: 0
              }}
            >
              <button
                className="upsellity-nudge-add-selected-btn"
                onClick={() => !isPreview && onSelectAll && onSelectAll(productsToShow.filter(p => selectedProductIds.has(p.id)))}
                disabled={isPreview || selectedProductIds.size === 0}
                style={{
                  width: '100%',
                  padding: '1rem 1.5rem',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: (isPreview || selectedProductIds.size === 0) ? 'not-allowed' : 'pointer',
                  transition: 'opacity 0.2s ease',
                  backgroundColor: config.selectButtonColor,
                  color: config.selectButtonTextColor,
                  opacity: (isPreview || selectedProductIds.size === 0) ? 0.6 : 1
                }}
                onMouseEnter={(e) => {
                  if (!isPreview && selectedProductIds.size > 0) e.currentTarget.style.opacity = '0.9';
                }}
                onMouseLeave={(e) => {
                  if (!isPreview && selectedProductIds.size > 0) e.currentTarget.style.opacity = '1';
                }}
              >
                {config.selectButtonText} {selectedProductIds.size > 0 && `(${selectedProductIds.size})`}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

