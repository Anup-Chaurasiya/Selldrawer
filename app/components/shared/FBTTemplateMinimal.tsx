/**
 * Minimal Template for FBT Widget
 * Compact single-row layout with small product cards
 */

import React from 'react';
import { FBTProduct } from './FBTProductCard';

interface FBTTemplateMinimalProps {
  recommendations: FBTProduct[];
  selectedProducts: Set<string>;
  config: any;
  handleToggle: (variantId: string, checked: boolean) => void;
  isPreview?: boolean;
  isAtLimit: boolean;
}

export const FBTTemplateMinimal: React.FC<FBTTemplateMinimalProps> = ({
  recommendations,
  selectedProducts,
  config,
  handleToggle,
  isPreview,
  isAtLimit
}) => {
  return (
    <div 
      className="upsellity-fbt-template-minimal"
      style={{
        display: 'flex',
        gap: '0.75rem',
        flexWrap: 'wrap',
        alignItems: 'center',
        padding: '1rem',
        background: '#f9fafb',
        borderRadius: '8px',
        border: '1px solid #e5e7eb'
      }}
    >
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
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem',
                border: isSelected ? '2px solid #10b981' : '1px solid #e5e7eb',
                borderRadius: '6px',
                background: isSelected ? '#f0fdf4' : '#ffffff',
                minWidth: '120px',
                maxWidth: '150px',
                flex: '1',
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
                    position: 'absolute',
                    top: '4px',
                    left: '4px',
                    width: '18px',
                    height: '18px',
                    cursor: isDisabled ? 'not-allowed' : 'pointer'
                  }}
                />
              )}

              <div style={{ position: 'relative', width: '100%' }}>
                <img
                  src={product.imageUrl || 'https://via.placeholder.com/80'}
                  alt={product.title}
                  style={{
                    width: '100%',
                    height: '80px',
                    objectFit: 'cover',
                    borderRadius: '4px',
                    background: '#f3f4f6'
                  }}
                />
                {discountPercent > 0 && config.showDiscount && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '2px',
                      right: '2px',
                      background: '#10b981',
                      color: 'white',
                      padding: '2px 6px',
                      borderRadius: '3px',
                      fontSize: '0.625rem',
                      fontWeight: '600',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    -{discountPercent}%
                  </div>
                )}
              </div>

              <div style={{ width: '100%', textAlign: 'center' }}>
                <h5
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    marginBottom: '0.25rem',
                    color: '#111827',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {product.title}
                </h5>
                
                {config.showIndividualPrices && (
                  <div style={{ fontSize: '0.875rem', fontWeight: '700', color: '#111827' }}>
                    ${product.price.toFixed(2)}
                  </div>
                )}
              </div>

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
                  fontSize: '1.25rem',
                  color: '#6b7280',
                  fontWeight: '600'
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
};

