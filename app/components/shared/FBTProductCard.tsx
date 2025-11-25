/**
 * Shared FBT Product Card Component
 * Used in both production FBT widget and Remix preview
 */

import React from 'react';

export interface FBTProduct {
  id: string;
  variantId?: string;
  title: string;
  handle: string;
  price: number;
  compareAtPrice?: number | null;
  imageUrl?: string | null;
  source?: string;
}

interface FBTProductCardProps {
  product: FBTProduct;
  isSelected: boolean;
  isDisabled: boolean;
  showCheckbox: boolean;
  showDiscount: boolean;
  showIndividualPrices: boolean;
  showReviews: boolean;
  onToggle?: (variantId: string, checked: boolean) => void;
  isPreview?: boolean;
}

export const FBTProductCard: React.FC<FBTProductCardProps> = ({
  product,
  isSelected,
  isDisabled,
  showCheckbox,
  showDiscount,
  showIndividualPrices,
  showReviews,
  onToggle,
  isPreview = false
}) => {
  const variantId = product.variantId || product.id;
  const discountPercent = product.compareAtPrice && product.price < product.compareAtPrice
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0;

  // Format money like cart drawer (₹ symbol, proper decimal parsing)
  const formatMoney = (price: number): string => {
    // If price is in cents (very large number), convert to currency unit
    const amount = price > 10000 ? price / 100 : price;
    // Round to whole number like cart drawer
    return `₹${Math.round(amount)}`;
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onToggle && !isDisabled) {
      onToggle(variantId, e.target.checked);
    }
  };

  return (
    <div 
      className={`upsellity-fbt-product ${isDisabled ? 'upsellity-fbt-product-disabled' : ''}`}
      data-variant-id={variantId}
      style={{
        flex: 1,
        minWidth: '100px',
        border: '1px solid #e5e7eb',
        borderRadius: '4px',
        padding: '0.5rem',
        background: '#ffffff',
        position: 'relative',
        transition: 'transform 0.2s, box-shadow 0.2s',
      }}
    >
      {showCheckbox && (
        <input 
          type="checkbox" 
          className="upsellity-fbt-checkbox" 
          data-variant-id={variantId}
          checked={isSelected}
          disabled={isDisabled}
          onChange={handleCheckboxChange}
          style={{
            position: 'absolute',
            top: '0.25rem',
            left: '0.25rem',
            width: '16px',
            height: '16px',
            cursor: isDisabled ? 'not-allowed' : 'pointer',
            zIndex: 10
          }}
        />
      )}
      
      <div className="upsellity-fbt-product-image-wrapper" style={{ position: 'relative', marginBottom: '0.375rem' }}>
        <img 
          src={product.imageUrl || 'https://via.placeholder.com/150'} 
          alt={product.title}
          className="upsellity-fbt-product-image"
          style={{
            width: '100%',
            height: '80px',
            objectFit: 'cover',
            borderRadius: '4px',
            background: '#f3f4f6'
          }}
        />
        {discountPercent > 0 && showDiscount && (
          <div 
            className="upsellity-fbt-discount-badge"
            style={{
              position: 'absolute',
              top: '0.25rem',
              right: '0.25rem',
              background: '#10b981',
              color: 'white',
              padding: '0.125rem 0.375rem',
              borderRadius: '3px',
              fontSize: '0.6875rem',
              fontWeight: '500',
              zIndex: 5,
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
            }}
          >
            Save {discountPercent}%
          </div>
        )}
      </div>
      
      <h3 
        className="upsellity-fbt-product-title"
        style={{
          fontSize: '0.75rem',
          fontWeight: '500',
          marginBottom: '0.25rem',
          color: '#111827',
          lineHeight: 1.2,
          minHeight: '1.75rem',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}
      >
        {product.title}
      </h3>
      
      {showIndividualPrices && (
        <div 
          className="upsellity-fbt-product-price"
          style={{
            fontSize: '0.8125rem',
            fontWeight: '600',
            color: '#111827',
            marginTop: 'auto'
          }}
        >
          {product.compareAtPrice && showDiscount && (
            <span 
              className="upsellity-fbt-product-compare-price"
              style={{
                textDecoration: 'line-through',
                color: '#9ca3af',
                marginRight: '0.5rem',
                fontSize: '0.75rem',
                fontWeight: '400'
              }}
            >
              {formatMoney(product.compareAtPrice)}
            </span>
          )}
          {formatMoney(product.price)}
        </div>
      )}
      
      {showReviews && (
        <div 
          className="upsellity-fbt-reviews"
          style={{
            fontSize: '0.75rem',
            color: '#f59e0b',
            marginTop: '0.25rem'
          }}
        >
          ★★★★★ (0)
        </div>
      )}
    </div>
  );
};

