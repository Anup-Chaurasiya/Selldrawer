/**
 * Shared Cart Items Component
 * Used in both production cart drawer and Remix preview
 */

import React from 'react';

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
      {items.map((item) => {
        const prices = calculateItemPrices(item, cartTotalPrice);
        const imageUrl = item.featured_image?.url || item.image || '';

        return (
          <div
            key={item.key}
            style={{
              display: 'flex',
              gap: isPreview ? '10px' : '12px',
              padding: isPreview ? '10px 0' : '12px 0',
              borderBottom: '1px solid #e5e7eb'
            }}
          >
            {/* Item Image */}
            <img
              src={imageUrl}
              alt={item.title}
              style={{
                width: isPreview ? '60px' : '70px',
                height: isPreview ? '60px' : '70px',
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
                fontSize: isPreview ? '13px' : '14px',
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
                  fontSize: isPreview ? '11px' : '12px',
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
                        fontSize: isPreview ? '12px' : '13px'
                      }}>
                        {formatMoney(prices.originalLinePrice)}
                      </span>
                      <span style={{
                        fontWeight: '700',
                        fontSize: isPreview ? '14px' : '16px',
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
                        fontSize: isPreview ? '12px' : '13px'
                      }}>
                        {formatMoney(prices.itemSubtotal)}
                      </span>
                      <span style={{
                        fontWeight: '700',
                        fontSize: isPreview ? '14px' : '16px',
                        color: '#059669'
                      }}>
                        {formatMoney(prices.itemPriceWithCoupon)}
                      </span>
                    </>
                  )}

                  {!prices.hasItemDiscount && !prices.hasCouponDiscount && (
                    <span style={{
                      fontWeight: '700',
                      fontSize: isPreview ? '14px' : '16px',
                      color: '#111827'
                    }}>
                      {formatMoney(prices.itemSubtotal)}
                    </span>
                  )}
                </div>

                {prices.hasCouponDiscount && (
                  <div style={{
                    fontSize: '11px',
                    color: '#059669',
                    marginTop: '2px'
                  }}>
                    Coupon discount applied
                  </div>
                )}
              </div>

              {/* Controls */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
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
                    onClick={() => !isPreview && onUpdateQuantity(item.key, item.quantity - 1)}
                    disabled={isPreview || item.quantity <= 1}
                    style={{
                      width: '24px',
                      height: '24px',
                      border: 'none',
                      backgroundColor: isPreview || item.quantity <= 1 ? '#f3f4f6' : '#ffffff',
                      color: isPreview || item.quantity <= 1 ? '#9ca3af' : '#374151',
                      borderRadius: '4px',
                      cursor: isPreview || item.quantity <= 1 ? 'not-allowed' : 'pointer',
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
                  <span style={{
                    minWidth: '24px',
                    textAlign: 'center',
                    fontSize: isPreview ? '13px' : '14px',
                    fontWeight: '600',
                    color: '#111827'
                  }}>
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => !isPreview && onUpdateQuantity(item.key, item.quantity + 1)}
                    disabled={isPreview}
                    style={{
                      width: '24px',
                      height: '24px',
                      border: 'none',
                      backgroundColor: isPreview ? '#f3f4f6' : '#ffffff',
                      color: isPreview ? '#9ca3af' : '#374151',
                      borderRadius: '4px',
                      cursor: isPreview ? 'not-allowed' : 'pointer',
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
                    color: isPreview ? '#9ca3af' : '#dc2626',
                    cursor: isPreview ? 'not-allowed' : 'pointer',
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
      })}
    </>
  );
};

