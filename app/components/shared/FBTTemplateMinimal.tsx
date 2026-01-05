/**
 * Minimal Template for FBT Widget
 * Shows only total price and configurable button, optionally shows products if configured
 */

import React from 'react';
import { FBTProduct } from './FBTProductCard';

interface FBTTemplateMinimalProps {
  recommendations: FBTProduct[];
  parentProduct?: FBTProduct | null;
  selectedProducts: Set<string>;
  config: any;
  handleToggle: (variantId: string, checked: boolean) => void;
  isPreview?: boolean;
  isAtLimit: boolean;
  total: number;
  originalTotal?: number;
  bundleTotal?: number;
  hasDiscount?: boolean;
  hasFBTDiscount?: boolean;
  selectedCount: number;
  onAddToCart?: () => void;
  isAdding?: boolean;
}

export const FBTTemplateMinimal: React.FC<FBTTemplateMinimalProps> = ({
  recommendations,
  parentProduct,
  selectedProducts,
  config,
  handleToggle,
  isPreview,
  isAtLimit,
  total,
  originalTotal = 0,
  bundleTotal,
  hasDiscount = false,
  hasFBTDiscount = false,
  selectedCount,
  onAddToCart,
  isAdding = false
}) => {

  // Format money like cart drawer (₹ symbol, proper decimal parsing)
  const formatMoney = (price: number): string => {
    // Shopify prices are already in currency units (not cents)
    return `₹${Math.round(price)}`;
  };

  return (
    <div
      className="upsellity-fbt-template-minimal"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}
    >
      {/* Products section */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          gap: '0.75rem',
          padding: '1rem',
          background: '#ffffff',
          borderRadius: '10px',
          border: '1px solid #e5e7eb'
        }}
      >
        {/* Render Parent Product First */}
        {parentProduct && (() => {
          const variantId = parentProduct.variantId || parentProduct.id;
          const isSelected = selectedProducts.has(variantId);
          const discountPercent = parentProduct.compareAtPrice && parentProduct.price < parentProduct.compareAtPrice
            ? Math.round(((parentProduct.compareAtPrice - parentProduct.price) / parentProduct.compareAtPrice) * 100)
            : 0;

          return (
            <React.Fragment key={`parent-${variantId}`}>
              <div style={{ position: 'relative' }}>
                <div
                  className="upsellity-fbt-minimal-card selected"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #3b82f6',
                    borderRadius: '12px',
                    background: '#f9fafb',
                    transition: 'all 0.2s',
                    position: 'relative',
                    boxShadow: '0 6px 14px rgba(59, 130, 246, 0.2)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.375rem'
                  }}
                >
                  <div style={{ position: 'relative', width: '100%' }}>
                    {parentProduct.imageUrl ? (
                      <img
                        src={parentProduct.imageUrl}
                        alt={parentProduct.title}
                        style={{
                          width: '100%',
                          height: '110px',
                          objectFit: 'cover',
                          borderRadius: '8px',
                          background: '#f3f4f6'
                        }}
                      />
                    ) : (
                      <div style={{
                        width: '100%',
                        height: '110px',
                        backgroundColor: '#f3f4f6',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '40px'
                      }}>
                        📦
                      </div>
                    )}
                    {discountPercent > 0 && config.showDiscount && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '8px',
                          left: '8px',
                          background: '#10b981',
                          color: 'white',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                        }}
                      >
                        {discountPercent}% off
                      </div>
                    )}
                  </div>

                  {/* Product Title */}
                  <h4
                    style={{
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#111827',
                      lineHeight: 1.4,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      margin: 0,
                      textAlign: 'center'
                    }}
                  >
                    {parentProduct.title}
                  </h4>

                  {/* Individual Price Display */}
                  {config.showIndividualPrices && (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.375rem',
                      flexWrap: 'wrap'
                    }}>
                      {parentProduct.compareAtPrice && config.showDiscount && (
                        <span
                          style={{
                            textDecoration: 'line-through',
                            color: '#9ca3af',
                            fontSize: '0.6875rem',
                            fontWeight: '400'
                          }}
                        >
                          {formatMoney(parentProduct.compareAtPrice)}
                        </span>
                      )}
                      <span
                        style={{
                          fontSize: '0.875rem',
                          fontWeight: '700',
                          color: '#111827'
                        }}
                      >
                        {formatMoney(parentProduct.price)}
                      </span>
                    </div>
                  )}
                </div>

                {/* "This Item" Badge */}
                <div
                  style={{
                    position: 'absolute',
                    top: '-10px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: '#3b82f6',
                    color: 'white',
                    padding: '4px 10px',
                    borderRadius: '4px',
                    fontSize: '0.65rem',
                    fontWeight: '600',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.15)',
                    whiteSpace: 'nowrap',
                    zIndex: 20
                  }}
                >
                  THIS ITEM
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  color: '#6b7280',
                  fontWeight: '600',
                  minWidth: '32px',
                  flexShrink: 0
                }}
              >
                +
              </div>
            </React.Fragment>
          );
        })()}

        {/* Render Recommendation Products */}
        {recommendations.map((product, index) => {
          const variantId = product.variantId || product.id;
          const isSelected = selectedProducts.has(variantId);
          const isDisabled = isAtLimit && !isSelected;
          const discountPercent = product.compareAtPrice && product.price < product.compareAtPrice
            ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
            : 0;

          return (
            <React.Fragment key={variantId}>
              <div
                className={`upsellity-fbt-minimal-card ${isDisabled ? 'disabled' : ''} ${isSelected ? 'selected' : ''}`}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: isSelected ? '2px solid #10b981' : '1px solid #d1d5db',
                  borderRadius: '12px',
                  background: '#f9fafb',
                  transition: 'all 0.2s',
                  opacity: isDisabled ? 0.5 : 1,
                  cursor: 'pointer',
                  position: 'relative',
                  boxShadow: isSelected ? '0 6px 14px rgba(16, 185, 129, 0.15)' : '0 4px 10px rgba(15, 23, 42, 0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.375rem'
                }}
                onClick={() => !isDisabled && handleToggle(variantId, !isSelected)}
              >
                <div style={{ position: 'relative', width: '100%' }}>
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.title}
                      style={{
                        width: '100%',
                        height: '110px',
                        objectFit: 'cover',
                        borderRadius: '8px',
                        background: '#f3f4f6'
                      }}
                    />
                  ) : (
                    <div style={{
                      width: '100%',
                      height: '110px',
                      backgroundColor: '#f3f4f6',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '40px'
                    }}>
                      📦
                    </div>
                  )}
                  {discountPercent > 0 && config.showDiscount && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '8px',
                        left: '8px',
                        background: '#10b981',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                      }}
                    >
                      {discountPercent}% off
                    </div>
                  )}
                </div>

                {/* Product Title */}
                <h4
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#111827',
                    lineHeight: 1.4,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    margin: 0,
                    textAlign: 'center'
                  }}
                >
                  {product.title}
                </h4>

                {/* Individual Price Display */}
                {config.showIndividualPrices && (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.375rem',
                    flexWrap: 'wrap'
                  }}>
                    {product.compareAtPrice && config.showDiscount && (
                      <span
                        style={{
                          textDecoration: 'line-through',
                          color: '#9ca3af',
                          fontSize: '0.6875rem',
                          fontWeight: '400'
                        }}
                      >
                        {formatMoney(product.compareAtPrice)}
                      </span>
                    )}
                    <span
                      style={{
                        fontSize: '0.875rem',
                        fontWeight: '700',
                        color: '#111827'
                      }}
                    >
                      {formatMoney(product.price)}
                    </span>
                  </div>
                )}

                {isSelected && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '4px',
                      right: '4px',
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: '#10b981',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: '600'
                    }}
                  >
                    ✓
                  </div>
                )}
              </div>

              {index < recommendations.length - 1 && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                    color: '#6b7280',
                    fontWeight: '600',
                    minWidth: '32px',
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

      {/* Total Price and Button */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '1rem',
          borderTop: '1px solid #e5e7eb',
          gap: '1rem'
        }}
      >
        <div style={{ flex: 1 }}>
          {selectedCount === 0 ? (
            <span
              style={{
                fontSize: '0.875rem',
                color: '#6b7280',
                fontStyle: 'italic'
              }}
            >
              Please add at least 1 add-on item to proceed
            </span>
          ) : config.showTotalPrice !== false ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <span
                style={{
                  fontSize: '0.75rem',
                  color: '#6b7280',
                  fontWeight: '400'
                }}
              >
                Total price:
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {hasDiscount && (
                  <span
                    style={{
                      textDecoration: 'line-through',
                      color: '#9ca3af',
                      fontSize: '0.875rem',
                      fontWeight: '400'
                    }}
                  >
                    {formatMoney(originalTotal)}
                  </span>
                )}
                <span
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
          ) : null}
        </div>

        <button
          onClick={onAddToCart}
          disabled={selectedCount === 0 || isAdding || isPreview}
          style={{
            padding: '0.75rem 1.5rem',
            border: 'none',
            borderRadius: '6px',
            fontSize: '0.875rem',
            fontWeight: '600',
            cursor: (selectedCount === 0 || isAdding || isPreview) ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            backgroundColor: config.buttonColor || '#000000',
            color: config.buttonTextColor || '#FFFFFF',
            opacity: (selectedCount === 0 || isAdding) ? 0.5 : 1,
            lineHeight: 1.2,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            whiteSpace: 'nowrap'
          }}
          onMouseEnter={(e) => {
            if (selectedCount > 0 && !isAdding && !isPreview) {
              e.currentTarget.style.opacity = '0.9';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }
          }}
          onMouseLeave={(e) => {
            if (selectedCount > 0 && !isAdding && !isPreview) {
              e.currentTarget.style.opacity = '1';
              e.currentTarget.style.transform = 'translateY(0)';
            }
          }}
        >
          <span>🛒</span>
          {isAdding ? 'Adding...' : (config.buttonText || 'ADD TO CART')}
        </button>
      </div>
    </div>
  );
};

