/**
 * Upsellity Nudge Add Together - Entry Point for Build
 * This file serves as the entry point for bundling the nudge add together module
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { NudgeAddTogetherWidgetWrapper } from './components/NudgeAddTogetherWidgetWrapper.jsx';
import { Analytics } from './analytics.js';
import { cartOps } from './cart-operations-enhanced.js';
import { showNotification } from './utils.js';


// App URL is injected at build time from config.js
const APP_URL = typeof __APP_URL__ !== 'undefined' ? __APP_URL__ : 'https://app.upsellity.com';

class NudgeAddTogether {
  constructor() {
    this.shop = null;
    this.config = null;
    this.enabled = false;
    this.recommendations = [];
    this.currentProduct = null;
    this.originalProduct = null;
    this.isOpen = false;
    this.originalAddToCartButton = null;
    this.originalProductVariantId = null;
    this.originalProductData = null;
    this.reactRoot = null;
    this.triggerContext = null; // 'add_to_cart' or 'checkout'
    this.matchedProductHandle = null; // Which cart product triggered the nudge
    this.matchedCartItem = null; // The cart line item info

    this.init();
  }

  async init() {
    try {
      // Wait for DOM to be ready
      if (document.readyState === 'loading') {
        await new Promise(resolve => {
          document.addEventListener('DOMContentLoaded', resolve);
        });
      }

      // Small delay to ensure everything is loaded
      await new Promise(resolve => setTimeout(resolve, 100));

      // Get shop from meta tags
      this.shop = this.getShopDomain();

      if (!this.shop) {
        console.warn('Nudge Add Together: Shop not configured');
        return;
      }

      await this.loadConfig();

      if (this.enabled && this.config) {
        // Setup interceptors based on trigger point configuration
        const triggerPoint = this.config.triggerPoint || 'add_to_cart';

        if (triggerPoint === 'add_to_cart') {
          setTimeout(() => this.setupAddToCartInterceptor(), 200);
        } else if (triggerPoint === 'checkout') {
          this.setupCheckoutInterceptor();
        }
      }
    } catch (error) {
      console.error('Error initializing Nudge Add Together:', error);
    }
  }

  getShopDomain() {
    // Try to get from Shopify.shop
    if (typeof Shopify !== 'undefined' && Shopify.shop) {
      return Shopify.shop;
    }

    // Try to get from meta tag
    const metaTag = document.querySelector('meta[name="shopify-shop"]');
    if (metaTag) {
      return metaTag.content;
    }

    return null;
  }

  async loadConfig() {
    try {
      const productHandle = this.getCurrentProductHandle();
      if (!productHandle) {
        return;
      }

      // Initialize Analytics with the app URL
      Analytics.init(APP_URL);

      const apiUrl = `${APP_URL}/api/nudge-add-together?shop=${encodeURIComponent(this.shop)}&productHandle=${encodeURIComponent(productHandle)}`;

      let response;
      try {
        response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          mode: 'cors',
          credentials: 'omit'
        });
      } catch (fetchError) {
        console.error('Nudge Add Together: Fetch error (network/CORS):', fetchError);
        console.error('Nudge Add Together: Check if APP_URL is correct:', APP_URL);
        this.enabled = false;
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Nudge Add Together: Failed to load config: ${response.status}`, errorText);
        this.enabled = false;
        return;
      }

      const data = await response.json();

      this.enabled = data.enabled || false;
      this.config = data.config || null;
      this.recommendations = data.recommendations || [];

    } catch (error) {
      console.error('Error loading Nudge Add Together config:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        APP_URL: APP_URL
      });
      this.enabled = false;
    }
  }

  getCurrentProductHandle() {
    // Try to get from URL
    const path = window.location.pathname;
    const match = path.match(/\/products\/([^/?]+)/);
    if (match) {
      return match[1];
    }

    // Try to get from meta tag
    const metaTag = document.querySelector('meta[property="og:url"]');
    if (metaTag) {
      const urlMatch = metaTag.content.match(/\/products\/([^/?]+)/);
      if (urlMatch) {
        return urlMatch[1];
      }
    }

    return null;
  }

  setupAddToCartInterceptor() {
    // Intercept all "Add to Cart" buttons
    const addToCartButtons = document.querySelectorAll('[name="add"], [data-add-to-cart], button[type="submit"][name="add"], form[action*="/cart/add"] button[type="submit"]');

    if (addToCartButtons.length === 0) {
      console.warn('Nudge Add Together: No add to cart buttons found. Retrying in 500ms...');
      setTimeout(() => this.setupAddToCartInterceptor(), 500);
      return;
    }

    addToCartButtons.forEach((button, index) => {
      // Check if already has our listener
      if (button.dataset.nudgeAddTogetherListener === 'true') {
        return;
      }
      button.dataset.nudgeAddTogetherListener = 'true';

      button.addEventListener('click', async (e) => {
        // Only intercept if we have recommendations
        if (this.recommendations.length > 0 && this.config && this.config.showOnAddToCart && this.enabled) {
          e.preventDefault();
          e.stopPropagation();

          this.originalAddToCartButton = button;
          this.currentProduct = await this.getCurrentProductData();

          // Capture the variant ID from the form
          const form = button.closest('form');
          if (form) {
            const formData = new FormData(form);
            const variantId = formData.get('id') || formData.get('variant_id') || form.querySelector('[name="id"]')?.value;
            if (variantId) {
              this.originalProductVariantId = String(variantId);
            } else if (this.currentProduct && this.currentProduct.variants && this.currentProduct.variants.length > 0) {
              // Fallback to first variant if no ID in form
              const firstVariantId = this.currentProduct.variants[0].id;
              this.originalProductVariantId = firstVariantId ? String(firstVariantId) : null;
            }
          }

          // Prepare original product data for display
          if (this.currentProduct) {
            // Normalize the original variant ID for comparison
            let normalizedOriginalId = null;
            if (this.originalProductVariantId) {
              const originalIdStr = String(this.originalProductVariantId);
              normalizedOriginalId = originalIdStr.replace('gid://shopify/ProductVariant/', '').replace(/\D/g, '');
            }

            const variant = this.currentProduct.variants?.find(v => {
              if (!v || !v.id) return false;
              const vIdStr = String(v.id);
              const vId = vIdStr.replace('gid://shopify/ProductVariant/', '').replace(/\D/g, '');
              return normalizedOriginalId && vId === normalizedOriginalId;
            }) || this.currentProduct.variants?.[0];

            if (variant && variant.id) {
              const variantIdStr = String(variant.id);
              const productIdStr = this.currentProduct.id ? String(this.currentProduct.id) : '';

              this.originalProduct = {
                id: productIdStr.replace('gid://shopify/Product/', '').replace(/\D/g, '') || this.getCurrentProductHandle(),
                variantId: variantIdStr.replace('gid://shopify/ProductVariant/', '').replace(/\D/g, ''),
                title: this.currentProduct.title || '',
                handle: this.currentProduct.handle || '',
                price: variant.price ? parseFloat(variant.price) : 0,
                compareAtPrice: variant.compare_at_price ? parseFloat(variant.compare_at_price) : null,
                imageUrl: this.currentProduct.featured_image || (this.currentProduct.images && this.currentProduct.images[0]?.src) || null,
                description: this.currentProduct.description || null
              };
            }
          }

          // FIRST: Add original product to cart immediately
          try {
            const result = await this.addOriginalProductToCart(form);

            if (!result.success) {
              console.error('Failed to add original product:', result.error);
              showNotification(
                result.error || 'Failed to add product to cart. Please try again.',
                'error',
                5000
              );
              return; // Don't show popup if add to cart failed
            }

            // THEN: Show popup with delay (cart drawer will already be open)
            if (this.config.popupDelay > 0) {
              setTimeout(() => this.showPopup(), this.config.popupDelay);
            } else {
              // Small delay to ensure cart drawer opens first, then popup appears on top
              setTimeout(() => this.showPopup(), 300);
            }
          } catch (error) {
            console.error('Nudge Add Together: Error in add to cart flow:', error);
            showNotification(
              'Failed to add product to cart. Please try again.',
              'error',
              5000
            );
          }
        }
      }, true);
    });
  }

  setupCheckoutInterceptor() {
    console.log('🎯 Nudge Add Together: Setting up checkout interceptor');

    // Use event delegation on document since cart drawer loads dynamically
    document.addEventListener('click', async (e) => {
      const target = e.target;
      const isCheckoutButton =
        target.classList?.contains('upsellity-checkout-btn') ||
        target.getAttribute('name') === 'checkout' ||
        target.textContent?.trim().toLowerCase() === 'checkout' ||
        target.closest('button')?.textContent?.trim().toLowerCase() === 'checkout';

      if (!isCheckoutButton) return;

      console.log('🛒 Checkout button clicked, checking cart...');

      try {
        e.preventDefault();
        e.stopPropagation();

        // Fetch current cart to check products
        const cartResponse = await fetch('/cart.js');
        if (!cartResponse.ok) {
          console.warn('Failed to fetch cart for checkout trigger');
          window.location.href = '/checkout';
          return;
        }

        const cart = await cartResponse.json();
        console.log('📦 Cart contents:', cart);

        // Get product handles from cart items
        const cartProductHandles = cart.items.map(item => {
          if (item.handle) {
            return item.handle;
          }
          if (item.url) {
            const urlParts = item.url.split('/');
            const productsIndex = urlParts.indexOf('products');
            if (productsIndex !== -1 && urlParts[productsIndex + 1]) {
              return urlParts[productsIndex + 1].split('?')[0];
            }
          }
          return null;
        }).filter(Boolean);

        console.log('🔍 Cart product handles:', cartProductHandles);

        if (cartProductHandles.length === 0) {
          console.log('No valid product handles, proceeding to checkout');
          window.location.href = '/checkout';
          return;
        }

        // Check if any cart product has nudge recommendations
        let hasRecommendations = false;

        for (let i = 0; i < cartProductHandles.length; i++) {
          const handle = cartProductHandles[i];
          const apiUrl = `${APP_URL}/api/nudge-add-together?shop=${encodeURIComponent(this.shop)}&productHandle=${encodeURIComponent(handle)}`;
          console.log(`🔎 Checking nudge for product: ${handle}`);

          try {
            const response = await fetch(apiUrl);
            if (response.ok) {
              const data = await response.json();
              console.log(`📊 Nudge data for ${handle}:`, data);

              if (data.enabled && data.recommendations && data.recommendations.length > 0) {
                console.log(`✅ Found recommendations for ${handle}!`);
                this.recommendations = data.recommendations;
                this.config = data.config;
                this.matchedProductHandle = handle;

                // Find and save the cart item that matched
                this.matchedCartItem = cart.items.find(item => {
                  const itemHandle = item.handle ||
                    (item.url ? item.url.split('/products/')[1]?.split('?')[0] : null);
                  return itemHandle === handle;
                });

                console.log('📌 Matched cart item:', this.matchedCartItem);
                hasRecommendations = true;
                break;
              }
            }
          } catch (error) {
            console.warn(`Failed to fetch nudge for product ${handle}:`, error);
          }
        }

        if (hasRecommendations && this.recommendations.length > 0) {
          console.log('🎉 Showing nudge popup');
          this.triggerContext = 'checkout';

          this.showPopup();
        } else {
          console.log('❌ No nudge rules match cart products, proceeding to checkout');
          window.location.href = '/checkout';
        }
      } catch (error) {
        console.error('Error in checkout interceptor:', error);
        window.location.href = '/checkout';
      }
    }, true);
  }

  async getCurrentProductData() {
    try {
      const productHandle = this.getCurrentProductHandle();
      if (!productHandle) return null;

      const response = await fetch(`/products/${productHandle}.js`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Error loading current product:', error);
    }
    return null;
  }

  async addOriginalProductToCart(form) {
    try {
      if (!form) {
        throw new Error('No form found to add original product');
      }

      const formData = new FormData(form);

      const response = await fetch('/cart/add.js', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to add original product to cart:', errorText);
        throw new Error('Failed to add product to cart');
      }

      // Wait for cart to update
      await new Promise(resolve => setTimeout(resolve, 150));

      // Verify product was added
      if (this.originalProductVariantId) {
        const verified = await cartOps.verifyProductInCart(this.originalProductVariantId);
        if (!verified) {
          console.warn('Original product not verified in cart');
        }
      }

      // Trigger cart update events
      cartOps.triggerCartUpdated();

      // Track analytics
      if (this.originalProduct) {
        Analytics.track({
          eventType: 'add_to_cart',
          component: 'nudge-add-together',
          productId: this.originalProduct.id,
          variantId: this.originalProduct.variantId,
          value: this.originalProduct.price
        });
      }

      // Open cart drawer after a small delay to ensure cart is updated
      setTimeout(() => {
        this.openCartDrawer();
      }, 100);

      return { success: true };
    } catch (error) {
      console.error('Error adding original product to cart:', error);
      return { success: false, error: error.message };
    }
  }

  showPopup() {
    if (this.isOpen) return;

    this.isOpen = true;
    this.renderPopup();
  }

  renderPopup() {
    // Create container for React component
    const container = document.createElement('div');
    container.id = 'upsellity-nudge-add-together-root';
    document.body.appendChild(container);

    // Create React root and render
    this.reactRoot = createRoot(container);
    this.reactRoot.render(
      React.createElement(NudgeAddTogetherWidgetWrapper, {
        config: this.config,
        recommendations: this.recommendations,
        originalProduct: this.originalProduct,
        isVisible: true,
        onClose: () => this.closePopup(),
        onAddSelected: (selectedProducts) => this.addSelectedProducts(selectedProducts)
      })
    );
  }

  async addSelectedProducts(selectedProducts) {
    // Close popup
    this.closePopup();

    try {
      const itemsToAdd = [];
      const failedProducts = [];

      // NOTE: Original product is already in cart (added immediately when "Add to Cart" was clicked)
      // So we only add the selected popup products here

      // Fetch each product and prepare items
      for (const product of selectedProducts) {
        try {
          // Fetch fresh product data
          const productData = await cartOps.fetchProductData(product.handle);
          if (!productData) {
            console.warn(`Failed to fetch product: ${product.handle}`);
            failedProducts.push(product.title);
            continue;
          }

          // Get the correct variant
          const variant = cartOps.getVariantFromProduct(productData, product.variantId);
          if (!variant) {
            console.warn(`No variant found for product: ${product.title}`);
            failedProducts.push(product.title);
            continue;
          }

          // Validate variant ID
          if (!cartOps.isValidVariantId(variant.id)) {
            console.warn(`Invalid variant ID for product: ${product.title}`);
            failedProducts.push(product.title);
            continue;
          }

          const normalizedId = parseInt(cartOps.normalizeVariantId(variant.id), 10);
          itemsToAdd.push({
            id: normalizedId,
            quantity: 1,
            properties: {
              '_upsell_source': 'nudge-add-together'
            }
          });
        } catch (error) {
          console.error(`Error processing product ${product.title}:`, error);
          failedProducts.push(product.title);
        }
      }

      // Add selected products to cart if any are valid
      if (itemsToAdd.length === 0) {
        console.warn('No valid products to add to cart');
        // Still trigger update and navigate
      } else {
        const addResult = await cartOps.addToCart(itemsToAdd, { verify: true });
        if (!addResult.success) {
          throw new Error(addResult.error || 'Failed to add selected products to cart');
        }

        // Track analytics for successfully added products
        selectedProducts.forEach((product, index) => {
          if (index < itemsToAdd.length) {
            Analytics.track({
              eventType: 'add_to_cart',
              component: 'nudge-add-together',
              productId: product.id,
              variantId: product.variantId || product.id,
              value: product.price
            });
          }
        });
      }

      // Notify user if some products failed
      if (failedProducts.length > 0) {
        showNotification(
          `Some products could not be added: ${failedProducts.join(', ')}`,
          'error',
          5000
        );
      }

      // Wait for cart to be ready
      await cartOps.waitForCartReady();

      // Trigger cart update event
      cartOps.triggerCartUpdated();

      // Navigate based on trigger context
      if (this.triggerContext === 'checkout') {
        console.log('✅ Redirecting to checkout with added products');
        setTimeout(() => {
          window.location.href = cartOps.getCheckoutUrl();
        }, 200);
      } else {
        // Open cart drawer (default behavior for add_to_cart)
        this.openCartDrawer();
      }
    } catch (error) {
      console.error('Error in addSelectedProducts:', error);
      showNotification(
        error.message || 'Failed to update cart. Please try again.',
        'error',
        5000
      );

      // If checkout trigger, still try to proceed
      if (this.triggerContext === 'checkout') {
        setTimeout(() => {
          window.location.href = cartOps.getCheckoutUrl();
        }, 1000);
      }
    }
  }

  openCartDrawer() {
    setTimeout(() => {
      // Try multiple selectors that different themes might use
      const cartDrawerToggle = document.querySelector('[data-cart-drawer-toggle]') ||
        document.querySelector('.cart-drawer-toggle') ||
        document.querySelector('[aria-controls*="cart"]') ||
        document.querySelector('[data-drawer-toggle="cart"]') ||
        document.querySelector('.js-cart-drawer-toggle') ||
        document.querySelector('#cart-icon-bubble') ||
        document.querySelector('.cart-count-bubble');

      if (cartDrawerToggle) {
        cartDrawerToggle.click();
      } else {
        // If no toggle found, trigger cart update event
        const cartUpdateEvent = new CustomEvent('cart:updated', { bubbles: true });
        document.dispatchEvent(cartUpdateEvent);
      }
    }, 200);
  }

  closePopup() {
    const container = document.getElementById('upsellity-nudge-add-together-root');
    if (container && this.reactRoot) {
      // Unmount React component
      this.reactRoot.unmount();

      // Remove container
      setTimeout(() => {
        container.remove();
      }, 300);
    }
    this.isOpen = false;

    // If triggered from checkout and user closes popup, proceed to checkout with current cart
    if (this.triggerContext === 'checkout') {
      console.log('🚪 Popup closed, redirecting to checkout with current cart');
      setTimeout(() => {
        window.location.href = cartOps.getCheckoutUrl();
      }, 350);
    }
  }
}

// Initialize when DOM is ready
(function () {
  function initNudgeAddTogether() {
    try {
      // Small delay to ensure page is fully loaded
      setTimeout(() => {
        new NudgeAddTogether();
      }, 200);
    } catch (error) {
      console.error('Failed to initialize Nudge Add Together:', error);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNudgeAddTogether);
  } else {
    initNudgeAddTogether();
  }
})();

