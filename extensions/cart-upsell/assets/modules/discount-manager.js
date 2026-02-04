/**
 * Discount and coupon management module
 * Uses Shopify AJAX API for all discount operations
 */

// import { showNotification } from './utils.js';

/**
 * Load available discounts from API (for display purposes only)
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
 * Auto-apply best discount using Shopify API
 */
export async function autoApplyBestDiscount(availableDiscounts, config, loadCartCallback) {
  if (!availableDiscounts || availableDiscounts.length === 0) {
    return null;
  }

  const couponField = config?.features?.couponCodeField;
  const strategy = couponField?.autoApplyStrategy || 'first_available';

  let bestDiscount = null;

  if (strategy === 'first_available') {
    bestDiscount = availableDiscounts[0];
  } else if (strategy === 'highest_percentage') {
    for (const discount of availableDiscounts) {
      if (discount.type === 'percentage') {
        if (!bestDiscount || discount.value > bestDiscount.value) {
          bestDiscount = discount;
        }
      }
    }
    // If no percentage discount found, use first available
    if (!bestDiscount) {
      bestDiscount = availableDiscounts[0];
    }
  } else {
    // Default to first available
    bestDiscount = availableDiscounts[0];
  }

  if (bestDiscount) {
    // Apply discount using Shopify API
    await applyDiscountCode(bestDiscount.code, loadCartCallback);
    return bestDiscount.code;
  }

  return null;
}

/**
 * Apply discount code using Shopify AJAX API
 */
export async function applyDiscountCode(code, loadCartCallback) {
  if (!code || !code.trim()) {
    // showNotification('Please enter a coupon code', 'error');
    return false;
  }

  try {
    const response = await fetch('/cart/update.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        discount: code.trim()
      })
    });

    if (response.ok) {
      const cart = await response.json();

      // Reload cart to get updated discount information
      if (loadCartCallback) {
        await loadCartCallback(cart);
      }

      // showNotification(`Coupon ${code} applied!`, 'success');
      return true;
    } else {
      const error = await response.json();
      const errorMessage = error.description || error.message || 'Invalid coupon code';
      // showNotification(errorMessage, 'error');
      return false;
    }
  } catch (error) {
    console.error('Upsellity: Error applying discount', error);
    // showNotification('Failed to apply coupon code', 'error');
    return false;
  }
}

/**
 * Remove discount using Shopify AJAX API
 */
export async function removeDiscount(loadCartCallback) {
  try {
    const response = await fetch('/cart/update.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        discount: ''
      })
    });

    if (response.ok) {
      const cart = await response.json();

      // Call callback with updated cart (but don't trigger full loadCart which would auto-apply)
      if (loadCartCallback) {
        await loadCartCallback(cart);
      }

      // showNotification('Discount removed', 'info');
      return true;
    } else {
      const error = await response.json();
      console.error('Upsellity: Error removing discount', error);
      // showNotification(error.description || error.message || 'Failed to remove discount', 'error');
      return false;
    }
  } catch (error) {
    console.error('Upsellity: Error removing discount', error);
    // showNotification('Failed to remove discount', 'error');
    return false;
  }
}

/**
 * Validate and apply coupon code (used with React component)
 * Uses Shopify AJAX API directly
 */
export async function validateAndApplyCoupon(appUrl, shop, config, couponCode, loadCartCallback) {
  return await applyDiscountCode(couponCode, loadCartCallback);
}

/**
 * Apply coupon code (legacy function for non-React implementations)
 * Uses Shopify AJAX API directly
 */
export async function applyCoupon(appUrl, shop, config, appliedDiscount, renderCallback) {
  const couponInput = document.getElementById('upsellity-coupon-input');
  const messageDiv = document.getElementById('upsellity-coupon-message');
  const applyBtn = document.querySelector('.upsellity-coupon-apply-btn');

  if (!couponInput || !messageDiv) {
    console.error('Upsellity: Coupon elements not found');
    return null;
  }

  const couponCode = couponInput.value.trim();
  if (!couponCode) {
    messageDiv.textContent = 'Please enter a coupon code';
    messageDiv.style.color = '#ef4444';
    return null;
  }

  messageDiv.textContent = 'Applying coupon...';
  messageDiv.style.color = '#6b7280';
  if (applyBtn) applyBtn.disabled = true;

  try {
    const success = await applyDiscountCode(couponCode, async (cart) => {
      renderCallback();
    });

    if (success) {
      const couponField = config.features.couponCodeField;
      messageDiv.textContent = couponField.successMessage || 'Coupon applied successfully!';
      messageDiv.style.color = '#10b981';
      couponInput.value = '';
      return couponCode;
    } else {
      const couponField = config.features.couponCodeField;
      messageDiv.textContent = couponField.errorMessage || 'Invalid coupon code';
      messageDiv.style.color = '#ef4444';
      return null;
    }
  } catch (error) {
    console.error('Upsellity: Error applying coupon', error);
    const couponField = config.features.couponCodeField;
    messageDiv.textContent = couponField.errorMessage || 'Invalid coupon code';
    messageDiv.style.color = '#ef4444';
    return null;
  } finally {
    if (applyBtn) applyBtn.disabled = false;
  }
}

/**
 * Get discount information from Shopify cart object
 */
export function getDiscountFromCart(cart) {
  if (!cart || !cart.discount_codes || cart.discount_codes.length === 0) {
    return null;
  }

  // Shopify returns discount_codes array with code and amount
  const discountCode = cart.discount_codes[0];

  return {
    code: discountCode.code,
    amount: cart.total_discount || 0 // Total discount amount in cents
  };
}

/**
 * Get checkout URL with discount code
 */
export function getCheckoutUrl(discountCode) {
  if (discountCode) {
    return `/checkout?discount=${encodeURIComponent(discountCode)}`;
  }
  return '/checkout';
}

