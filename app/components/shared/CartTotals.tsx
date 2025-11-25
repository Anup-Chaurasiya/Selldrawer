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

interface CartTotalsConfig {
  showOriginalPrice?: boolean;
  showItemDiscounts?: boolean;
  showSubtotal?: boolean;
  showCouponDiscount?: boolean;
  showTaxNotice?: boolean;
  subtotalLabel?: string;
  totalLabel?: string;
  taxNoticeText?: string;
  originalPriceLabel?: string;
  itemDiscountsLabel?: string;
  borderColor?: string;
  backgroundColor?: string;
  textColor?: string;
  totalTextColor?: string;
  discountColor?: string;
}

interface CartTotalsProps {
  items: CartItem[];
  totalPrice: number; // in cents
  appliedDiscount?: Discount | null;
  config?: CartTotalsConfig;
  isPreview?: boolean;
}

export const CartTotals: React.FC<CartTotalsProps> = ({
  items,
  totalPrice,
  appliedDiscount = null,
  config = {},
  isPreview = false
}) => {
  // Default configuration
  const {
    showOriginalPrice = true,
    showItemDiscounts = true,
    showSubtotal = true,
    showCouponDiscount = true,
    showTaxNotice = true,
    subtotalLabel = "Subtotal",
    totalLabel = "Total",
    taxNoticeText = "Taxes and shipping calculated at checkout",
    originalPriceLabel = "Original Price",
    itemDiscountsLabel = "Item Discounts",
    borderColor = "#e5e7eb",
    backgroundColor = "#ffffff",
    textColor = "#374151",
    totalTextColor = "#111827",
    discountColor = "#f59e0b",
  } = config;
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
      borderTop: `2px solid ${borderColor}`,
      paddingTop: '16px',
      backgroundColor: backgroundColor,
    }}>
      {/* Original Price (if there are savings) */}
      {showOriginalPrice && (itemLevelSavings > 0 || couponDiscount > 0) && (
        <div style={{
          fontSize: '15px',
          marginBottom: '10px',
          display: 'flex',
          justifyContent: 'space-between',
          color: textColor
        }}>
          <span>{originalPriceLabel}</span>
          <span style={{ textDecoration: 'line-through' }}>
            {formatMoney(originalTotal)}
          </span>
        </div>
      )}

      {/* Item Discounts */}
      {showItemDiscounts && itemLevelSavings > 0 && (
        <div style={{
          fontSize: '14px',
          marginBottom: '10px',
          display: 'flex',
          justifyContent: 'space-between',
          color: discountColor
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>{itemDiscountsLabel}</span>
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
      {showSubtotal && (
        <div style={{
          fontSize: '16px',
          marginBottom: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          fontWeight: itemLevelSavings > 0 ? '600' : 'normal'
        }}>
          <span style={{ color: textColor }}>{subtotalLabel}</span>
          <span style={{ color: totalTextColor }}>{formatMoney(subtotal)}</span>
        </div>
      )}

      {/* Coupon Discount */}
      {showCouponDiscount && appliedDiscount && couponDiscount > 0 && (
        <div style={{
          fontSize: '15px',
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
        fontSize: '20px',
        fontWeight: '700',
        paddingTop: '12px',
        display: 'flex',
        justifyContent: 'space-between',
        color: totalTextColor
      }}>
        <span>{totalLabel}</span>
        <span style={{ color: totalSavings > 0 ? '#059669' : totalTextColor }}>
          {formatMoney(estimatedTotal)}
        </span>
      </div>

      {/* Tax and Shipping Notice */}
      {showTaxNotice && (
        <div style={{
          fontSize: '12px',
          color: '#6b7280',
          marginTop: '8px',
          textAlign: 'right'
        }}>
          {taxNoticeText}
        </div>
      )}
    </div>
  );
};

