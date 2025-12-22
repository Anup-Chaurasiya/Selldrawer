/**
 * Upsellity Nudge Popup - Entry Point for Build
 * This file serves as the entry point for bundling the nudge popup module
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { NudgeWidget } from '../../../../app/components/shared/NudgeWidget.tsx';
import { Analytics } from './analytics.js';

// App URL is injected at build time from config.js
const APP_URL = typeof __APP_URL__ !== 'undefined' ? __APP_URL__ : 'https://app.upsellity.com';

class NudgePopup {
  constructor() {
    this.shop = null;
    this.config = null;
    this.enabled = false;
    this.recommendations = [];
    this.currentProduct = null;
    this.selectedProduct = null;
    this.isOpen = false;
    this.originalAddToCartButton = null;
    this.originalProductVariantId = null;
    this.reactRoot = null;
    this.triggerContext = null; // 'add_to_cart' or 'checkout'

    this.init();
  }

  async init() {
    try {
      // Get shop from meta tags
      this.shop = this.getShopDomain();

      if (!this.shop) {
        console.warn('Nudge Popup: Shop not configured');
        return;
      }

      await this.loadConfig();

      if (this.enabled && this.config) {
        // Setup interceptors based on trigger point configuration
        const triggerPoint = this.config.triggerPoint || 'add_to_cart';

        if (triggerPoint === 'add_to_cart') {
          this.setupAddToCartInterceptor();
        } else if (triggerPoint === 'checkout') {
          this.setupCheckoutInterceptor();
        }
      }
    } catch (error) {
      console.error('Error initializing Nudge Popup:', error);
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

      const apiUrl = `${APP_URL}/api/nudge?shop=${encodeURIComponent(this.shop)}&productHandle=${encodeURIComponent(productHandle)}`;
      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error(`Failed to load Nudge config: ${response.status}`);
      }

      const data = await response.json();

      this.enabled = data.enabled || false;
      this.config = data.config || null;
      this.recommendations = data.recommendations || [];

    } catch (error) {
      console.error('Error loading Nudge config:', error);
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

    addToCartButtons.forEach(button => {
      button.addEventListener('click', async (e) => {
        // Only intercept if we have recommendations
        if (this.recommendations.length > 0 && this.config.showOnAddToCart) {
          e.preventDefault();
          e.stopPropagation();

          this.triggerContext = 'add_to_cart';
          this.originalAddToCartButton = button;
          this.currentProduct = await this.getCurrentProductData();

          // Capture the variant ID from the form
          const form = button.closest('form');
          if (form) {
            const formData = new FormData(form);
            const variantId = formData.get('id') || formData.get('variant_id') || form.querySelector('[name="id"]')?.value;
            if (variantId) {
              this.originalProductVariantId = variantId.toString();
            } else if (this.currentProduct && this.currentProduct.variants && this.currentProduct.variants.length > 0) {
              // Fallback to first variant if no ID in form
              this.originalProductVariantId = this.currentProduct.variants[0].id.toString();
            }
          }

          // Show popup with delay
          if (this.config.popupDelay > 0) {
            setTimeout(() => this.showPopup(), this.config.popupDelay);
          } else {
            this.showPopup();
          }
        }
      }, true);
    });
  }

  setupCheckoutInterceptor() {
    console.log('🎯 Nudge: Setting up checkout interceptor');

    // Use event delegation on document since cart drawer loads dynamically
    document.addEventListener('click', async (e) => {
      // Check if clicked element is a checkout button
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

        for (const handle of cartProductHandles) {
          const apiUrl = `${APP_URL}/api/nudge?shop=${encodeURIComponent(this.shop)}&productHandle=${encodeURIComponent(handle)}`;
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

          if (this.config.popupDelay > 0) {
            setTimeout(() => this.showPopup(), this.config.popupDelay);
          } else {
            this.showPopup();
          }
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

  showPopup() {
    if (this.isOpen) return;

    this.isOpen = true;
    this.renderPopup();
  }

  renderPopup() {
    // Create container for React component
    const container = document.createElement('div');
    container.id = 'upsellity-nudge-popup-root';
    document.body.appendChild(container);

    // Create React root and render
    this.reactRoot = createRoot(container);
    this.reactRoot.render(
      React.createElement(NudgeWidget, {
        config: this.config,
        recommendations: this.recommendations,
        isVisible: true,
        isPreview: false,
        onClose: () => this.closePopup(),
        onContinue: () => this.continueWithOriginal(),
        onSelectProduct: (product) => this.selectProduct(product),
        onSelectAll: (products) => this.selectAllProducts(products),
        onImpression: () => {
          Analytics.track({
            eventType: 'impression',
            component: 'nudge',
            value: 0
          });
        }
      })
    );
  }

  async selectProduct(product) {
    this.selectedProduct = product;

    Analytics.track({
      eventType: 'click',
      component: 'nudge',
      productId: product.id,
      variantId: product.variantId || product.id,
      value: 0
    });

    // Close popup
    this.closePopup();

    // Add selected product to cart instead of original
    try {
      const formData = {
        items: [{
          id: product.variantId || product.id,
          quantity: 1,
          properties: {
            '_upsell_source': 'nudge'
          }
        }]
      };

      const response = await fetch('/cart/add.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        Analytics.track({
          eventType: 'add_to_cart',
          component: 'nudge',
          productId: product.id,
          variantId: product.variantId || product.id,
          value: product.price
        });

        // Trigger cart update events
        document.dispatchEvent(new CustomEvent('cart:updated'));

        // Navigate based on trigger context
        if (this.triggerContext === 'checkout') {
          // Proceed to checkout after adding product
          setTimeout(() => {
            window.location.href = '/checkout';
          }, 500);
        } else {
          // Open cart drawer (default behavior for add_to_cart)
          this.openCartDrawer();
        }
      }
    } catch (error) {
      console.error('Error adding product to cart:', error);
    }
  }

  async selectAllProducts(products) {
    // Close popup
    this.closePopup();

    try {
      // First, get the current cart to find and remove the original product
      const cartResponse = await fetch('/cart.js');
      if (cartResponse.ok) {
        const cart = await cartResponse.json();

        // Find the line item with the original variant ID
        let originalLineItemKey = null;
        if (this.originalProductVariantId && cart.items) {
          // Normalize the original variant ID (remove GID prefix if present)
          const normalizedOriginalId = this.originalProductVariantId.replace('gid://shopify/ProductVariant/', '');

          const matchingItem = cart.items.find(item => {
            const itemVariantId = item.variant_id?.toString();
            // Match by numeric ID
            return itemVariantId === normalizedOriginalId || itemVariantId === this.originalProductVariantId;
          });

          if (matchingItem) {
            originalLineItemKey = matchingItem.key;
          }
        }

        // Remove original product from cart if it exists
        if (originalLineItemKey) {
          try {
            await fetch('/cart/change.js', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                updates: {
                  [originalLineItemKey]: 0
                }
              })
            });
          } catch (error) {
            console.error('Error removing original product from cart:', error);
          }
        }
      }

      // Fetch variant IDs from Shopify for each product
      const itemsToAdd = [];

      for (const product of products) {
        try {
          // Fetch product data from Shopify to get the correct variant ID
          const productResponse = await fetch(`/products/${product.handle}.js`);
          if (!productResponse.ok) {
            console.warn('Failed to fetch product:', product.handle);
            continue;
          }

          const productData = await productResponse.json();

          // Get the first available variant (or match by stored variant ID if possible)
          let variant = null;
          if (product.variantId && productData.variants) {
            // Try to find the variant by ID
            const storedVariantId = product.variantId.toString().replace('gid://shopify/ProductVariant/', '').replace(/\D/g, '');
            variant = productData.variants.find(v => {
              const vId = v.id.toString().replace('gid://shopify/ProductVariant/', '').replace(/\D/g, '');
              return vId === storedVariantId;
            });
          }

          // Fallback to first variant if not found
          if (!variant && productData.variants && productData.variants.length > 0) {
            variant = productData.variants[0];
          }

          if (!variant) {
            console.warn('No variant found for product:', product.title);
            continue;
          }

          // Extract numeric variant ID
          let variantId = variant.id;

          // Handle different formats
          if (typeof variantId === 'number') {
            itemsToAdd.push({
              id: variantId,
              quantity: 1,
              properties: {
                '_upsell_source': 'nudge'
              }
            });
          } else if (typeof variantId === 'string') {
            // Remove GID prefix if present
            if (variantId.includes('gid://shopify/ProductVariant/')) {
              variantId = variantId.replace('gid://shopify/ProductVariant/', '');
            }
            // Extract numeric part
            const numericId = parseInt(variantId.replace(/\D/g, ''), 10);
            if (isNaN(numericId)) {
              console.warn('Invalid variant ID for product:', product.title);
              continue;
            }
            itemsToAdd.push({
              id: numericId,
              quantity: 1,
              properties: {
                '_upsell_source': 'nudge'
              }
            });
          } else {
            console.warn('Unexpected variant ID type for product:', product.title);
            continue;
          }
        } catch (error) {
          console.error('Error fetching product variant for:', product.title, error);
        }
      }

      if (itemsToAdd.length === 0) {
        console.error('No valid products to add to cart');
        return;
      }

      const addResponse = await fetch('/cart/add.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: itemsToAdd
        })
      });

      if (!addResponse.ok) {
        const errorText = await addResponse.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { description: errorText };
        }
        console.error('Error adding upsell products to cart:', errorData);
        if (errorData.description) {
          alert('Error adding products: ' + errorData.description);
        }
        return;
      }

      // Track events for all added items
      products.forEach(product => {
        Analytics.track({
          eventType: 'add_to_cart',
          component: 'nudge',
          productId: product.id,
          variantId: product.variantId || product.id,
          value: product.price
        });
      });

      // Wait a moment to ensure cart is fully updated
      await new Promise(resolve => setTimeout(resolve, 150));

      // Trigger cart update events
      document.dispatchEvent(new CustomEvent('cart:updated'));

      // Navigate based on trigger context
      if (this.triggerContext === 'checkout') {
        // Proceed to checkout after adding products
        setTimeout(() => {
          window.location.href = '/checkout';
        }, 500);
      } else {
        // Open cart drawer (default behavior for add_to_cart)
        this.openCartDrawer();
      }
    } catch (error) {
      console.error('Error in selectAllProducts:', error);
    }
  }

  async continueWithOriginal() {
    // Close popup
    this.closePopup();

    // Navigate based on trigger context
    if (this.triggerContext === 'checkout') {
      // Proceed to checkout with current cart
      window.location.href = '/checkout';
    } else {
      // Add original product to cart
      if (this.originalAddToCartButton) {
        // Find the form containing the button
        const form = this.originalAddToCartButton.closest('form');
        if (form) {
          const formData = new FormData(form);

          try {
            const response = await fetch('/cart/add.js', {
              method: 'POST',
              body: formData
            });

            if (response.ok) {
              // Trigger cart update events
              document.dispatchEvent(new CustomEvent('cart:updated'));

              // Open cart drawer
              this.openCartDrawer();
            }
          } catch (error) {
            console.error('Error adding original product to cart:', error);
          }
        }
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
    const container = document.getElementById('upsellity-nudge-popup-root');
    if (container && this.reactRoot) {
      // Unmount React component
      this.reactRoot.unmount();

      // Remove container
      setTimeout(() => {
        container.remove();
      }, 300);
    }
    this.isOpen = false;
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new NudgePopup();
  });
} else {
  new NudgePopup();
}

