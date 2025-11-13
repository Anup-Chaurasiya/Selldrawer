/**
 * Cart operations module - handles adding, updating, and removing items
 */

import { showNotification } from './utils.js';

/**
 * Add product to cart by variant ID
 */
export async function addProductToCart(variantId, quantity = 1, loadCartCallback) {
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
      await addProductToCartByHandle(variantId, null, quantity, loadCartCallback);
    }
  } catch (error) {
    console.error('Error adding product to cart:', error);
    showNotification('Failed to add product to cart', 'error');
  }
}

/**
 * Add product to cart by product handle
 */
export async function addProductToCartByHandle(productHandle, variantId, quantity = 1, loadCartCallback) {
  try {
    // Check if productHandle is a numeric ID (legacy data) or a handle
    let productResponse;
    if (/^\d+$/.test(productHandle)) {
      // It's a numeric ID, try to use it directly as variant ID
      const formData = new FormData();
      formData.append('id', productHandle);
      formData.append('quantity', quantity.toString());

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
  if (newQuantity < 0) return;
  
  const cartItem = document.querySelector(`[data-item-key="${itemKey}"]`);
  if (cartItem) {
    cartItem.classList.add('upsellity-loading');
  }

  try {
    const response = await fetch('/cart/change.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: itemKey,
        quantity: newQuantity
      })
    });

    if (response.ok) {
      const result = await response.json();
      
      // Update cart data and re-render
      await loadCartCallback(result);
      renderCallback();
      
      // Check if the item was actually updated or if it's out of stock
      if (result.items) {
        const updatedItem = result.items.find(item => item.key === itemKey);
        if (!updatedItem && newQuantity > 0) {
          showNotification('This item is no longer available and has been removed from your cart', 'error');
        } else {
          showNotification('Cart updated!', 'success');
        }
      } else {
        showNotification('Cart updated!', 'success');
      }
    } else {
      const error = await response.json();
      console.error('Cart update error:', error);
      
      await loadCartCallback();
      
      if (error.description && error.description.includes('sold out')) {
        showNotification(error.description, 'error');
        if (newQuantity !== 0) {
          showNotification('This product is out of stock. Please remove it from your cart.', 'error');
        }
      } else {
        showNotification(error.description || error.message || 'Failed to update cart', 'error');
      }
    }
  } catch (error) {
    console.error('Error updating quantity:', error);
    showNotification('Failed to update cart', 'error');
    await loadCartCallback();
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

