/**
 * Milestone Reward Manager
 * Handles milestone reward management with discount attributes
 */

import { cartOps } from './cart-operations-enhanced.js';

export const MilestoneRewardManager = {
  /**
   * Calculate cart total excluding gift items
   */
  calculateCartTotalExcludingGifts(cart) {
    if (!cart || !cart.items) return 0;

    let total = 0;
    for (const item of cart.items) {
      const props = this.normalizeProperties(item.properties);
      const isGift = props['_selldrawer_gift_source'];
      
      if (!isGift) {
        total += item.line_price;
      }
    }

    return total;
  },

  /**
   * Handle milestone rewards - add gift to cart with discount properties
   */
  async handleMilestoneRewards(milestones, cart, onSuccess) {
    if (!milestones || milestones.length === 0) return null;

    const cartTotal = this.calculateCartTotalExcludingGifts(cart);

    // Find the highest unlocked milestone with a gift reward
    let unlockedMilestone = null;
    for (const milestone of milestones) {
      if (milestone.rewardType === 'gift_wrapping' && cartTotal >= milestone.targetAmount * 100) {
        unlockedMilestone = milestone;
      }
    }

    if (!unlockedMilestone) return null;

    // Check if gift is already in cart
    const existingGift = this.getMilestoneGiftInCart(cart, unlockedMilestone);
    if (existingGift) return unlockedMilestone;

    // Add gift to cart with discount properties
    if (unlockedMilestone.giftProducts && unlockedMilestone.giftProducts.length > 0) {
      const giftProduct = unlockedMilestone.giftProducts[0];
      const variantId = giftProduct.shopifyVariantId || giftProduct.shopifyProductId;

      const items = [{
        id: variantId,
        quantity: 1,
        properties: {
          '_selldrawer_gift_source': 'milestone',
          '_selldrawer_discount_type': 'FREE',
          '_selldrawer_discount_value': '100',
          '_milestone_id': unlockedMilestone.id
        }
      }];

      const result = await cartOps.addToCart(items);

      if (result.success) {
        this.showMilestoneUnlockedNotification(unlockedMilestone);
        if (onSuccess) await onSuccess();
      }
    }

    return unlockedMilestone;
  },

  /**
   * Show milestone unlocked notification
   */
  showMilestoneUnlockedNotification(milestone) {
    // Create a simple notification
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #10b981;
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      font-weight: 600;
      animation: slideIn 0.3s ease-out;
    `;
    notification.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px;">
        <span style="font-size: 24px;">🎉</span>
        <div>
          <div style="font-weight: 700; margin-bottom: 4px;">Milestone Unlocked!</div>
          <div style="font-weight: 400; opacity: 0.9;">${milestone.title}</div>
        </div>
      </div>
    `;

    document.body.appendChild(notification);

    // Remove after 4 seconds
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-in';
      setTimeout(() => notification.remove(), 300);
    }, 4000);
  },

  /**
   * Get all gifts in cart
   */
  getAllGiftsInCart(cart) {
    if (!cart || !cart.items) return [];

    return cart.items.filter(item => {
      const props = this.normalizeProperties(item.properties);
      return props['_selldrawer_gift_source'] === 'milestone';
    });
  },

  /**
   * Get milestone gift in cart
   */
  getMilestoneGiftInCart(cart, milestone) {
    if (!cart || !cart.items || !milestone) return null;

    return cart.items.find(item => {
      const props = this.normalizeProperties(item.properties);
      return props['_milestone_id'] === milestone.id;
    });
  },

  /**
   * Remove gift from cart
   */
  async removeGiftFromCart(itemKey) {
    try {
      await cartOps.removeFromCart(itemKey);
      return true;
    } catch (error) {
      console.error('Error removing gift from cart:', error);
      return false;
    }
  },

  /**
   * Normalize properties object
   */
  normalizeProperties(properties) {
    if (!properties) return {};
    
    // Handle both object and array formats
    if (Array.isArray(properties)) {
      const normalized = {};
      properties.forEach(prop => {
        if (prop && prop.name) {
          normalized[prop.name] = prop.value;
        }
      });
      return normalized;
    }
    
    return properties;
  },

  /**
   * Validate milestone for checkout
   */
  async validateMilestoneForCheckout(cart, milestones) {
    const cartTotal = this.calculateCartTotalExcludingGifts(cart);
    const giftsInCart = this.getAllGiftsInCart(cart);

    // Check if any gifts in cart are no longer valid
    for (const giftItem of giftsInCart) {
      const props = this.normalizeProperties(giftItem.properties);
      const milestoneId = props['_milestone_id'];
      
      const milestone = milestones.find(m => m.id === milestoneId);
      if (!milestone || cartTotal < milestone.targetAmount * 100) {
        return {
          valid: false,
          message: 'Cart total has dropped below milestone threshold. Please remove the gift or add more items.'
        };
      }
    }

    return { valid: true, message: '' };
  },

  /**
   * Get checkout URL with discount code if applicable
   */
  getCheckoutUrlWithDiscount(milestone) {
    if (!milestone || !milestone.discountCode) {
      return '/checkout';
    }

    return `/checkout?discount=${encodeURIComponent(milestone.discountCode)}`;
  }
};

// Add CSS animation
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(400px);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
}
