/**
 * Cart operations module - handles adding, updating, and removing items
 */

import { showNotification } from './utils.js';

/**
 * Add product to cart by variant ID
 */
export async function addProductToCart(variantId, quantity = 1, loadCartCallback, properties = {}) {
  try {
    if (!variantId) {
      throw new Error('No variant ID provided');
    }

    // Check if variantId is a numeric ID or a product handle
    if (/^\d+$/.test(variantId)) {
      // It's a numeric variant ID - use it directly
      const formData = new FormData();
      formData.append('id', variantId);
      formData.append('quantity', quantity.toString());

      // Add properties if provided
      Object.keys(properties).forEach(key => {
        formData.append(`properties[${key}]`, properties[key]);
      });

      const response = await fetch('/cart/add.js', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        await loadCartCallback();
        showNotification('Product added to cart!', 'success');
      } else {
        const error = await response.json();
        console.error('Cart add error:', error);
        showNotification(error.description || 'Failed to add product to cart', 'error');
      }
    } else {
      // It's a product handle - fetch product and use first variant
      await addProductToCartByHandle(variantId, null, quantity, loadCartCallback, properties);
    }
  } catch (error) {
    console.error('Error adding product to cart:', error);
    showNotification('Failed to add product to cart', 'error');
  }
}

/**
 * Add product to cart by product handle
 */
export async function addProductToCartByHandle(productHandle, variantId, quantity = 1, loadCartCallback, properties = {}) {
  try {
    // Check if productHandle is a numeric ID (legacy data) or a handle
    let productResponse;
    if (/^\d+$/.test(productHandle)) {
      // It's a numeric ID, try to use it directly as variant ID
      const formData = new FormData();
      formData.append('id', productHandle);
      formData.append('quantity', quantity.toString());

      // Add properties if provided
      Object.keys(properties).forEach(key => {
        formData.append(`properties[${key}]`, properties[key]);
      });

      const response = await fetch('/cart/add.js', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        await loadCartCallback();
        showNotification('Product added to cart!', 'success');
        return;
      } else {
        const error = await response.json();
        console.error('Failed to add product with numeric ID:', productHandle, error);
        showNotification(error.description || error.message || 'Product not found', 'error');
        throw new Error(error.description || error.message || 'Product not found');
      }
    } else {
      // It's a product handle, fetch the product data
      productResponse = await fetch(`/products/${productHandle}.js`);
      if (!productResponse.ok) {
        console.error('Product not found for handle:', productHandle);
        throw new Error('Product not found');
      }
    }

    const product = await productResponse.json();

    // Use the first variant if no specific variant ID provided
    const variant = variantId ?
      product.variants.find(v => {
        const vId = v.id.toString().replace('gid://shopify/ProductVariant/', '');
        const pId = variantId.toString().replace('gid://shopify/ProductVariant/', '');
        return vId === pId;
      }) :
      product.variants[0];

    if (!variant) {
      console.error('No variant found for product:', product.title);
      throw new Error('Variant not found');
    }

    // Check if variant is available for purchase
    if (!variant.available) {
      console.warn('Product is not available:', product.title);
      showNotification(`The product '${product.title}' is already sold out`, 'error');
      return;
    }

    // Check inventory quantity if available
    if (variant.inventory_management && variant.inventory_quantity !== null && variant.inventory_quantity <= 0) {
      console.warn('Product is out of stock:', product.title);
      showNotification(`The product '${product.title}' is already sold out`, 'error');
      return;
    }

    const formData = new FormData();
    formData.append('id', variant.id);
    formData.append('quantity', quantity.toString());

    // Add properties if provided
    Object.keys(properties).forEach(key => {
      formData.append(`properties[${key}]`, properties[key]);
    });

    const response = await fetch('/cart/add.js', {
      method: 'POST',
      body: formData
    });

    if (response.ok) {
      await loadCartCallback();
      showNotification(`${product.title} added to cart!`, 'success');
    } else {
      const error = await response.json();
      console.error('Cart add failed:', error);
      showNotification(error.description || error.message || 'Failed to add product to cart', 'error');
    }
  } catch (error) {
    console.error('Error adding product to cart:', error);
    if (error.message && !error.message.includes('Failed to add')) {
      showNotification(error.message, 'error');
    } else {
      showNotification('Failed to add product to cart', 'error');
    }
  }
}

/**
 * Update item quantity in cart
 */
