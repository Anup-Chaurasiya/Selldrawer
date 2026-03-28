/**
 * Shared Cart Items Component
 * Premium redesign — works in any Shopify theme (light)
 */

import React, { useState } from 'react';

interface CartItem {
  key: string;
  title: string;
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
  calculateItemPrices: (item: CartItem) => any;
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

  const handleBlur = async () => {
    setIsEditing(false);
    const newQuantity = parseInt(inputValue, 10);
    if (!inputValue || isNaN(newQuantity) || newQuantity < 1) {
      setError('Enter a valid quantity');
      setInputValue(item.quantity.toString());
      setTimeout(() => setError(null), 3000);
      return;
    }
    if (newQuantity === item.quantity) return;
    setIsUpdating(true);
    try {
      await onUpdateQuantity(item.key, newQuantity);
      setError(null);
      setQtyBump(true);
      setTimeout(() => setQtyBump(false), 300);
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to update quantity';
      setError(errorMessage);
      setInputValue(item.quantity.toString());
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleFocus = () => setIsEditing(true);
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') e.currentTarget.blur();
  };

  React.useEffect(() => {
    if (!isEditing) setInputValue(item.quantity.toString());
  }, [item.quantity, isEditing]);

  const handleQtyChange = async (newQty: number) => {
    if (isPreview || isUpdating || isPending) return;
    if (newQty < 1) return;
    setIsUpdating(true);
    try {
      await onUpdateQuantity(item.key, newQty);
      setQtyBump(true);
      setTimeout(() => setQtyBump(false), 300);
    } finally {
      setIsUpdating(false);
    }
  };

  const prices = calculateItemPrices(item);
  const imageUrl = item.featured_image?.url || item.image || '';

  const isGiftItem = item.properties && (
    item.properties['_selldrawer_gift'] === 'true' ||
    item.properties['_gift'] === 'true' ||
    item.properties['_gift'] === true
  );

  const isDisabled = isPreview || isUpdating || isPending;

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
          cursor: 'default',
        }}
        onMouseEnter={() => setImgHovered(true)}
        onMouseLeave={() => setImgHovered(false)}
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

        {/* Gift badge */}
        {isGiftItem && (
          <div style={{
            position: 'absolute', top: '5px', left: '5px',
            background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
            color: 'white', fontSize: '8px', fontWeight: '700',
            padding: '2px 6px', borderRadius: '6px',
            letterSpacing: '0.04em', textTransform: 'uppercase',
            boxShadow: '0 2px 6px rgba(124,58,237,0.3)',
          }}>🎁 FREE</div>
        )}

        {/* Discount badge */}
        {!isGiftItem && prices.hasItemDiscount && (
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
        {!isGiftItem && !isPreview && (
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
          <div style={{
            fontSize: '13px', fontWeight: '700', color: '#111827',
            lineHeight: '1.3', marginBottom: '3px',
            letterSpacing: '-0.01em',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
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
            {isGiftItem ? (
              <>
                <span style={{ textDecoration: 'line-through', color: '#d1d5db', fontSize: '12px' }}>
                  {formatMoney(prices.itemSubtotal)}
                </span>
                <span style={{ fontWeight: '800', fontSize: '14px', color: '#059669', letterSpacing: '-0.02em' }}>
                  FREE
                </span>
              </>
            ) : (
              <>
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
              </>
            )}
          </div>

          {/* Quantity Controls */}
          {isGiftItem ? (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '5px 10px', borderRadius: '8px',
              background: '#f9fafb', border: '1px solid #e5e7eb',
            }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>Qty: 1</span>
            </div>
          ) : (
            <div style={{
              display: 'flex', alignItems: 'center',
              background: '#f9fafb',
              border: '1.5px solid #e5e7eb',
              borderRadius: '10px',
              overflow: 'hidden',
              boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
            }}>
              <button
                onClick={() => handleQtyChange(item.quantity - 1)}
                disabled={isDisabled || item.quantity <= 1}
                style={{
                  width: '30px', height: '30px', border: 'none',
                  background: 'transparent',
                  color: isDisabled || item.quantity <= 1 ? '#d1d5db' : '#374151',
                  cursor: isDisabled || item.quantity <= 1 ? 'not-allowed' : 'pointer',
                  fontSize: '17px', fontWeight: '400',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.15s ease, color 0.15s ease',
                }}
                onMouseEnter={(e) => { if (!isDisabled && item.quantity > 1) e.currentTarget.style.background = '#f0f0f5'; }}
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
                onClick={() => handleQtyChange(item.quantity + 1)}
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
          )}
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
    const rupees = cents / 100;
    return `₹${Math.round(rupees)}`;
  };

  const calculateItemPrices = (item: CartItem) => {
    const linePrice = item.line_price || ((item.final_price || item.price || 0) * item.quantity);
    const itemPrice = item.final_price || item.price || 0;
    let originalLinePrice = null;

    if (item.original_line_price && item.original_line_price > linePrice) {
      originalLinePrice = item.original_line_price;
    }
    if (!originalLinePrice) {
      const compareAtPrice = productCompareAtPrices[item.variant_id];
      if (compareAtPrice && compareAtPrice > itemPrice) {
        originalLinePrice = compareAtPrice * item.quantity;
      }
    }
    if (!originalLinePrice && item.original_price) {
      const originalItemPrice = item.original_price;
      if (originalItemPrice > itemPrice) {
        originalLinePrice = originalItemPrice * item.quantity;
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
