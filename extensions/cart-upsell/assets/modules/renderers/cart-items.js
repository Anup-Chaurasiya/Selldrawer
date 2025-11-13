/**
 * Cart Items Renderer
 */

import { formatMoney } from '../utils.js';

export function renderCartItems(cart, productCompareAtPrices, appliedDiscount) {
  let html = '';

  cart.items.forEach(item => {
    const linePrice = item.line_price || (item.price * item.quantity);
    const itemPrice = item.price || item.final_price || 0;
    
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
    
    const originalItemPrice = originalLinePrice / item.quantity;
    
    const hasItemDiscount = originalItemPrice > itemPrice && originalLinePrice > linePrice;
    const itemDiscountAmount = hasItemDiscount ? (originalLinePrice - linePrice) : 0;
    const itemDiscountPercent = hasItemDiscount && originalLinePrice > 0 
      ? Math.round(((originalLinePrice - linePrice) / originalLinePrice) * 100) 
      : 0;
    
    const itemSubtotal = linePrice;
    let itemPriceWithCoupon = itemSubtotal;
    
    if (appliedDiscount && appliedDiscount.type === 'percentage') {
      itemPriceWithCoupon = Math.round(itemSubtotal * (1 - appliedDiscount.value / 100));
    } else if (appliedDiscount && appliedDiscount.type === 'fixed') {
      const itemProportion = itemSubtotal / cart.total_price;
      const itemCouponDiscount = Math.round((appliedDiscount.value * 100) * itemProportion);
      itemPriceWithCoupon = Math.max(0, itemSubtotal - itemCouponDiscount);
    }
    
    const hasCouponDiscount = appliedDiscount && (appliedDiscount.type === 'percentage' || appliedDiscount.type === 'fixed');
    
    html += `
      <div class="upsellity-cart-item" data-item-key="${item.key}">
        <img src="${item.featured_image?.url || item.image}" alt="${item.title}" class="upsellity-cart-item-image" />
        <div class="upsellity-cart-item-details">
          <div class="upsellity-cart-item-title">${item.title}</div>
          <div class="upsellity-cart-item-variant">${item.variant_title || ''}</div>
          <div class="upsellity-cart-item-price">
            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
              ${renderItemPrice(hasItemDiscount, hasCouponDiscount, originalLinePrice, itemSubtotal, itemPriceWithCoupon, itemDiscountPercent)}
            </div>
            ${hasCouponDiscount ? `
              <div style="font-size: 11px; color: #059669; margin-top: 2px;">
                Coupon discount applied
              </div>
            ` : ''}
          </div>
          <div class="upsellity-cart-item-controls">
            <div class="upsellity-quantity-controls">
              <button class="upsellity-quantity-btn" onclick="window.upsellityDrawer.updateQuantity('${item.key}', ${item.quantity - 1})" ${item.quantity <= 1 ? 'disabled' : ''}>−</button>
              <span class="upsellity-quantity-display">${item.quantity}</span>
              <button class="upsellity-quantity-btn" onclick="window.upsellityDrawer.updateQuantity('${item.key}', ${item.quantity + 1})">+</button>
            </div>
            <button class="upsellity-remove-btn" onclick="window.upsellityDrawer.removeItem('${item.key}')" title="Remove item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3,6 5,6 21,6"></polyline>
                <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
            </button>
          </div>
        </div>
      </div>
    `;
  });

  return html;
}

function renderItemPrice(hasItemDiscount, hasCouponDiscount, originalLinePrice, itemSubtotal, itemPriceWithCoupon, itemDiscountPercent) {
  if (hasItemDiscount && !hasCouponDiscount) {
    return `
      <span style="text-decoration: line-through; color: #9ca3af; font-size: 13px;">
        ${formatMoney(originalLinePrice)}
      </span>
      <span style="font-weight: 700; font-size: 16px; color: #f59e0b;">
        ${formatMoney(itemSubtotal)}
      </span>
      <span style="background: #fef3c7; color: #92400e; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 600;">
        ${itemDiscountPercent}% OFF
      </span>
    `;
  } else if (hasCouponDiscount) {
    return `
      <span style="text-decoration: line-through; color: #9ca3af; font-size: 13px;">
        ${formatMoney(itemSubtotal)}
      </span>
      <span style="font-weight: 700; font-size: 16px; color: #059669;">
        ${formatMoney(itemPriceWithCoupon)}
      </span>
    `;
  } else if (hasItemDiscount) {
    return `
      <span style="text-decoration: line-through; color: #9ca3af; font-size: 13px;">
        ${formatMoney(originalLinePrice)}
      </span>
      <span style="font-weight: 700; font-size: 16px; color: #f59e0b;">
        ${formatMoney(itemSubtotal)}
      </span>
      <span style="background: #fef3c7; color: #92400e; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 600;">
        ${itemDiscountPercent}% OFF
      </span>
    `;
  } else {
    return `
      <span style="font-weight: 700; font-size: 16px; color: #111827;">
        ${formatMoney(itemSubtotal)}
      </span>
    `;
  }
}