export async function updateQuantity(itemKey, newQuantity, loadCartCallback, renderCallback) {
  if (newQuantity < 0) {
    showNotification('Quantity cannot be negative', 'error');
    return; // Return gracefully without throwing
  }

  const cartItem = document.querySelector(`[data-item-key="${itemKey}"]`);
  if (cartItem) {
    cartItem.classList.add('upsellity-loading');
  }

  try {
    // First, fetch current cart to find the item and get its line number or variant ID
    const cartResponse = await fetch('/cart.js');
    if (!cartResponse.ok) {
      throw new Error('Failed to fetch cart');
    }
    const cart = await cartResponse.json();

    // Find the cart item by key
    const cartItemIndex = cart.items.findIndex(item => item.key === itemKey);
    if (cartItemIndex === -1) {
      // Item not found in cart - might have been removed
      await loadCartCallback();
      renderCallback();
      showNotification('Item not found in cart', 'error');
      return;
    }

    const item = cart.items[cartItemIndex];

    // Check if this is a gift item - gift items cannot be manually modified
    const isGift = item.properties && (
      item.properties['_upsellity_gift'] === 'true' ||
      item.properties['_gift'] === 'true' ||
      item.properties['_gift'] === true
    );

    if (isGift) {
      showNotification('Gift items are automatically managed and cannot be modified', 'info');
      await loadCartCallback();
      renderCallback();
      return;
    }

    // Use line number (1-based index) for the update request
    const lineNumber = cartItemIndex + 1;

    const response = await fetch('/cart/change.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        line: lineNumber,
        quantity: newQuantity
      })
    });

    if (response.ok) {
      const result = await response.json();

      // Check if the item was actually updated or if it's out of stock BEFORE rendering
      if (result.items) {
        const updatedItem = result.items.find(item => item.key === itemKey);
        if (!updatedItem && newQuantity > 0) {
          // Item was removed (likely out of stock) - reload cart silently
          await loadCartCallback();
          renderCallback();
          return; // Return gracefully without showing notification
        }
      }

      // Item was successfully updated - update cart data and re-render
      await loadCartCallback(result);
      renderCallback();

      // Only show success if we're not removing the item (quantity 0)
      if (newQuantity > 0) {
        showNotification('Cart updated!', 'success');
      }
    } else {
      const error = await response.json();
      console.error('Cart update error:', error);

      await loadCartCallback();
      renderCallback();

      let errorMessage = error.description || error.message || 'Failed to update cart';

      if (error.description && error.description.includes('sold out')) {
        if (newQuantity !== 0) {
          errorMessage = 'This product is out of stock';
        }
        showNotification(errorMessage, 'error');
      } else {
        showNotification(errorMessage, 'error');
      }

      // Don't throw - handle gracefully to prevent uncaught promise rejection
      return;
    }
  } catch (error) {
    // Handle unexpected errors (network errors, JSON parsing errors, etc.)
    console.error('Error updating quantity:', error);

    // Reload cart to ensure UI is in sync
    await loadCartCallback();
    renderCallback();

    // Show generic error notification
    showNotification('Failed to update cart', 'error');

    // Don't throw error - handle gracefully to prevent uncaught promise rejection
  } finally {
    if (cartItem) {
      cartItem.classList.remove('upsellity-loading');
    }
  }
}

/**
 * Remove item from cart
 */
export async function removeItem(itemKey, loadCartCallback, renderCallback) {
  const cartItem = document.querySelector(`[data-item-key="${itemKey}"]`);
  if (cartItem) {
    cartItem.classList.add('upsellity-loading');
  }

  try {
    // First, check if this is a gift item
    const cartResponse = await fetch('/cart.js');
    if (cartResponse.ok) {
      const cart = await cartResponse.json();
      const item = cart.items.find(i => i.key === itemKey);

      if (item) {
        // Check if this is a gift item
        const isGift = item.properties && (
          item.properties['_upsellity_gift'] === 'true' ||
          item.properties['_gift'] === 'true' ||
          item.properties['_gift'] === true
        );

        if (isGift) {
          showNotification('Gift items are automatically managed and cannot be removed manually', 'info');
          await loadCartCallback();
          renderCallback();
          return;
        }
      }
    }

    const response = await fetch('/cart/change.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: itemKey,
        quantity: 0
      })
    });

    if (response.ok) {
      const result = await response.json();

      await loadCartCallback(result);
      renderCallback();

      showNotification('Item removed from cart', 'success');
    } else {
      const error = await response.json();
      showNotification(error.description || 'Failed to remove item', 'error');
    }
  } catch (error) {
    console.error('Error removing item:', error);
    showNotification('Failed to remove item', 'error');
  } finally {
    if (cartItem) {
      cartItem.classList.remove('upsellity-loading');
    }
  }
}

