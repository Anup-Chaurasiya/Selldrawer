/**
 * Milestone Reward Manager
 * Handles all milestone reward logic including gift products and discount application
 */

import { showNotification } from './utils.js';

// Gift product marker property
const GIFT_PROPERTY_KEY = '_upsellity_gift';
const GIFT_PROPERTY_VALUE = 'true';
const GIFT_MILESTONE_ID_KEY = '_upsellity_milestone_id';

/**
 * Evaluate milestones and determine which reward should be applied
 * @param {Array} milestones - Array of milestone objects from API
 * @param {Object} cart - Current cart object
 * @returns {Object|null} - The highest unlocked milestone or null
 */
export function evaluateMilestones(milestones, cart) {
  if (!milestones || milestones.length === 0 || !cart) {
    return null;
  }

  // Calculate cart total excluding gift items
  const cartTotalExcludingGifts = calculateCartTotalExcludingGifts(cart);
  
  // Convert cents to rupees for comparison
  const cartTotalInRupees = cartTotalExcludingGifts / 100;
  
  // Find all unlocked milestones
  const unlockedMilestones = milestones.filter(milestone => {
    return cartTotalInRupees >= milestone.targetAmount;
  });
  
  // Return the highest unlocked milestone (highest targetAmount)
  if (unlockedMilestones.length === 0) {
    return null;
  }
  
  // Sort by targetAmount descending and return the highest
  const sortedUnlocked = [...unlockedMilestones].sort((a, b) => b.targetAmount - a.targetAmount);
  return sortedUnlocked[0];
}

/**
 * Calculate cart total excluding gift items
 * @param {Object} cart - Cart object
 * @returns {number} - Total in cents excluding gifts
 */
export function calculateCartTotalExcludingGifts(cart) {
  if (!cart || !cart.items) {
    return 0;
  }
  
  let total = 0;
  
  for (const item of cart.items) {
    // Check if item has gift property
    const isGift = item.properties && (
      item.properties[GIFT_PROPERTY_KEY] === GIFT_PROPERTY_VALUE ||
      item.properties['_gift'] === 'true' ||
      item.properties['_gift'] === true
    );
    
    if (!isGift) {
      total += item.final_line_price || item.line_price || (item.price * item.quantity);
    }
  }
  
  return total;
}

/**
 * Check if a gift product is already in the cart
 * @param {Object} cart - Cart object
 * @param {string} variantId - Variant ID to check
 * @param {string} milestoneId - Milestone ID
 * @returns {Object|null} - Cart item if found, null otherwise
 */
export function findGiftInCart(cart, variantId, milestoneId) {
  if (!cart || !cart.items || !variantId) {
    return null;
  }
  
  // Normalize variant ID (remove gid:// prefix if present)
  const normalizedVariantId = normalizeVariantId(variantId);
  
  return cart.items.find(item => {
    const itemVariantId = normalizeVariantId(item.variant_id || item.id);
    const isGift = item.properties && (
      item.properties[GIFT_PROPERTY_KEY] === GIFT_PROPERTY_VALUE ||
      item.properties['_gift'] === 'true' ||
      item.properties['_gift'] === true
    );
    
    // Match by variant ID and gift property
    // Optionally match milestone ID if provided
    if (isGift && itemVariantId === normalizedVariantId) {
      if (milestoneId && item.properties[GIFT_MILESTONE_ID_KEY]) {
        return item.properties[GIFT_MILESTONE_ID_KEY] === milestoneId;
      }
      return true;
    }
    
    return false;
  });
}

/**
 * Get all gift items in cart
 * @param {Object} cart - Cart object
 * @returns {Array} - Array of gift items
 */
export function getAllGiftsInCart(cart) {
  if (!cart || !cart.items) {
    return [];
  }
  
  return cart.items.filter(item => {
    return item.properties && (
      item.properties[GIFT_PROPERTY_KEY] === GIFT_PROPERTY_VALUE ||
      item.properties['_gift'] === 'true' ||
      item.properties['_gift'] === true
    );
  });
}

/**
 * Add gift product to cart
 * @param {Object} giftProduct - Gift product object
 * @param {string} milestoneId - Milestone ID
 * @returns {Promise<boolean>} - Success status
 */
