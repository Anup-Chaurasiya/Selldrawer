/**
 * Shared Cart Totals Component
 * Used in both production cart drawer and Remix preview
 */

import React from 'react';

interface CartItem {
  original_price: number;
  final_price: number;
  quantity: number;
  price?: number;
  line_price?: number;
  original_line_price?: number;
  properties?: Record<string, any>;
}

interface Discount {
  code: string;
  amount?: number; // Discount amount in cents from Shopify cart
}

interface CartTotalsConfig {
  showOriginalPrice?: boolean;
  showItemDiscounts?: boolean;
  showSubtotal?: boolean;
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
  totalPrice: number; // Final total price in cents from Shopify (already includes all discounts)
  subtotalPrice?: number; // Subtotal before discounts in cents from Shopify
  totalDiscount?: number; // Total discount amount in cents from Shopify cart
  config?: CartTotalsConfig;
  isPreview?: boolean;
  freeGiftVariantIds?: string[]; // Array of variant IDs that are free gifts
}

export const CartTotals: React.FC<CartTotalsProps> = ({
  items,
  totalPrice,
  subtotalPrice,
  totalDiscount = 0,
  config = {},
  isPreview = false,
  freeGiftVariantIds = []
}) => {
  // Default configuration
  const {
    showOriginalPrice = true,
    showItemDiscounts = true,
    showSubtotal = true,
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

  // Helper to check if item is a gift
  const isGiftItem = (item: CartItem) => {
    // Check if item has variant_id that matches free gift variant IDs
    const variantId = (item as any).variant_id?.toString();
    if (variantId && freeGiftVariantIds.length > 0) {
      return freeGiftVariantIds.some(giftId => giftId.toString() === variantId);
    }
    
    // Fallback: check properties (for milestone gifts)
    return item.properties && (
      item.properties['_upsellity_gift'] === 'true' ||
      item.properties['_gift'] === 'true' ||
      item.properties['_gift'] === true
    );
  };

  // Separate gift items from regular items
  const giftItems = items.filter(isGiftItem);
  const regularItems = items.filter(item => !isGiftItem(item));

  // Calculate gift savings (the value of free gifts)
  const giftSavings = giftItems.reduce((sum, item) => {
    const itemPrice = item.price || item.final_price || item.original_price || 0;
    return sum + (itemPrice * item.quantity);
  }, 0);

  // Calculate totals using Shopify data
  // Sum of all regular items' line_price (Shopify already applies all discounts to line_price)
  const sumOfRegularItems = regularItems.reduce((sum, item) => {
    return sum + (item.line_price || (item.final_price || item.price || 0) * item.quantity);
  }, 0);
  
  // Subtotal: use cart.subtotal_price if available, otherwise sum of regular items
  const subtotal = subtotalPrice || sumOfRegularItems;
  
  // Calculate original total (before any discounts)
  const originalTotal = regularItems.reduce((sum, item) => {
    // Use original_line_price if available, otherwise original_price
    if (item.original_line_price) {
      return sum + item.original_line_price;
    }
    return sum + ((item.original_price || item.price || 0) * item.quantity);
  }, 0);
  
  // Item-level savings (from original price to subtotal)
  const itemLevelSavings = originalTotal - subtotal;
  
  // Total savings (item discounts + gift savings)
  const totalSavings = itemLevelSavings + giftSavings;
  
  // Total: sum of regular items' line_price (Shopify handles all discounts, excludes gift items)
  // This is the actual total the customer pays for regular items
  const finalTotal = sumOfRegularItems;

  return (
    <div style={{
      borderTop: `2px solid ${borderColor}`,
      paddingTop: '16px',
      backgroundColor: backgroundColor,
    }}>
      {/* Original Price (if there are savings) */}
      {showOriginalPrice && totalSavings > 0 && (
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
          {formatMoney(finalTotal)}
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

