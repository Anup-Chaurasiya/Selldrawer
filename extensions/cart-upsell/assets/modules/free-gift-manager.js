/**
 * Free Gift Manager Module
 * SIMPLIFIED: Uses milestone reward manager for ALL gift logic
 * Free gifts are just milestones with gift_wrapping reward type
 */

import * as MilestoneRewardManager from './milestone-reward-manager.js';

/**
 * Load free gifts from API
 * @param {string} appUrl - App URL
 * @param {string} shop - Shop domain
 * @param {Object} cart - Cart object
 * @param {number} cartTotalExcludingGifts - Cart total in rupees, excluding gift items (optional, will calculate if not provided)
 */
export async function loadFreeGifts(appUrl, shop, cart, cartTotalExcludingGifts = null) {
  try {
    // Use provided cart total (excluding gifts) or calculate from cart
    const cartTotal = cartTotalExcludingGifts !== null
      ? cartTotalExcludingGifts
      : cart.total_price / 100;



    console.log('Upsellity Free Gifts: Loading with cart total', cartTotal);

    const timestamp = new Date().getTime();
    const response = await fetch(
      `${appUrl}/api/free-gifts?shop=${shop}&_t=${timestamp}`,
      {
        method: 'POST',
        body: JSON.stringify({
          cartTotal,
          cartItems: cart.items || []
        }),
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      }
    );

    const data = await response.json();

    console.log('Upsellity Free Gifts: API Response', data);

    if (data.freeGifts) {
      console.log('Upsellity Free Gifts: Loaded', data.freeGifts.length, 'offers');
      return data.freeGifts;
    }

    return [];
  } catch (error) {
    console.error('Upsellity: Failed to load free gifts', error);
    return [];
  }
}

/**
 * Load free gifts from GIFTING BLOCK API (for theme extension blocks)
 * @param {string} appUrl - App URL
 * @param {string} shop - Shop domain
 * @param {Object} cart - Cart object
 * @param {number} cartTotalExcludingGifts - Cart total in rupees, excluding gift items
 */
export async function loadGiftingBlockGifts(appUrl, shop, cart, cartTotalExcludingGifts = null) {
  try {
    // Use provided cart total (excluding gifts) or calculate from cart
    const cartTotal = cartTotalExcludingGifts !== null
      ? cartTotalExcludingGifts
      : cart.total_price / 100;



    console.log('Upsellity Gifting Block: Loading with cart total', cartTotal);

    const timestamp = new Date().getTime();
    const response = await fetch(
      `${appUrl}/api/gifting-block?shop=${shop}&_t=${timestamp}`,
      {
        method: 'POST',
        body: JSON.stringify({
          cartTotal,
          cartItems: cart.items || []
        }),
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      }
    );

    const data = await response.json();

    console.log('Upsellity Gifting Block: API Response', data);

    if (data.gifts) {
      console.log('Upsellity Gifting Block: Loaded', data.gifts.length, 'offers');
      return data.gifts;
    }

    return [];
  } catch (error) {
    console.error('Upsellity: Failed to load gifting block gifts', error);
    return [];
  }
}

/**
 * Convert free gift to milestone format for processing
 */
function convertFreeGiftToMilestone(freeGift) {
  if (!freeGift) return null;

  return {
    id: freeGift.id,
    title: freeGift.name,
    targetAmount: freeGift.triggerValue,
    rewardType: 'gift_wrapping',
    rewardValue: null,
    discountCode: freeGift.discountCode,
    giftProducts: freeGift.giftProducts.map(gp => ({
      shopifyVariantId: gp.shopifyVariantId || gp.shopifyProductId,
      title: gp.title,
      price: gp.price,
      compareAtPrice: gp.compareAtPrice,
      imageUrl: gp.imageUrl,
      handle: gp.handle
    })),
    qualified: freeGift.qualified
  };
}

/**
 * Sync free gifts with cart - CUSTOM LOGIC for free gifts
 * Different from milestones: 
 * - If 1 gift: auto-add (like milestones)
 * - If 2+ gifts: user must choose, don't auto-add
 */