export async function addGiftToCart(giftProduct, milestoneId) {
  if (!giftProduct || !giftProduct.shopifyVariantId) {
    return false;
  }
  
  try {
    const variantId = normalizeVariantId(giftProduct.shopifyVariantId);
    
    // Prepare form data
    const formData = new FormData();
    formData.append('id', variantId);
    formData.append('quantity', '1');
    formData.append(`properties[${GIFT_PROPERTY_KEY}]`, GIFT_PROPERTY_VALUE);
    formData.append(`properties[${GIFT_MILESTONE_ID_KEY}]`, milestoneId);
    formData.append('properties[_gift_title]', giftProduct.title || 'Free Gift');
    
    const response = await fetch('/cart/add.js', {
      method: 'POST',
      body: formData
    });
    
    if (response.ok) {
      const result = await response.json();
      
      // Wait a moment for Shopify to process
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Trigger cart update events
      document.dispatchEvent(new CustomEvent('cart:updated', { detail: result }));
      document.dispatchEvent(new CustomEvent('cart:change', { detail: result }));
      
      // Force cart drawer refresh if it exists
      if (window.upsellityDrawer && typeof window.upsellityDrawer.loadCart === 'function') {
        setTimeout(() => {
          window.upsellityDrawer.loadCart();
        }, 300);
      }
      
      return true;
    } else {
      return false;
    }
  } catch (error) {
    return false;
  }
}

/**
 * Remove gift product from cart
 * @param {string} itemKey - Cart item key
 * @returns {Promise<boolean>} - Success status
 */
export async function removeGiftFromCart(itemKey) {
  if (!itemKey) {
    return false;
  }
  
  try {
    // Use cart/update.js instead of cart/change.js for better compatibility
    const response = await fetch('/cart/update.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        updates: {
          [itemKey]: 0
        }
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      
      // Wait a moment for Shopify to process
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Trigger multiple cart update events to ensure all systems refresh
      document.dispatchEvent(new CustomEvent('cart:updated', { detail: result }));
      document.dispatchEvent(new CustomEvent('cart:change', { detail: result }));
      document.dispatchEvent(new CustomEvent('cart:refresh', { detail: result }));
      
      // Also trigger theme-specific events
      if (window.Shopify && window.Shopify.theme) {
        document.dispatchEvent(new CustomEvent('theme:cart:change', { detail: result }));
      }
      
      // Try to refresh Shopify's native cart if available
      if (window.Shopify && window.Shopify.onCartUpdate) {
        window.Shopify.onCartUpdate(result);
      }
      
      // Trigger section rendering if available (for themes using sections)
      if (window.Shopify && window.Shopify.theme && window.Shopify.theme.cart) {
        try {
          window.Shopify.theme.cart.refresh();
        } catch (e) {
          // Theme cart refresh not available
        }
      }
      
      // Force cart drawer refresh if it exists
      if (window.upsellityDrawer && typeof window.upsellityDrawer.loadCart === 'function') {
        setTimeout(() => {
          window.upsellityDrawer.loadCart();
        }, 300);
      }
      
      return true;
    } else {
      return false;
    }
  } catch (error) {
    return false;
  }
}

/**
 * Sync gift products based on unlocked milestone
 * @param {Object|null} unlockedMilestone - The highest unlocked milestone
 * @param {Object} cart - Current cart
 * @param {Function} loadCartCallback - Callback to reload cart after changes
 * @returns {Promise<boolean>} - True if cart was modified
 */
export async function syncGiftProducts(unlockedMilestone, cart, loadCartCallback) {
  let cartModified = false;
  
  // Get all current gifts in cart
  const currentGifts = getAllGiftsInCart(cart);
  
  // If no milestone is unlocked, remove all gifts
  if (!unlockedMilestone) {
    for (const giftItem of currentGifts) {
      const removed = await removeGiftFromCart(giftItem.key);
      if (removed) {
        cartModified = true;
      }
    }
    
    if (cartModified && loadCartCallback) {
      await loadCartCallback();
    }
    
    return cartModified;
  }
  
  // If milestone is unlocked but not a gift reward, remove all gifts
  if (unlockedMilestone.rewardType !== 'gift_wrapping') {
    for (const giftItem of currentGifts) {
      const removed = await removeGiftFromCart(giftItem.key);
      if (removed) {
        cartModified = true;
      }
    }
    
    if (cartModified && loadCartCallback) {
      await loadCartCallback();
    }
    
    return cartModified;
  }
  
  // Milestone is unlocked and is a gift reward
  const giftProducts = unlockedMilestone.giftProducts || [];
  
  if (giftProducts.length === 0) {
    return false;
  }
  
  // Remove gifts that don't belong to this milestone
  for (const giftItem of currentGifts) {
    const belongsToThisMilestone = giftItem.properties && 
      giftItem.properties[GIFT_MILESTONE_ID_KEY] === unlockedMilestone.id;
    
    if (!belongsToThisMilestone) {
      const removed = await removeGiftFromCart(giftItem.key);
      if (removed) {
        cartModified = true;
      }
    }
  }
  
  // Add missing gift products (only if not already in cart)
  for (const giftProduct of giftProducts) {
    const existingGift = findGiftInCart(cart, giftProduct.shopifyVariantId, unlockedMilestone.id);
    
    if (!existingGift) {
      const added = await addGiftToCart(giftProduct, unlockedMilestone.id);
      if (added) {
        cartModified = true;
      }
    }
  }
  
  // Reload cart if modified
  if (cartModified) {
    // Wait for Shopify to process the changes
    await new Promise(resolve => setTimeout(resolve, 800));
    
    if (loadCartCallback) {
      await loadCartCallback();
    }
    
    // Force a final cart fetch to ensure everything is in sync
    try {
      await fetch('/cart.js').then(r => r.json());
    } catch (e) {
      // Error fetching final cart state
    }
  }
  
  return cartModified;
}

