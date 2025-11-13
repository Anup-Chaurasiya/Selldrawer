/**
 * Other Feature Renderers (Savings, Free Shipping Message, Coupon Field, Cart Totals)
 */

import { formatMoney } from '../utils.js';
import { calculateEstimatedDiscount } from '../discount-manager.js';

export function renderSavingsDisplay(config, cart, appliedDiscount) {
  if (!config.features.savingsDisplay) {
    return '';
  }

  const savingsCfg = config.features.savingsDisplay;
  const itemLevelSavings = cart.items.reduce((sum, item) => {
    return sum + Math.max(0, (item.original_price - item.final_price)) * item.quantity;
  }, 0);
  const discountSavings = appliedDiscount ? calculateEstimatedDiscount(appliedDiscount, cart) : 0;
  const totalSavings = Math.max(itemLevelSavings, discountSavings);

  if (totalSavings > 0) {
    return `
      <div class="upsellity-savings-display" style="background-color: ${savingsCfg.backgroundColor}; color: ${savingsCfg.textColor}">
        ${savingsCfg.message.replace('{amount}', formatMoney(totalSavings))}
      </div>
    `;
  }
  
  return '';
}

export function renderFreeShippingMessage(config, cart) {
  if (!config.features.freeShippingMessage) {
    return '';
  }

  const msg = config.features.freeShippingMessage;
  const threshold = parseFloat(msg.thresholdAmount);
  const remaining = Math.max(threshold - (cart.total_price / 100), 0);

  console.log('Upsellity: Free shipping message debug:', {
    msg,
    threshold,
    remaining,
    cartTotal: cart.total_price,
    cartTotalInRupees: cart.total_price / 100
  });

  return `
    <div class="upsellity-shipping-message" style="background-color: ${msg.backgroundColor}; color: ${msg.textColor}; border: 2px solid ${msg.textColor}; padding: 14px 18px; border-radius: 12px; display: flex; align-items: center; gap: 12px; font-size: 14px; font-weight: 700; margin-bottom: 8px; box-shadow: 0 3px 6px rgba(0, 0, 0, 0.1); position: relative; overflow: hidden;">
      <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(45deg, rgba(255,255,255,0.2) 0%, transparent 50%); pointer-events: none;"></div>
      <div style="font-size: 20px; flex-shrink: 0; position: relative; z-index: 1;">🚚</div>
      <span style="position: relative; z-index: 1; text-shadow: 0 1px 2px rgba(0,0,0,0.1); flex: 1;">
        ${remaining > 0 
          ? msg.beforeThresholdMessage.replace('{threshold}', `${msg.currency === 'INR' ? '₹' : '$'}${Math.round(threshold)}`).replace('{remaining}', `${msg.currency === 'INR' ? '₹' : '$'}${Math.round(remaining)}`)
          : msg.achievedMessage
        }
      </span>
    </div>
  `;
}

export function renderCouponCodeField(config, appliedDiscount, availableDiscounts, showingAllOffers) {
  if (!config.features.couponCodeField) {
    return '';
  }

  const couponField = config.features.couponCodeField;
  
  return `
    <div class="upsellity-coupon-field">
      <div class="upsellity-coupon-input-container">
        <div class="upsellity-coupon-input-wrapper">
          <input 
            type="text" 
            id="upsellity-coupon-input" 
            class="upsellity-coupon-input"
            placeholder="${couponField.placeholder || 'Enter coupon code'}"
            onkeypress="if(event.key === 'Enter') window.upsellityDrawer.applyCoupon()"
          />
        </div>
        <button 
          class="upsellity-coupon-apply-btn"
          onclick="window.upsellityDrawer.applyCoupon()"
        >
          ${couponField.buttonText || 'Apply'}
        </button>
      </div>
      <div id="upsellity-coupon-message" class="upsellity-coupon-message"></div>

      ${appliedDiscount ? renderAppliedDiscount(appliedDiscount, couponField) : ''}

      ${couponField.showAllOffers && availableDiscounts.length > 0 ? renderAllOffers(couponField, availableDiscounts, appliedDiscount, showingAllOffers) : ''}
    </div>
  `;
}

function renderAppliedDiscount(appliedDiscount, couponField) {
  return `
    <div class="upsellity-applied-discount">
      <div class="upsellity-applied-discount-content">
        <div class="upsellity-discount-checkmark">✓</div>
        <div class="upsellity-discount-info">
          <div class="upsellity-discount-title">
            ${appliedDiscount.code} - ${appliedDiscount.description}
          </div>
          <div class="upsellity-discount-subtitle">
            ${couponField.enableAutoApply ? 'Best offer automatically applied' : 'Applied'}
          </div>
        </div>
        <button 
          class="upsellity-discount-remove"
          onclick="window.upsellityDrawer.removeDiscount()"
        >
          Remove
        </button>
      </div>
    </div>
  `;
}