export async function syncFreeGiftWithCart(freeGift, cart, loadCartCallback) {


  const source = 'gifting_block';

  // If no free gift, use syncGiftProducts with null to remove all gifts owned by this source
  if (!freeGift) {

    return await MilestoneRewardManager.syncGiftProducts(null, cart, loadCartCallback, source);
  }

  const giftProducts = freeGift.giftProducts || [];

  // If only 1 gift product: auto-add (milestone behavior)
  if (giftProducts.length === 1) {

    const milestone = convertFreeGiftToMilestone(freeGift);
    return await MilestoneRewardManager.syncGiftProducts(milestone, cart, loadCartCallback, source);
  }

  // If 2+ gift products: user must choose, DON'T auto-add


  // Get all gifts in cart
  const allGifts = MilestoneRewardManager.getAllGiftsInCart(cart);
  const validGiftVariantIds = new Set(
    giftProducts.map(gp => {
      const variantId = gp.shopifyVariantId || gp.shopifyProductId;
      return variantId?.toString().replace('gid://shopify/ProductVariant/', '');
    })
  );

  let cartModified = false;

  // Remove gifts that don't belong to this free gift offer OR don't have the correct source
  for (const giftItem of allGifts) {
    const itemVariantId = (giftItem.variant_id || giftItem.id)?.toString();
    const props = MilestoneRewardManager.normalizeProperties(giftItem.properties);

    const belongsToThisOffer = props['_upsellity_milestone_id'] === freeGift.id;

    // Check source
    const itemSource = props['_upsellity_gift_source'];
    // Assuming if source is 'gifting_block', it behaves as expected.
    // If we claim ownership of 'gifting_block' items, we should remove them if they are invalid.

    const isManaged = itemSource === source;

    if (isManaged) {
      // Remove if belongs to this offer but is not in the current gift product list
      // OR if it belongs to a DIFFERENT offer (but same source)
      // If belongsToThisOffer is false, it means it's an OLD gifting_block gift, so we should remove it.
      if (!belongsToThisOffer || (belongsToThisOffer && !validGiftVariantIds.has(itemVariantId))) {
        console.log('Upsellity Free Gifts: Removing invalid gift from this offer', itemVariantId);
        const removed = await MilestoneRewardManager.removeGiftFromCart(giftItem.key);
        if (removed) {
          cartModified = true;
        }
      }
    }
  }

  // Check if user has already selected a gift
  const selectedGift = allGifts.find(item => {
    const itemVariantId = (item.variant_id || item.id)?.toString();
    const props = MilestoneRewardManager.normalizeProperties(item.properties);
    const belongsToThisOffer = props['_upsellity_milestone_id'] === freeGift.id;

    const itemSource = props['_upsellity_gift_source'];
    return itemSource === source && belongsToThisOffer && validGiftVariantIds.has(itemVariantId);
  });

  if (selectedGift) {

    // User has selected a gift, keep it
    // Remove any other gifts from this offer/source (keep only the selected one)
    for (const giftItem of allGifts) {
      const props = MilestoneRewardManager.normalizeProperties(giftItem.properties);
      const itemSource = props['_upsellity_gift_source'];
      if (itemSource === source && giftItem.key !== selectedGift.key) {
        console.log('Upsellity Free Gifts: Removing duplicate gift');
        const removed = await MilestoneRewardManager.removeGiftFromCart(giftItem.key);
        if (removed) {
          cartModified = true;
        }
      }
    }
  } else {

    // No gift selected yet, user needs to choose
    // Don't auto-add anything
  }

  if (cartModified && loadCartCallback) {
    await loadCartCallback();
  }

  return cartModified;
}

/**
 * Get selected gift from cart - USES MILESTONE LOGIC
 */
export function getSelectedGiftFromCart(cart, freeGift) {
  if (!cart || !cart.items || !freeGift) return null;

  const milestone = convertFreeGiftToMilestone(freeGift);
  if (!milestone) return null;

  // Use milestone logic to find gift
  for (const giftProduct of milestone.giftProducts) {
    const existingGift = MilestoneRewardManager.findGiftInCart(
      cart,
      giftProduct.shopifyVariantId,
      milestone.id
    );

    // Also check source if possible, but findGiftInCart doesn't check source by default
    // We can filter here if needed, but existing logic should likely suffice if addGiftToCart sets it correctly
    if (existingGift) {
      // Find matching gift product ID
      const matchingGift = freeGift.giftProducts.find(gp => {
        const variantId = gp.shopifyVariantId || gp.shopifyProductId;
        return variantId === giftProduct.shopifyVariantId;
      });

      return matchingGift ? matchingGift.id : null;
    }
  }

  return null;
}

/**
 * User selects a gift - USES MILESTONE LOGIC
 */
export async function selectGift(variantId, freeGift, loadCartCallback) {
  try {
    console.log('Upsellity Free Gifts: User selecting gift', variantId);

    // Get current cart
    const cartResponse = await fetch('/cart.js');
    const cart = await cartResponse.json();

    const milestone = convertFreeGiftToMilestone(freeGift);
    if (!milestone) return false;

    const source = 'gifting_block';

    // Remove all current gifts from this free gift offer (and source)
    const currentGifts = MilestoneRewardManager.getAllGiftsInCart(cart).filter(item => {
      const props = MilestoneRewardManager.normalizeProperties(item.properties);
      const itemSource = props['_upsellity_gift_source'];
      return itemSource === source; // aggressively clear old gifts from this source
    });

    for (const giftItem of currentGifts) {
      await MilestoneRewardManager.removeGiftFromCart(giftItem.key);
    }

    // Find the selected gift product
    const giftProduct = milestone.giftProducts.find(gp => {
      const normalizedGiftId = gp.shopifyVariantId?.toString().replace('gid://shopify/ProductVariant/', '');
      const normalizedVariantId = variantId?.toString().replace('gid://shopify/ProductVariant/', '');
      return normalizedGiftId === normalizedVariantId;
    });

    if (!giftProduct) {
      console.error('Gift product not found');
      return false;
    }

    // Add the selected gift using milestone logic WITH SOURCE
    const added = await MilestoneRewardManager.addGiftToCart(giftProduct, milestone.id, source);

    if (added) {
      await loadCartCallback();
      return true;
    }

    return false;
  } catch (error) {
    console.error('Upsellity: Error selecting gift', error);
    return false;
  }
}

/**
 * Validate gift for checkout - USES MILESTONE LOGIC
 */
export function validateGiftForCheckout(freeGift, cart) {
  const milestone = convertFreeGiftToMilestone(freeGift);
  return MilestoneRewardManager.validateMilestoneForCheckout(milestone, cart);
}

/**
 * Get checkout URL - USES MILESTONE LOGIC
 */
export function getCheckoutUrlWithDiscount(freeGift) {
  const milestone = convertFreeGiftToMilestone(freeGift);
  return MilestoneRewardManager.getCheckoutUrlWithDiscount(milestone);
}

/**
 * Check if gift is in cart - USES MILESTONE LOGIC
 */
export function isGiftInCart(cart, variantId, freeGiftId) {
  return MilestoneRewardManager.findGiftInCart(cart, variantId, freeGiftId);
}
