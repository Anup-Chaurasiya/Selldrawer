/**
 * Free Gift Manager
 * Handles free gift selection and cart synchronization with discount attributes
 */

import { cartOps } from './cart-operations-enhanced.js';

export const FreeGiftManager = {
  /**
   * Load free gifts from API
   */
  async loadFreeGifts(shop, cart, cartTotal) {
    try {
      const appUrl = typeof __APP_URL__ !== 'undefined' ? __APP_URL__ : 'https://app.selldrawer.com';
      const response = await fetch(`${appUrl}/api/free-gifts?shop=${encodeURIComponent(shop)}&cartTotal=${cartTotal}`);
      
      if (!response.ok) {
        console.error('Failed to load free gifts:', response.status);
        return [];
      }

      const data = await response.json();
      return data.freeGifts || [];
    } catch (error) {
      console.error('Error loading free gifts:', error);
      return [];
    }
  },

  /**
   * Select a free gift and add it to cart with discount properties
   */
  async selectGift(variantId, freeGift, onSuccess) {
    try {
      // Remove any existing free gift from this promotion
      const cart = await cartOps.getCart();
      const existingGifts = this.getAllGiftsInCart(cart, freeGift);
      
      for (const giftItem of existingGifts) {
        await cartOps.removeFromCart(giftItem.key);
      }

      // Add the selected gift with discount properties
      const items = [{
        id: variantId,
        quantity: 1,
        properties: {
          '_selldrawer_gift_source': 'free_gift',
          '_selldrawer_discount_type': 'FREE',
          '_selldrawer_discount_value': '100',
          '_free_gift_id': freeGift.id
        }
      }];

      const result = await cartOps.addToCart(items);

      if (result.success && onSuccess) {
        await onSuccess();
      }

      return result.success;
    } catch (error) {
      console.error('Error selecting free gift:', error);
      return false;
    }
  },

  /**
   * Sync free gift with cart (auto-add if only one option)
   */
  async syncFreeGiftWithCart(freeGift, cart, onSuccess) {
    if (!freeGift || !freeGift.qualified) return;

    // If only one gift product, auto-add it
    if (freeGift.giftProducts && freeGift.giftProducts.length === 1) {
      const giftProduct = freeGift.giftProducts[0];
      const variantId = giftProduct.shopifyVariantId || giftProduct.shopifyProductId;

      // Check if already in cart
      const existingGift = this.getSelectedGiftFromCart(cart, freeGift);
      if (!existingGift) {
        await this.selectGift(variantId, freeGift, onSuccess);
      }
    }
  },

  /**
   * Get selected gift from cart
   */
  getSelectedGiftFromCart(cart, freeGift) {
    if (!cart || !cart.items || !freeGift) return null;

    const giftItem = cart.items.find(item => {
      const props = this.normalizeProperties(item.properties);
      return props['_free_gift_id'] === freeGift.id;
    });

    if (giftItem) {
      // Find matching product in gift products
      const matchingProduct = freeGift.giftProducts.find(p => {
        const variantId = p.shopifyVariantId || p.shopifyProductId;
        return cartOps.normalizeVariantId(variantId) === cartOps.normalizeVariantId(giftItem.variant_id);
      });

      return matchingProduct ? matchingProduct.id : null;
    }

    return null;
  },

  /**
   * Get all free gifts in cart
   */
  getAllGiftsInCart(cart, freeGift = null) {
    if (!cart || !cart.items) return [];

    return cart.items.filter(item => {
      const props = this.normalizeProperties(item.properties);
      const source = props['_selldrawer_gift_source'];
      
      if (source !== 'free_gift') return false;
      
      // If specific free gift provided, filter by ID
      if (freeGift) {
        return props['_free_gift_id'] === freeGift.id;
      }
      
      return true;
    });
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
   * Get checkout URL with discount code if applicable
   */
  getCheckoutUrlWithDiscount(freeGift) {
    if (!freeGift || !freeGift.discountCode) {
      return '/checkout';
    }

    return `/checkout?discount=${encodeURIComponent(freeGift.discountCode)}`;
  }
};
