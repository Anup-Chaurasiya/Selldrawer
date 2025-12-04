/**
 * Discount and coupon management module
 */

import { showNotification, formatMoney } from './utils.js';

/**
 * Load available discounts from API
 */
export async function loadAvailableDiscounts(appUrl, shop, config) {
  const couponField = config?.features?.couponCodeField;
  
  if (!couponField || (!couponField.enableAutoApply && !couponField.showAllOffers)) {
    return [];
  }

  try {
    const response = await fetch(`${appUrl}/api/available-discounts?shop=${shop}`);
    const data = await response.json();

    if (data.discounts && data.discounts.length > 0) {
      return data.discounts;
    } else {
      console.warn('Upsellity: No discounts available', {
        count: data.count,
        error: data.error,
        debug: data.debug,
      });
      return [];
    }
  } catch (error) {
    console.error('Upsellity: Failed to load available discounts', error);
    return [];
  }
}

/**
 * Auto-apply best discount based on strategy
 */
export function autoApplyBestDiscount(availableDiscounts, cart, config) {
  if (!availableDiscounts || availableDiscounts.length === 0) {
    return null;
  }

  const couponField = config?.features?.couponCodeField;
  const strategy = couponField?.autoApplyStrategy || 'best_value';

  let bestDiscount = null;

  if (strategy === 'best_value') {
    let maxSavings = 0;
    for (const discount of availableDiscounts) {
      const savings = calculateDiscountSavings(discount, cart);
      if (savings > maxSavings) {
        maxSavings = savings;
        bestDiscount = discount;
      }
    }
  } else if (strategy === 'highest_percentage') {
    for (const discount of availableDiscounts) {
      if (discount.type === 'percentage') {
        if (!bestDiscount || discount.value > bestDiscount.value) {
          bestDiscount = discount;
        }
      }
    }
  } else if (strategy === 'first_available') {
    bestDiscount = availableDiscounts[0];
  }

  return bestDiscount;
}

/**
 * Calculate discount savings amount
 */
export function calculateDiscountSavings(discount, cart) {
  if (!cart) return 0;

  const cartTotal = cart.total_price;

  switch (discount.type) {
    case 'percentage':
      return Math.round((cartTotal * discount.value) / 100);
    case 'fixed':
      return Math.min(discount.value * 100, cartTotal);
    case 'free_shipping':
      return 10000; // ₹100 in cents
    case 'bxgy':
      return 5000; // ₹50 in cents
    default:
      return 0;
  }
}

/**
 * Validate and apply coupon code (used with React component)
 */
export async function validateAndApplyCoupon(appUrl, shop, config, couponCode, cart) {
  if (!couponCode || !couponCode.trim()) {
    showNotification('Please enter a coupon code', 'error');
    return null;
  }

  const code = couponCode.trim().toUpperCase();

  try {
    const response = await fetch(`${appUrl}/api/validate-discount?shop=${shop}&code=${encodeURIComponent(code)}`);
    const data = await response.json();

    if (data.valid) {
      const newDiscount = {
        code: data.code,
        title: data.title,
        description: data.description || getDiscountDescription(data.type, data.value),
        type: data.type,
        value: data.value
      };
      
      const estimatedDiscount = calculateEstimatedDiscount(newDiscount, cart);
      showNotification(`Coupon ${data.code} applied! You're saving ${formatMoney(estimatedDiscount)}`, 'success');
      
      return newDiscount;
    } else {
      showNotification(data.error || 'Invalid coupon code', 'error');
      return null;
    }
  } catch (error) {
    console.error('Upsellity: Error validating coupon', error);
    showNotification('Failed to validate coupon code', 'error');
    return null;
  }
}

/**
 * Apply coupon code (legacy function for non-React implementations)
 */
export async function applyCoupon(appUrl, shop, config, appliedDiscount, renderCallback) {
  const couponInput = document.getElementById('upsellity-coupon-input');
  const messageDiv = document.getElementById('upsellity-coupon-message');
  const applyBtn = document.querySelector('.upsellity-coupon-apply-btn');
  
  if (!couponInput || !messageDiv) {
    console.error('Upsellity: Coupon elements not found');
    return null;
  }

  const couponCode = couponInput.value.trim().toUpperCase();
  if (!couponCode) {
    messageDiv.textContent = 'Please enter a coupon code';
    messageDiv.style.color = '#ef4444';
    return null;
  }

  messageDiv.textContent = 'Validating coupon...';
  messageDiv.style.color = '#6b7280';
  if (applyBtn) applyBtn.disabled = true;

  try {
    const response = await fetch(`${appUrl}/api/validate-discount?shop=${shop}&code=${encodeURIComponent(couponCode)}`);
    const data = await response.json();

    if (data.valid) {
      const newDiscount = {
        code: data.code,
        title: data.title,
        description: data.description || getDiscountDescription(data.type, data.value),
        type: data.type,
        value: data.value
      };

      const couponField = config.features.couponCodeField;
      messageDiv.textContent = couponField.successMessage || 'Coupon applied successfully!';
      messageDiv.style.color = '#10b981';
      
      couponInput.value = '';
      
      renderCallback();
      
      const estimatedDiscount = calculateEstimatedDiscount(newDiscount, null);
      showNotification(`Coupon ${data.code} applied! You're saving ${formatMoney(estimatedDiscount)}`, 'success');
      
      return newDiscount;
    } else {
      const couponField = config.features.couponCodeField;
      messageDiv.textContent = data.error || couponField.errorMessage || 'Invalid coupon code';
      messageDiv.style.color = '#ef4444';
      return null;
    }
  } catch (error) {
    console.error('Upsellity: Error validating coupon', error);
    const couponField = config.features.couponCodeField;
    messageDiv.textContent = couponField.errorMessage || 'Invalid coupon code';
    messageDiv.style.color = '#ef4444';
    return null;
  } finally {
    if (applyBtn) applyBtn.disabled = false;
  }
}

/**
 * Get human-readable discount description
 */
export function getDiscountDescription(type, value) {
  if (!type) return '';
  
  switch (type) {
    case 'percentage':
      return `${value}% off your order`;
    case 'fixed':
      return `₹${value} off your order`;
    case 'free_shipping':
      return 'Free shipping on your order';
    case 'bxgy':
      return 'Buy X Get Y discount';
    default:
      return 'Discount will be applied at checkout';
  }
}

/**
 * Calculate estimated discount amount
 */
export function calculateEstimatedDiscount(appliedDiscount, cart) {
  if (!appliedDiscount || !cart) return 0;
  
  const { type, value } = appliedDiscount;
  
  switch (type) {
    case 'percentage':
      return Math.round((cart.total_price * value) / 100);
    case 'fixed':
      return Math.min(value * 100, cart.total_price);
    case 'free_shipping':
      return 0;
    case 'bxgy':
      return 0;
    default:
      return 0;
  }
}

/**
 * Get checkout URL with discount code
 */
export function getCheckoutUrl(appliedDiscount) {
  if (appliedDiscount) {
    return `/checkout?discount=${encodeURIComponent(appliedDiscount.code)}`;
  }
  return '/checkout';
}

