/**
 * Compact Template for FBT Widget
 * Card-style layout with horizontal product cards
 */

import React from 'react';
import { FBTProduct } from './FBTProductCard';

interface FBTTemplateCompactProps {
  recommendations: FBTProduct[];
  selectedProducts: Set<string>;
  config: any;
  handleToggle: (variantId: string, checked: boolean) => void;
  isPreview?: boolean;
  isAtLimit: boolean;
}

export const FBTTemplateCompact: React.FC<FBTTemplateCompactProps> = ({
  recommendations,
  selectedProducts,
  config,
  handleToggle,
  isPreview,
  isAtLimit
}) => {
  return (
    <div 
      className="upsellity-fbt-template-compact"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}
    >
      {recommendations.map((product) => {
        const variantId = product.variantId || product.id;
        const isSelected = selectedProducts.has(variantId);
        const isDisabled = isAtLimit && !isSelected;
        const discountPercent = product.compareAtPrice && product.price < product.compareAtPrice
          ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
          : 0;

        return (
          <div
            key={variantId}
            className={`upsellity-fbt-compact-card ${isDisabled ? 'disabled' : ''} ${isSelected ? 'selected' : ''}`}
            style={{
              display: 'flex',
              gap: '1rem',
              padding: '1rem',
              border: isSelected ? '2px solid #10b981' : '1px solid #e5e7eb',
              borderRadius: '8px',
              background: isSelected ? '#f0fdf4' : '#ffffff',
              alignItems: 'center',
              transition: 'all 0.2s',
              opacity: isDisabled ? 0.5 : 1,
              cursor: 'pointer',
              position: 'relative'
            }}
            onClick={() => !isDisabled && handleToggle(variantId, !isSelected)}
          >
            {config.showCheckboxes && (
              <input
                type="checkbox"
                checked={isSelected}
                disabled={isDisabled}
                onChange={(e) => {
                  e.stopPropagation();
                  handleToggle(variantId, e.target.checked);
                }}
                style={{
                  width: '24px',
                  height: '24px',
                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                  flexShrink: 0
                }}
              />
            )}

            <div style={{ position: 'relative', flexShrink: 0 }}>
              <img
                src={product.imageUrl || 'https://via.placeholder.com/100'}
                alt={product.title}
                style={{
                  width: '100px',
                  height: '100px',
                  objectFit: 'cover',
                  borderRadius: '6px',
                  background: '#f3f4f6'
                }}
              />
              {discountPercent > 0 && config.showDiscount && (
                <div
                  style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    background: '#10b981',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  -{discountPercent}%
                </div>
              )}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <h4
                style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  marginBottom: '0.5rem',
                  color: '#111827',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {product.title}
              </h4>
              
              {config.showIndividualPrices && (
                <div style={{ marginBottom: '0.25rem' }}>
                  {product.compareAtPrice && config.showDiscount && (
                    <span
                      style={{
                        textDecoration: 'line-through',
                        color: '#9ca3af',
                        marginRight: '0.5rem',
                        fontSize: '0.875rem'
                      }}
                    >
                      ${product.compareAtPrice.toFixed(2)}
                    </span>
                  )}
                  <span
                    style={{
                      fontSize: '1.125rem',
                      fontWeight: '700',
                      color: '#111827'
                    }}
                  >
                    ${product.price.toFixed(2)}
                  </span>
                </div>
              )}

              {config.showProductReviews && (
                <div style={{ fontSize: '0.75rem', color: '#f59e0b' }}>
                  ★★★★★ (0)
                </div>
              )}
            </div>

            {isSelected && (
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: '#10b981',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  flexShrink: 0
                }}
              >
                ✓
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