/**
 * Get checkout URL with discount code
 * @param {Object|null} unlockedMilestone - The unlocked milestone
 * @returns {string} - Checkout URL
 */
export function getCheckoutUrlWithDiscount(unlockedMilestone) {
  if (!unlockedMilestone || !unlockedMilestone.discountCode) {
    return '/checkout';
  }
  
  return `/checkout?discount=${encodeURIComponent(unlockedMilestone.discountCode)}`;
}

/**
 * Validate milestone before checkout
 * Ensures gift is in cart and discount code is available
 * @param {Object|null} unlockedMilestone - The unlocked milestone
 * @param {Object} cart - Current cart
 * @returns {Promise<Object>} - Validation result { valid: boolean, message: string }
 */
export async function validateMilestoneForCheckout(unlockedMilestone, cart) {
  // If no milestone unlocked, proceed normally
  if (!unlockedMilestone) {
    return { valid: true, message: '' };
  }
  
  // Check if discount code is configured
  if (!unlockedMilestone.discountCode) {
    return { 
      valid: false, 
      message: 'Milestone reward is not properly configured. Please contact support.' 
    };
  }
  
  // If it's a gift reward, ensure gift is in cart
  if (unlockedMilestone.rewardType === 'gift_wrapping') {
    const giftProducts = unlockedMilestone.giftProducts || [];
    
    if (giftProducts.length > 0) {
      let allGiftsPresent = true;
      
      for (const giftProduct of giftProducts) {
        const existingGift = findGiftInCart(cart, giftProduct.shopifyVariantId, unlockedMilestone.id);
        if (!existingGift) {
          allGiftsPresent = false;
          break;
        }
      }
      
      if (!allGiftsPresent) {
        return {
          valid: false,
          message: 'Adding your free gift... Please wait.'
        };
      }
    }
  }
  
  return { valid: true, message: '' };
}

/**
 * Normalize variant ID (remove gid:// prefix)
 * @param {string|number} variantId - Variant ID
 * @returns {string} - Normalized variant ID
 */
function normalizeVariantId(variantId) {
  if (!variantId) return '';
  
  const idString = String(variantId);
  
  // Remove gid://shopify/ProductVariant/ prefix if present
  if (idString.includes('gid://shopify/ProductVariant/')) {
    return idString.replace('gid://shopify/ProductVariant/', '');
  }
  
  return idString;
}

/**
 * Show milestone unlocked notification
 * @param {Object} milestone - Unlocked milestone
 */
export function showMilestoneUnlockedNotification(milestone) {
  if (!milestone) return;
  
  const rewardText = getRewardDescription(milestone);
  showNotification(`🎉 Milestone Unlocked: ${milestone.title}! ${rewardText}`, 'success');
}

/**
 * Get human-readable reward description
 * @param {Object} milestone - Milestone object
 * @returns {string} - Reward description
 */
function getRewardDescription(milestone) {
  if (!milestone) return '';
  
  switch (milestone.rewardType) {
    case 'free_shipping':
      return 'Free shipping will be applied at checkout!';
    case 'discount_percentage':
      return `${milestone.rewardValue}% discount will be applied at checkout!`;
    case 'discount_fixed':
      return `₹${milestone.rewardValue} discount will be applied at checkout!`;
    case 'gift_wrapping':
      return 'Your free gift has been added to cart!';
    default:
      return 'Reward will be applied at checkout!';
  }
}

/**
 * Main milestone reward handler
 * Call this whenever cart updates to sync rewards
 * @param {Array} milestones - Array of milestones from API
 * @param {Object} cart - Current cart
 * @param {Function} loadCartCallback - Callback to reload cart
 * @returns {Promise<Object|null>} - Unlocked milestone or null
 */
export async function handleMilestoneRewards(milestones, cart, loadCartCallback) {
  // Evaluate which milestone is unlocked
  const unlockedMilestone = evaluateMilestones(milestones, cart);
  
  // Sync gift products based on unlocked milestone
  const cartModified = await syncGiftProducts(unlockedMilestone, cart, loadCartCallback);
  
  return unlockedMilestone;
}

