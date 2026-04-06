/**
 * Shared Cart Items Component
 * Premium redesign — works in any Shopify theme (light)
 */

import React, { useState } from 'react';

interface CartItem {
  key: string;
  title: string;
  handle?: string;
  url?: string;
  variant_title?: string;
  price: number;
  final_price?: number;
  quantity: number;
  line_price?: number;
  original_line_price?: number;
  original_price?: number;
  variant_id: string | number;
  featured_image?: { url: string };
  image?: string;
  properties?: Record<string, any>;
}

interface CartItemsProps {
  items: CartItem[];
  productCompareAtPrices: Record<string | number, number>;
  pendingOperations?: Set<string>;
  onUpdateQuantity?: (key: string, quantity: number) => void;
  onRemoveItem?: (key: string) => void;
  isPreview?: boolean;
}

const CART_ITEM_KEYFRAMES = `
  @keyframes sd-item-enter {
    0% { opacity: 0; transform: translateY(10px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  @keyframes sd-remove-spin {
    0% { transform: rotate(0deg) scale(1); }
    50% { transform: rotate(90deg) scale(0.85); }
    100% { transform: rotate(90deg) scale(0.85); }
  }
  @keyframes sd-qty-bump {
    0% { transform: scale(1); }
    50% { transform: scale(1.2); }
    100% { transform: scale(1); }
  }
  @keyframes sd-pending-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;

const CartItemRow: React.FC<{
  item: CartItem;
  productCompareAtPrices: Record<string | number, number>;
  isPending?: boolean;
  onUpdateQuantity: (key: string, quantity: number) => void | Promise<void>;
  onRemoveItem: (key: string) => void;
  isPreview: boolean;
  formatMoney: (cents: number) => string;
  calculateItemPrices: (item: CartItem, optimisticQty?: number) => any;
}> = ({
  item,
  productCompareAtPrices,
  isPending = false,
  onUpdateQuantity,
  onRemoveItem,
  isPreview,
  formatMoney,
  calculateItemPrices
}) => {
    const [inputValue, setInputValue] = useState(item.quantity.toString());
    const [isEditing, setIsEditing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [imgHovered, setImgHovered] = useState(false);
    const [removeHovered, setRemoveHovered] = useState(false);
    const [qtyBump, setQtyBump] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      if (value === '' || /^\d+$/.test(value)) {
        setInputValue(value);
        setError(null);
      }
    };

    const handleBlur = () => {
      setIsEditing(false);
      const newQuantity = parseInt(inputValue, 10);
      if (!inputValue || isNaN(newQuantity) || newQuantity < 1) {
        setError('Enter a valid quantity');
        setInputValue(item.quantity.toString());
        setTimeout(() => setError(null), 3000);
        return;
      }
      if (newQuantity === item.quantity) return;
      
      onUpdateQuantity(item.key, newQuantity);
      setQtyBump(true);
      setTimeout(() => setQtyBump(false), 300);
    };

    const handleFocus = () => setIsEditing(true);
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') e.currentTarget.blur();
    };

    React.useEffect(() => {
      if (!isEditing) setInputValue(item.quantity.toString());
    }, [item.quantity, isEditing]);

    const handleQtyChange = (newQty: number) => {
      if (isPreview) return; // Never block on isUpdating or isPending for instant UX!
      if (newQty < 1) return;
      
      setInputValue(newQty.toString());
      setQtyBump(true);
      setTimeout(() => setQtyBump(false), 300);
      
      // Fire and forget; let the class queue manage the requests
      onUpdateQuantity(item.key, newQty);
    };

    const currentQuantity = parseInt(inputValue, 10) || item.quantity;
    const prices = calculateItemPrices(item, currentQuantity);
    const imageUrl = item.featured_image?.url || item.image || '';

    const isDisabled = isPreview; // Remove network locks

    return (
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          display: 'flex',
          gap: '12px',
          padding: '14px 0',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
          animation: 'sd-item-enter 0.35s cubic-bezier(0.4,0,0.2,1)',
          opacity: isPending ? 0.7 : 1,
          transition: 'opacity 0.25s ease',
          position: 'relative',
        }}
      >
        {/* Product Image */}
        <div
          style={{
            position: 'relative',
            flexShrink: 0,
            width: '80px',
            height: '80px',
            borderRadius: '12px',
            overflow: 'hidden',
            background: '#f4f4f8',
            border: '1.5px solid rgba(0,0,0,0.07)',
            boxShadow: imgHovered
              ? '0 8px 24px rgba(0,0,0,0.14)'
              : '0 2px 8px rgba(0,0,0,0.07)',
            transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
            cursor: 'pointer',
          }}
          onMouseEnter={() => setImgHovered(true)}
          onMouseLeave={() => setImgHovered(false)}
          onClick={() => {
            if (item.url) window.location.href = item.url;
            else if (item.handle) window.location.href = `/products/${item.handle}`;
          }}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={item.title}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
                transform: imgHovered ? 'scale(1.08)' : 'scale(1)',
                transition: 'transform 0.4s cubic-bezier(0.4,0,0.2,1)',
              }}
            />
          ) : (
            <div style={{
              width: '100%', height: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '28px',
            }}>📦</div>
          )}

          {/* Discount badge */}
          {prices.hasItemDiscount && (
            <div style={{
              position: 'absolute', top: '5px', left: '5px',
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: 'white', fontSize: '8px', fontWeight: '700',
              padding: '2px 6px', borderRadius: '6px',
              letterSpacing: '0.04em',
              boxShadow: '0 2px 6px rgba(245,158,11,0.3)',
            }}>{prices.itemDiscountPercent}% OFF</div>
          )}

          {/* Remove button — hover reveal on image */}
          {!isPreview && (
            <button
              onClick={() => !isPending && onRemoveItem(item.key)}
              onMouseEnter={() => setRemoveHovered(true)}
              onMouseLeave={() => setRemoveHovered(false)}
              disabled={isPending}
              aria-label="Remove item"
              style={{
                position: 'absolute', top: '4px', right: '4px',
                width: '22px', height: '22px',
                borderRadius: '50%',
                background: removeHovered ? '#ef4444' : 'rgba(0,0,0,0.55)',
                border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
                opacity: isHovered ? 1 : 0,
                transform: isHovered ? 'scale(1)' : 'scale(0.7)',
                transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
                zIndex: 5,
              }}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        {/* Item Details */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          {/* Title + Variant */}
          <div>
            <div 
              onClick={() => {
                if (item.url) window.location.href = item.url;
                else if (item.handle) window.location.href = `/products/${item.handle}`;
              }}
              style={{
                fontSize: '13px', fontWeight: '700', color: '#111827',
                lineHeight: '1.3', marginBottom: '3px',
                letterSpacing: '-0.01em',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                cursor: 'pointer',
              }}
            >
              {item.title}
            </div>

            {item.variant_title && (
              <div style={{
                display: 'inline-block',
                fontSize: '10px', fontWeight: '600', color: '#6b7280',
                background: '#f3f4f6', border: '1px solid #e5e7eb',
                padding: '1px 7px', borderRadius: '6px',
                letterSpacing: '0.02em', marginBottom: '6px',
              }}>
                {item.variant_title}
              </div>
            )}
          </div>

          {/* Price row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            {/* Prices */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              {prices.hasItemDiscount && (
                <span style={{ textDecoration: 'line-through', color: '#d1d5db', fontSize: '12px' }}>
                  {formatMoney(prices.originalLinePrice)}
                </span>
              )}
              <span style={{
                fontWeight: '800', fontSize: '15px',
                color: prices.hasItemDiscount ? '#d97706' : '#111827',
                letterSpacing: '-0.02em',
              }}>
                {formatMoney(prices.itemSubtotal)}
              </span>
            </div>

            {/* Quantity Controls */}
            <div style={{
              display: 'flex', alignItems: 'center',
              background: '#f9fafb',
              border: '1.5px solid #e5e7eb',
              borderRadius: '10px',
              overflow: 'hidden',
              boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
            }}>
              <button
                onClick={() => handleQtyChange(currentQuantity - 1)}
                disabled={isDisabled || currentQuantity <= 1}
                style={{
                  width: '30px', height: '30px', border: 'none',
                  background: 'transparent',
                  color: isDisabled || currentQuantity <= 1 ? '#d1d5db' : '#374151',
                  cursor: isDisabled || currentQuantity <= 1 ? 'not-allowed' : 'pointer',
                  fontSize: '17px', fontWeight: '400',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.15s ease, color 0.15s ease',
                }}
                onMouseEnter={(e) => { if (!isDisabled && currentQuantity > 1) e.currentTarget.style.background = '#f0f0f5'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                −
              </button>

              <input
                type="text"
                inputMode="numeric"
                value={inputValue}
                onChange={handleInputChange}
                onBlur={handleBlur}
                onFocus={handleFocus}
                onKeyDown={handleKeyDown}
                disabled={isDisabled}
                style={{
                  width: '30px', textAlign: 'center',
                  fontSize: '13px', fontWeight: '700', color: '#111827',
                  border: 'none', background: 'transparent',
                  outline: 'none', cursor: isDisabled ? 'not-allowed' : 'text',
                  animation: qtyBump ? 'sd-qty-bump 0.25s ease' : undefined,
                }}
              />

              <button
                onClick={() => handleQtyChange(currentQuantity + 1)}
                disabled={isDisabled}
                style={{
                  width: '30px', height: '30px', border: 'none',
                  background: 'transparent',
                  color: isDisabled ? '#d1d5db' : '#374151',
                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                  fontSize: '17px', fontWeight: '400',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.15s ease, color 0.15s ease',
                }}
                onMouseEnter={(e) => { if (!isDisabled) e.currentTarget.style.background = '#f0f0f5'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                +
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              fontSize: '11px', color: '#dc2626', fontWeight: '500',
              marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px',
            }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="#dc2626">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" stroke="white" strokeWidth="2" /><line x1="12" y1="16" x2="12.01" y2="16" stroke="white" strokeWidth="2" />
              </svg>
              {error}
            </div>
          )}
        </div>
      </div>
    );
  };

export const CartItems: React.FC<CartItemsProps> = ({
  items,
  productCompareAtPrices,
  pendingOperations,
  onUpdateQuantity = () => { },
  onRemoveItem = () => { },
  isPreview = false
}) => {
  const formatMoney = (cents: number) => {
    if (typeof cents !== 'number') return '';
    const amount = cents / 100;

    // Get active currency from Shopify config
    // @ts-ignore
    const currencyConfig = typeof window !== 'undefined' ? window.selldrawer_config?.currency : null;
    const isoCode = currencyConfig?.isoCode || currencyConfig?.code || 'USD';
      
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: isoCode,
        minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
        maximumFractionDigits: 2
      }).format(amount);
    } catch (e) {
      const symbol = currencyConfig?.symbol || '$';
      return `${symbol}${amount.toFixed(2)}`;
    }
  };

  const calculateItemPrices = (item: CartItem, currentQty: number = item.quantity) => {
    const itemPrice = item.final_price || item.price || 0;
    const linePrice = itemPrice * currentQty;
    let originalLinePrice = null;

    if (item.original_line_price && item.original_line_price > (itemPrice * item.quantity)) {
      const singleOriginalPrice = item.original_line_price / item.quantity;
      originalLinePrice = singleOriginalPrice * currentQty;
    }
    if (!originalLinePrice) {
      const compareAtPrice = productCompareAtPrices[item.variant_id];
      if (compareAtPrice && compareAtPrice > itemPrice) {
        originalLinePrice = compareAtPrice * currentQty;
      }
    }
    if (!originalLinePrice && item.original_price) {
      const originalItemPrice = item.original_price;
      if (originalItemPrice > itemPrice) {
        originalLinePrice = originalItemPrice * currentQty;
      }
    }
    if (!originalLinePrice || originalLinePrice <= linePrice) {
      originalLinePrice = linePrice;
    }
    const hasItemDiscount = originalLinePrice > linePrice;
    const itemDiscountPercent = hasItemDiscount && originalLinePrice > 0
      ? Math.round(((originalLinePrice - linePrice) / originalLinePrice) * 100)
      : 0;
    const itemSubtotal = linePrice;
    return { originalLinePrice, itemSubtotal, hasItemDiscount, itemDiscountPercent };
  };

  return (
    <>
      <style>{CART_ITEM_KEYFRAMES}</style>
      {items.map((item) => (
        <CartItemRow
          key={item.key}
          item={item}
          productCompareAtPrices={productCompareAtPrices}
          isPending={pendingOperations?.has(item.key)}
          onUpdateQuantity={onUpdateQuantity}
          onRemoveItem={onRemoveItem}
          isPreview={isPreview}
          formatMoney={formatMoney}
          calculateItemPrices={calculateItemPrices}
        />
      ))}
    </>
  );
};
