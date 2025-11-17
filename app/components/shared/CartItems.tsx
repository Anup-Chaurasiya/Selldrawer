/**
 * Shared Cart Items Component
 * Used in both production cart drawer and Remix preview
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
}

interface Discount {
  type: 'percentage' | 'fixed';
  value: number;
}

interface CartItemsProps {
  items: CartItem[];
  productCompareAtPrices: Record<string | number, number>;
  appliedDiscount?: Discount | null;
  onUpdateQuantity?: (key: string, quantity: number) => void;
  onRemoveItem?: (key: string) => void;
  isPreview?: boolean;
}

// Individual Cart Item Component with editable quantity
const CartItemRow: React.FC<{
  item: CartItem;
  productCompareAtPrices: Record<string | number, number>;
  appliedDiscount: Discount | null;
  cartTotalPrice: number;
  onUpdateQuantity: (key: string, quantity: number) => void | Promise<void>;
  onRemoveItem: (key: string) => void;
  isPreview: boolean;
  formatMoney: (cents: number) => string;
  calculateItemPrices: (item: CartItem, cartTotalPrice: number) => any;
}> = ({
  item,
  productCompareAtPrices,
  appliedDiscount,
  cartTotalPrice,
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only numbers
    if (value === '' || /^\d+$/.test(value)) {
      setInputValue(value);
      setError(null);
    }
  };

  const handleBlur = async () => {
    setIsEditing(false);
    const newQuantity = parseInt(inputValue, 10);

    // Validate input
    if (!inputValue || isNaN(newQuantity) || newQuantity < 1) {
      setError('Please enter a valid quantity');
      setInputValue(item.quantity.toString());
      setTimeout(() => setError(null), 3000);
      return;
    }

    // If quantity hasn't changed, do nothing
    if (newQuantity === item.quantity) {
      return;
    }

    // Try to update quantity
    setIsUpdating(true);
    try {
      await onUpdateQuantity(item.key, newQuantity);
      setError(null);
    } catch (err: any) {
      // Handle error - revert to original quantity
      const errorMessage = err?.message || 'Failed to update quantity';
      setError(errorMessage);
      setInputValue(item.quantity.toString());
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleFocus = () => {
    setIsEditing(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  // Update input value when item.quantity changes externally
  React.useEffect(() => {
    if (!isEditing) {
      setInputValue(item.quantity.toString());
    }
  }, [item.quantity, isEditing]);

  const prices = calculateItemPrices(item, cartTotalPrice);
  const imageUrl = item.featured_image?.url || item.image || '';

  return (
    <div
      style={{
        display: 'flex',
        gap: '12px',
        padding: '12px 0',
        borderBottom: '1px solid #e5e7eb'
      }}
    >
      {/* Item Image */}
      <img
        src={imageUrl}
        alt={item.title}
        style={{
          width: '70px',
          height: '70px',
          objectFit: 'cover',
          borderRadius: '6px',
          border: '1px solid #e5e7eb',
          flexShrink: 0
        }}
      />

      {/* Item Details */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Title */}
        <div style={{
          fontSize: '14px',
          fontWeight: '600',
          color: '#111827',
          marginBottom: '2px',
          lineHeight: '1.3'
        }}>
          {item.title}
        </div>

        {/* Variant */}
        {item.variant_title && (
          <div style={{
            fontSize: '12px',
            color: '#6b7280',
            marginBottom: '6px'
          }}>
            {item.variant_title}
          </div>
        )}

        {/* Price */}
        <div style={{ marginBottom: '8px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap'
          }}>
            {prices.hasItemDiscount && !prices.hasCouponDiscount && (
              <>
                <span style={{
                  textDecoration: 'line-through',
                  color: '#9ca3af',
                  fontSize: '13px'
                }}>
                  {formatMoney(prices.originalLinePrice)}
                </span>
                <span style={{
                  fontWeight: '700',
                  fontSize: '16px',
                  color: '#f59e0b'
                }}>
                  {formatMoney(prices.itemSubtotal)}
                </span>
                <span style={{
                  background: '#fef3c7',
                  color: '#92400e',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '10px',
                  fontWeight: '600'
                }}>
                  {prices.itemDiscountPercent}% OFF
                </span>
              </>
            )}

            {prices.hasCouponDiscount && (
              <>
                <span style={{
                  textDecoration: 'line-through',
                  color: '#9ca3af',
                  fontSize: '13px'
                }}>
                  {formatMoney(prices.itemSubtotal)}
                </span>
                <span style={{
                  fontWeight: '700',
                  fontSize: '16px',
                  color: '#059669'
                }}>
                  {formatMoney(prices.itemPriceWithCoupon)}
                </span>
              </>
            )}

            {!prices.hasItemDiscount && !prices.hasCouponDiscount && (
              <span style={{
                fontWeight: '700',
                fontSize: '16px',
                color: '#111827'
              }}>
                {formatMoney(prices.itemSubtotal)}
              </span>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              fontSize: '11px',
              color: '#dc2626',
              marginTop: '2px',
              fontWeight: '500'
            }}>
              {error}
            </div>
          )}
        </div>

        {/* Controls */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
        }}>
          {/* Quantity Controls */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            padding: '4px'
          }}>
            <button
              onClick={() => !isPreview && !isUpdating && onUpdateQuantity(item.key, item.quantity - 1)}
              disabled={isPreview || item.quantity <= 1 || isUpdating}
              style={{
                width: '24px',
                height: '24px',
                border: 'none',
                backgroundColor: isPreview || item.quantity <= 1 || isUpdating ? '#f3f4f6' : '#ffffff',
                color: isPreview || item.quantity <= 1 || isUpdating ? '#9ca3af' : '#374151',
                borderRadius: '4px',
                cursor: isPreview || item.quantity <= 1 || isUpdating ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.2s'
              }}
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
              disabled={isPreview || isUpdating}
              style={{
                minWidth: '32px',
                maxWidth: '48px',
                textAlign: 'center',
                fontSize: '14px',
                fontWeight: '600',
                color: '#111827',
                border: 'none',
                outline: 'none',
                backgroundColor: 'transparent',
                cursor: isPreview || isUpdating ? 'not-allowed' : 'text',
                padding: '2px 4px',
                borderRadius: '2px',
                transition: 'background-color 0.2s'
              }}
            />
            <button
              onClick={() => !isPreview && !isUpdating && onUpdateQuantity(item.key, item.quantity + 1)}
              disabled={isPreview || isUpdating}
              style={{
                width: '24px',
                height: '24px',
                border: 'none',
                backgroundColor: isPreview || isUpdating ? '#f3f4f6' : '#ffffff',
                color: isPreview || isUpdating ? '#9ca3af' : '#374151',
                borderRadius: '4px',
                cursor: isPreview || isUpdating ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.2s'
              }}
            >
              +
            </button>
          </div>

          {/* Remove Button */}
          <button
            onClick={() => !isPreview && onRemoveItem(item.key)}
            disabled={isPreview}
            title="Remove item"
            style={{
              width: '32px',
              height: '32px',
              border: 'none',
              backgroundColor: 'transparent',
              color: '#4a4a4a',
              cursor: 'pointer',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.2s'
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3,6 5,6 21,6"></polyline>
              <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export const CartItems: React.FC<CartItemsProps> = ({
  items,
  productCompareAtPrices,
  appliedDiscount = null,
  onUpdateQuantity = () => {},
  onRemoveItem = () => {},
  isPreview = false
}) => {
  // Format money (cents to currency)
  const formatMoney = (cents: number) => {
    const rupees = cents / 100;
    return `₹${Math.round(rupees)}`;
  };

  const calculateItemPrices = (item: CartItem, cartTotalPrice: number) => {
    const linePrice = item.line_price || (item.price * item.quantity);
    const itemPrice = item.price || item.final_price || 0;
    
    let originalLinePrice = null;
    
    // Check for original line price
    if (item.original_line_price && item.original_line_price > linePrice) {
      originalLinePrice = item.original_line_price;
    }
    
    // Check compare at price
    if (!originalLinePrice) {
      const compareAtPrice = productCompareAtPrices[item.variant_id];
      if (compareAtPrice && compareAtPrice > itemPrice) {
        originalLinePrice = compareAtPrice * item.quantity;
      }
    }
    
    // Check original price
    if (!originalLinePrice && item.original_price) {
      const originalItemPrice = item.original_price;
      if (originalItemPrice > itemPrice) {
        originalLinePrice = originalItemPrice * item.quantity;
      }
    }
    
    // Default to line price
    if (!originalLinePrice || originalLinePrice <= linePrice) {
      originalLinePrice = linePrice;
    }
    
    const originalItemPrice = originalLinePrice / item.quantity;
    const hasItemDiscount = originalItemPrice > itemPrice && originalLinePrice > linePrice;
    const itemDiscountAmount = hasItemDiscount ? (originalLinePrice - linePrice) : 0;
    const itemDiscountPercent = hasItemDiscount && originalLinePrice > 0 
      ? Math.round(((originalLinePrice - linePrice) / originalLinePrice) * 100) 
      : 0;
    
    const itemSubtotal = linePrice;
    let itemPriceWithCoupon = itemSubtotal;
    
    // Calculate coupon discount
    if (appliedDiscount && appliedDiscount.type === 'percentage') {
      itemPriceWithCoupon = Math.round(itemSubtotal * (1 - appliedDiscount.value / 100));
    } else if (appliedDiscount && appliedDiscount.type === 'fixed') {
      const itemProportion = itemSubtotal / cartTotalPrice;
      const itemCouponDiscount = Math.round((appliedDiscount.value * 100) * itemProportion);
      itemPriceWithCoupon = Math.max(0, itemSubtotal - itemCouponDiscount);
    }
    
    const hasCouponDiscount = appliedDiscount && (appliedDiscount.type === 'percentage' || appliedDiscount.type === 'fixed');
    
    return {
      originalLinePrice,
      itemSubtotal,
      itemPriceWithCoupon,
      hasItemDiscount,
      hasCouponDiscount,
      itemDiscountPercent
    };
  };

  const cartTotalPrice = items.reduce((sum, item) => sum + (item.line_price || (item.price * item.quantity)), 0);

  return (
    <>
      {items.map((item) => (
        <CartItemRow
          key={item.key}
          item={item}
          productCompareAtPrices={productCompareAtPrices}
          appliedDiscount={appliedDiscount}
          cartTotalPrice={cartTotalPrice}
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

