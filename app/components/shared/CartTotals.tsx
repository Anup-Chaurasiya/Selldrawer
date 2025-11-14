/**
 * Shared Cart Totals Component
 * Used in both production cart drawer and Remix preview
 */

import React from 'react';

interface CartItem {
  original_price: number;
  final_price: number;
  quantity: number;
}

interface Discount {
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
}

interface CartTotalsProps {
  items: CartItem[];
  totalPrice: number; // in cents
  appliedDiscount?: Discount | null;
  isPreview?: boolean;
}

export const CartTotals: React.FC<CartTotalsProps> = ({
  items,
  totalPrice,
  appliedDiscount = null,
  isPreview = false
}) => {
  // Format money (cents to currency)
  const formatMoney = (cents: number) => {
    const rupees = cents / 100;
    return `₹${Math.round(rupees)}`;
  };

  // Calculate estimated discount
  const calculateEstimatedDiscount = (discount: Discount | null, total: number): number => {
    if (!discount) return 0;
    
    if (discount.type === 'percentage') {
      return Math.round((total * discount.value) / 100);
    } else {
      return discount.value * 100; // Convert to cents
    }
  };

  // Calculate totals
  const originalTotal = items.reduce((sum, item) => {
    return sum + (item.original_price * item.quantity);
  }, 0);
  
  const subtotal = totalPrice;
  const itemLevelSavings = originalTotal - subtotal;
  const couponDiscount = calculateEstimatedDiscount(appliedDiscount, totalPrice);
  const estimatedTotal = Math.max(0, subtotal - couponDiscount);
  const totalSavings = itemLevelSavings + couponDiscount;

  return (
    <div style={{
      borderTop: '2px solid #e5e7eb',
      paddingTop: isPreview ? '14px' : '16px',
      marginTop: isPreview ? '16px' : '20px'
    }}>
      {/* Original Price (if there are savings) */}
      {(itemLevelSavings > 0 || couponDiscount > 0) && (
        <div style={{
          fontSize: isPreview ? '14px' : '15px',
          marginBottom: '10px',
          display: 'flex',
          justifyContent: 'space-between',
          color: '#6b7280'
        }}>
          <span>Original Price</span>
          <span style={{ textDecoration: 'line-through' }}>
            {formatMoney(originalTotal)}
          </span>
        </div>
      )}

      {/* Item Discounts */}
      {itemLevelSavings > 0 && (
        <div style={{
          fontSize: isPreview ? '13px' : '14px',
          marginBottom: '10px',
          display: 'flex',
          justifyContent: 'space-between',
          color: '#f59e0b'
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>Item Discounts</span>
            <span style={{
              background: '#fef3c7',
              color: '#92400e',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: '600'
            }}>
              SALE
            </span>
          </span>
          <span style={{ fontWeight: '600' }}>-{formatMoney(itemLevelSavings)}</span>
        </div>
      )}

      {/* Subtotal */}
      <div style={{
        fontSize: isPreview ? '15px' : '16px',
        marginBottom: '12px',
        display: 'flex',
        justifyContent: 'space-between',
        fontWeight: itemLevelSavings > 0 ? '600' : 'normal'
      }}>
        <span style={{ color: '#374151' }}>Subtotal</span>
        <span style={{ color: '#111827' }}>{formatMoney(subtotal)}</span>
      </div>

      {/* Coupon Discount */}
      {appliedDiscount && couponDiscount > 0 && (
        <div style={{
          fontSize: isPreview ? '14px' : '15px',
          marginBottom: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          color: '#059669'
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>Coupon ({appliedDiscount.code})</span>
            <span style={{
              background: '#d1fae5',
              color: '#065f46',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: '600'
            }}>
              {appliedDiscount.type === 'percentage' ? `${appliedDiscount.value}%` : 'FIXED'}
            </span>
          </span>
          <span style={{ fontWeight: '600' }}>-{formatMoney(couponDiscount)}</span>
        </div>
      )}

      {/* Total */}
      <div style={{
        fontSize: isPreview ? '18px' : '20px',
        fontWeight: '700',
        paddingTop: '12px',
        borderTop: '2px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'space-between',
        color: '#111827'
      }}>
        <span>Total</span>
        <span style={{ color: totalSavings > 0 ? '#059669' : '#111827' }}>
          {formatMoney(estimatedTotal)}
        </span>
      </div>

      {/* Tax and Shipping Notice */}
      <div style={{
        fontSize: isPreview ? '11px' : '12px',
        color: '#6b7280',
        marginTop: '8px',
        textAlign: 'right'
      }}>
        Taxes and shipping calculated at checkout
      </div>
    </div>
  );
};

