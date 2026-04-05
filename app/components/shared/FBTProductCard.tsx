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
  onProductClick?: (productId: string, variantId?: string) => void;
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
  onProductClick,
  isPreview = false
}) => {
  const variantId = product.variantId || product.id;
  const discountPercent = product.compareAtPrice && product.price < product.compareAtPrice
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0;

  // Format money like cart drawer
  const formatMoney = (price: number): string => {
    // @ts-ignore
    const isoCode = (typeof window !== 'undefined' && window.selldrawer_config?.currency?.isoCode) 
      // @ts-ignore
      ? window.selldrawer_config.currency.isoCode 
      : (typeof window !== 'undefined' && (window as any).selldrawer_config?.currency?.code) || 'USD';
      
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: isoCode,
        minimumFractionDigits: price % 1 === 0 ? 0 : 2
      }).format(price);
    } catch (e) {
      // Fallback if Intl.NumberFormat fails
      const symbol = (typeof window !== 'undefined' && (window as any).selldrawer_config?.currency?.symbol) || '';
      return `${symbol}${price.toLocaleString()}`;
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onToggle && !isDisabled) {
      onToggle(variantId, e.target.checked);
    }
  };

  const handleProductClick = (e: React.MouseEvent) => {
    if (isPreview) {
      e.preventDefault();
      return;
    }

    if (onProductClick) {
      onProductClick(product.id, variantId);
    }
    // Allow default navigation
  };

  return (
    <div
      className={`selldrawer-fbt-product ${isDisabled ? 'selldrawer-fbt-product-disabled' : ''}`}
      data-variant-id={variantId}
      style={{
        width: '100%',
        border: '1px solid #e5e7eb',
        borderRadius: '6px',
        padding: '0.625em',
        background: '#ffffff',
        position: 'relative',
        transition: 'transform 0.2s, box-shadow 0.2s',
      }}
    >
      {showCheckbox && (
        <input
          type="checkbox"
          className="selldrawer-fbt-checkbox"
          data-variant-id={variantId}
          checked={isSelected}
          disabled={isDisabled}
          onChange={handleCheckboxChange}
          style={{
            position: 'absolute',
            top: '0.25em',
            left: '0.25em',
            width: '16px',
            height: '16px',
            cursor: isDisabled ? 'not-allowed' : 'pointer',
            zIndex: 10
          }}
        />
      )}

      <div className="selldrawer-fbt-product-image-wrapper" style={{ position: 'relative', marginBottom: '0.5em' }}>
        <a
          href={`/products/${product.handle}`}
          onClick={handleProductClick}
          style={{ display: 'block', cursor: 'pointer', textDecoration: 'none' }}
        >
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.title}
              className="selldrawer-fbt-product-image"
              style={{
                width: '100%',
                height: '80px',
                objectFit: 'cover',
                borderRadius: '4px',
                background: '#f3f4f6'
              }}
            />
          ) : (
            <div style={{
              width: '100%',
              height: '80px',
              backgroundColor: '#f3f4f6',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px'
            }}>
              📦
            </div>
          )}
        </a>
        {discountPercent > 0 && showDiscount && (
          <div
            className="selldrawer-fbt-discount-badge"
            style={{
              position: 'absolute',
              top: '0.25em',
              right: '0.25em',
              background: '#10b981',
              color: 'white',
              padding: '0.125em 0.375em',
              borderRadius: '3px',
              fontSize: '0.6875em',
              fontWeight: '500',
              zIndex: 5,
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
            }}
          >
            Save {discountPercent}%
          </div>
        )}
      </div>

      <a
        href={`/products/${product.handle}`}
        onClick={handleProductClick}
        style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
      >
        <h3
          className="selldrawer-fbt-product-title"
          style={{
            fontSize: '0.75em',
            fontWeight: '500',
            marginBottom: '0.25em',
            color: '#111827',
            lineHeight: 1.2,
            minHeight: '1.75em',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            cursor: 'pointer'
          }}
        >
          {product.title}
        </h3>
      </a>

      {showIndividualPrices && (
        <div
          className="selldrawer-fbt-product-price"
          style={{
            fontSize: '0.8125em',
            fontWeight: '600',
            color: '#111827',
            marginTop: 'auto'
          }}
        >
          {product.compareAtPrice && showDiscount && (
            <span
              className="selldrawer-fbt-product-compare-price"
              style={{
                textDecoration: 'line-through',
                color: '#9ca3af',
                marginRight: '0.5em',
                fontSize: '0.75em',
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
          className="selldrawer-fbt-reviews"
          style={{
            fontSize: '0.75em',
            color: '#f59e0b',
            marginTop: '0.25em'
          }}
        >
          ★★★★★ (0)
        </div>
      )}
    </div>
  );
};