function renderAllOffers(couponField, availableDiscounts, appliedDiscount, showingAllOffers) {
  return `
    <button 
      class="upsellity-show-offers-btn"
      onclick="window.upsellityDrawer.toggleAllOffers()"
    >
      <span style="display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 16px;">🎁</span>
        <span>${couponField.showAllOffersButtonText || 'Show all offers'} (${availableDiscounts.length} available)</span>
      </span>
      <span style="font-size: 12px; color: #6b7280; transition: transform 0.3s ease;" id="upsellity-offers-arrow">${showingAllOffers ? '▲' : '▼'}</span>
    </button>

    <div id="upsellity-all-offers-dropdown" class="upsellity-offers-list" style="display: ${showingAllOffers ? 'block' : 'none'};">
      ${availableDiscounts.map(discount => `
        <div 
          class="upsellity-offer-item ${appliedDiscount?.code === discount.code ? 'selected' : ''}"
          onclick="window.upsellityDrawer.switchDiscount('${discount.code}')"
        >
          <div class="upsellity-offer-content">
            <div class="upsellity-offer-checkbox">
              ${appliedDiscount?.code === discount.code ? '✓' : ''}
            </div>
            <div class="upsellity-offer-details">
              <div class="upsellity-offer-code">
                ${discount.code} - ${discount.description}
              </div>
              <div class="upsellity-offer-description">
                ${discount.title}
              </div>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

export function renderCartTotals(cart, appliedDiscount) {
  const originalTotal = cart.items.reduce((sum, item) => {
    return sum + (item.original_price * item.quantity);
  }, 0);
  
  const subtotal = cart.total_price;
  const itemLevelSavings = originalTotal - subtotal;
  const couponDiscount = calculateEstimatedDiscount(appliedDiscount, cart);
  const estimatedTotal = Math.max(0, subtotal - couponDiscount);
  const totalSavings = itemLevelSavings + couponDiscount;
  
  return `
    <div style="border-top: 2px solid #e5e7eb; padding-top: 16px; margin-top: 20px;">
      ${itemLevelSavings > 0 || couponDiscount > 0 ? `
        <div style="font-size: 15px; margin-bottom: 10px; display: flex; justify-content: space-between; color: #6b7280;">
          <span>Original Price</span>
          <span style="text-decoration: line-through;">${formatMoney(originalTotal)}</span>
        </div>
      ` : ''}
      
      ${itemLevelSavings > 0 ? renderItemDiscounts(itemLevelSavings) : ''}
      
      <div style="font-size: 16px; margin-bottom: 12px; display: flex; justify-content: space-between; ${itemLevelSavings > 0 ? 'font-weight: 600;' : ''}">
        <span style="color: #374151;">Subtotal</span>
        <span style="color: #111827;">${formatMoney(subtotal)}</span>
      </div>
      
      ${appliedDiscount && couponDiscount > 0 ? renderCouponDiscount(appliedDiscount, couponDiscount) : ''}
      
      <div style="font-size: 20px; font-weight: 700; padding-top: 12px; border-top: 2px solid #e5e7eb; display: flex; justify-content: space-between; color: #111827;">
        <span>Total</span>
        <span style="color: ${totalSavings > 0 ? '#059669' : '#111827'};">${formatMoney(estimatedTotal)}</span>
      </div>
      
      <div style="font-size: 12px; color: #6b7280; margin-top: 8px; text-align: right;">
        Taxes and shipping calculated at checkout
      </div>
    </div>
  `;
}

function renderItemDiscounts(itemLevelSavings) {
  return `
    <div style="font-size: 14px; margin-bottom: 10px; display: flex; justify-content: space-between; color: #f59e0b;">
      <span style="display: flex; align-items: center; gap: 6px;">
        <span>Item Discounts</span>
        <span style="background: #fef3c7; color: #92400e; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 600;">
          SALE
        </span>
      </span>
      <span style="font-weight: 600;">-${formatMoney(itemLevelSavings)}</span>
    </div>
  `;
}

function renderCouponDiscount(appliedDiscount, couponDiscount) {
  return `
    <div style="font-size: 15px; margin-bottom: 12px; display: flex; justify-content: space-between; color: #059669;">
      <span style="display: flex; align-items: center; gap: 6px;">
        <span>Coupon (${appliedDiscount.code})</span>
        <span style="background: #d1fae5; color: #065f46; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 600;">
          ${appliedDiscount.type === 'percentage' ? `${appliedDiscount.value}%` : 'FIXED'}
        </span>
      </span>
      <span style="font-weight: 600;">-${formatMoney(couponDiscount)}</span>
    </div>
  `;
}

