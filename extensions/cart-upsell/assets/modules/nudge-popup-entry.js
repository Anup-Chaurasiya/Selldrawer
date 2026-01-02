/**
 * Upsellity Nudge Popup - Entry Point for Build
 * This file serves as the entry point for bundling the nudge popup module
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { NudgeWidget } from '../../../../app/components/shared/NudgeWidget.tsx';
import { Analytics } from './analytics.js';
import { cartOps } from './cart-operations-enhanced.js';
import { showNotification } from './utils.js';


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
    this.matchedProductHandle = null; // Which cart product triggered the nudge
    this.matchedCartItem = null; // The cart line item to remove
    this.isHandlingSelection = false; // Flag to prevent closePopup redirect during selection
    this.selectedProductIds = new Set(); // For checkbox mode

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

    console.log('🎯 Nudge: Setting up add-to-cart interceptor, found', addToCartButtons.length, 'buttons');
    console.log('🎯 Nudge: recommendations:', this.recommendations.length, 'showOnAddToCart:', this.config?.showOnAddToCart);

    addToCartButtons.forEach(button => {
      button.addEventListener('click', async (e) => {
        console.log('🛒 Nudge: Add to cart button clicked, recommendations:', this.recommendations.length, 'showOnAddToCart:', this.config?.showOnAddToCart);

        // Only intercept if we have recommendations
        if (this.recommendations.length > 0 && this.config.showOnAddToCart) {
          e.preventDefault();
          e.stopPropagation();

          console.log('✅ Nudge: Intercepting add-to-cart, showing popup');

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
        } else {
          console.log('⏭️ Nudge: Not intercepting add-to-cart (no recommendations or showOnAddToCart is false)');
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

        for (let i = 0; i < cartProductHandles.length; i++) {
          const handle = cartProductHandles[i];
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
    console.log('🔔 Nudge: showPopup called, isOpen:', this.isOpen);

    // Clean up any existing popup container first (in case of stale state)
    const existingContainer = document.getElementById('upsellity-nudge-popup-root');
    if (existingContainer) {
      console.log('🧹 Nudge: Cleaning up existing popup container');
      existingContainer.remove();
      if (this.reactRoot) {
        try {
          this.reactRoot.unmount();
        } catch (e) {
          // Ignore unmount errors
        }
      }
      this.isOpen = false;
    }

    if (this.isOpen) {
      console.log('⚠️ Nudge: Popup already open, skipping');
      return;
    }

    this.isOpen = true;
    this.renderPopup();
  }

  renderPopup() {
    // Clean up existing popup if re-rendering (for checkbox mode)
    const existingContainer = document.getElementById('upsellity-nudge-popup-root');
    if (existingContainer && this.reactRoot) {
      try {
        this.reactRoot.unmount();
      } catch (e) {
        // Ignore unmount errors
      }
      existingContainer.remove();
    }

    // Create container for React component
    const container = document.createElement('div');
    container.id = 'upsellity-nudge-popup-root';
    document.body.appendChild(container);

    // Prepare replacing product info for display
    let replacingProduct = null;
    if (this.triggerContext === 'checkout' && this.matchedCartItem) {
      // For checkout trigger, use the matched cart item
      replacingProduct = {
        title: this.matchedCartItem.title || this.matchedCartItem.product_title,
        imageUrl: this.matchedCartItem.image || this.matchedCartItem.featured_image?.url,
        price: this.matchedCartItem.price || this.matchedCartItem.final_price
      };
    } else if (this.triggerContext === 'add_to_cart' && this.currentProduct) {
      // For add_to_cart trigger, use the current product being added
      const variant = this.currentProduct.variants?.find(v => {
        if (!v || !v.id) return false;
        const vId = String(v.id).replace('gid://shopify/ProductVariant/', '').replace(/\D/g, '');
        const origId = this.originalProductVariantId ? String(this.originalProductVariantId).replace(/\D/g, '') : null;
        return origId && vId === origId;
      }) || this.currentProduct.variants?.[0];

      // Debug: Log the variant price to see its actual format
      console.log('🔍 Nudge: Variant price debug:', {
        variantPrice: variant?.price,
        variantPriceType: typeof variant?.price,
        currentProduct: this.currentProduct.title
      });

      // Shopify product prices can be in different formats:
      // - String with decimals: "729.95"
      // - Number with decimals: 729.95
      // - Already in cents: 72995
      // We need to handle all cases
      let priceInCents = 0;
      if (variant && variant.price) {
        const priceValue = parseFloat(variant.price);
        // If price is > 1000 and has no decimals, it's likely already in cents
        if (priceValue > 1000 && priceValue === Math.floor(priceValue)) {
          priceInCents = Math.round(priceValue / 100) * 100; // Round to nearest whole currency unit
        } else {
          // Price is in currency format, convert to cents
          priceInCents = Math.round(priceValue) * 100;
        }
      }

      console.log('💰 Nudge: Calculated price in cents:', priceInCents);

      replacingProduct = {
        title: this.currentProduct.title || '',
        imageUrl: this.currentProduct.featured_image || (this.currentProduct.images && this.currentProduct.images[0]?.src) || null,
        price: priceInCents
      };
    }

    // Get checkbox mode from config
    const checkboxMode = this.config?.checkboxMode ?? false;

    // Handle product selection - for checkbox mode, just track it without re-rendering
    // React component will handle the visual updates internally
    const handleSelectProduct = (product) => {
      if (checkboxMode) {
        // Toggle selection in our tracking set
        if (this.selectedProductIds.has(product.id)) {
          this.selectedProductIds.delete(product.id);
        } else {
          this.selectedProductIds.add(product.id);
        }
        // Don't re-render - React will handle it internally with its own state
      } else {
        // Non-checkbox mode: select product immediately
        this.selectProduct(product);
      }
    };

    // Create React root and render
    this.reactRoot = createRoot(container);
    this.reactRoot.render(
      React.createElement(NudgeWidget, {
        config: this.config,
        recommendations: this.recommendations,
        isVisible: true,
        isPreview: false,
        replacingProduct: replacingProduct,
        checkboxMode: checkboxMode,
        selectedProductIds: new Set(this.selectedProductIds),
        onClose: () => this.closePopup(),
        onContinue: () => this.continueWithOriginal(),
        onSelectProduct: handleSelectProduct,
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
    console.log(`🎯 Nudge selectProduct called:`, {
      product: product.title,
      variantId: product.variantId || product.id,
      triggerContext: this.triggerContext,
      hasMatchedCartItem: !!this.matchedCartItem
    });

    // Mark that we're in a selection flow - this prevents closePopup from redirecting
    this.isHandlingSelection = true;
    this.selectedProduct = product;

    Analytics.track({
      eventType: 'click',
      component: 'nudge',
      productId: product.id,
      variantId: product.variantId || product.id,
      value: 0
    });

    // Hide the popup visually first (but don't trigger redirect)
    this.hidePopupVisually();

    try {
      // If triggered from checkout, replace the matched product
      if (this.triggerContext === 'checkout' && this.matchedCartItem) {
        console.log(`🔄 Nudge: CHECKOUT trigger - Replacing matched product: ${this.matchedCartItem.title}`);

        // Prepare new item to add
        const newItem = {
          id: cartOps.normalizeVariantId(product.variantId || product.id),
          quantity: 1,
          properties: {
            '_upsell_source': 'nudge'
          }
        };

        // Replace cart item (remove old, add new)
        const result = await cartOps.replaceCartItem(
          this.matchedCartItem.key,
          [newItem]
        );

        if (!result.success) {
          throw new Error(result.error || 'Failed to replace product');
        }

        // Track success
        Analytics.track({
          eventType: 'add_to_cart',
          component: 'nudge',
          productId: product.id,
          variantId: product.variantId || product.id,
          value: product.price
        });

        // Wait for cart to be ready
        await cartOps.waitForCartReady();

        // Verify the new product is in cart
        const verified = await cartOps.verifyProductInCart(product.variantId || product.id);
        if (!verified) {
          console.warn('⚠️ Nudge: Product not verified in cart, but proceeding to checkout');
        }

        // Trigger cart update event
        cartOps.triggerCartUpdated();

        // Clean up popup completely
        this.cleanupPopup();

        // Proceed to checkout after verification
        const checkoutUrl = cartOps.getCheckoutUrl();
        console.log(`✅ Nudge: Redirecting to checkout: ${checkoutUrl}`);
        window.location.href = checkoutUrl;
      } else {
        // Add to cart trigger - just add the selected product (do NOT replace)
        console.log(`➕ Nudge: ADD_TO_CART trigger - Adding selected product to cart`);

        const newItem = {
          id: cartOps.normalizeVariantId(product.variantId || product.id),
          quantity: 1,
          properties: {
            '_upsell_source': 'nudge'
          }
        };

        const result = await cartOps.addToCart([newItem], { verify: true });

        if (!result.success) {
          throw new Error(result.error || 'Failed to add product');
        }

        console.log(`✅ Nudge: Product added successfully to cart`);

        Analytics.track({
          eventType: 'add_to_cart',
          component: 'nudge',
          productId: product.id,
          variantId: product.variantId || product.id,
          value: product.price
        });

        // Trigger cart update events
        cartOps.triggerCartUpdated();

        // Clean up popup completely
        this.cleanupPopup();

        // Open cart drawer
        console.log(`📂 Nudge: Opening cart drawer`);
        this.openCartDrawer();
      }
    } catch (error) {
      console.error('❌ Nudge: Error in selectProduct:', error);

      // Save trigger context before cleanup (cleanup resets it)
      const shouldRedirectToCheckout = this.triggerContext === 'checkout';

      // Clean up popup
      this.cleanupPopup();

      showNotification(
        error.message || 'Failed to update cart. Please try again.',
        'error',
        5000
      );

      // If checkout trigger, still try to proceed
      if (shouldRedirectToCheckout) {
        const checkoutUrl = cartOps.getCheckoutUrl();
        console.log(`🔄 Nudge: Error occurred, but redirecting to checkout anyway: ${checkoutUrl}`);
        setTimeout(() => {
          window.location.href = checkoutUrl;
        }, 1000);
      }
    }
  }

  async selectAllProducts(products) {
    console.log(`🎯 Nudge selectAllProducts called:`, {
      productCount: products.length,
      triggerContext: this.triggerContext,
      hasMatchedCartItem: !!this.matchedCartItem
    });

    // Mark that we're in a selection flow - this prevents closePopup from redirecting
    this.isHandlingSelection = true;
    this.selectedProduct = products[0]; // Mark as selected

    // Hide the popup visually first (but don't trigger redirect)
    this.hidePopupVisually();

    try {
      let originalKey = null;

      // Step 1: Remove the original/matched product
      if (this.triggerContext === 'checkout' && this.matchedCartItem) {
        console.log(`🗑️ Removing matched product: ${this.matchedCartItem.title}`);
        originalKey = this.matchedCartItem.key;
      } else if (this.originalProductVariantId) {
        // For add_to_cart trigger, find and remove original product
        const cartItem = await cartOps.findCartItem(this.originalProductVariantId);
        if (cartItem) {
          originalKey = cartItem.key;
        }
      }

      // Remove original product if found
      if (originalKey) {
        const removeResult = await cartOps.removeFromCart(originalKey, { verify: true });
        if (!removeResult.success) {
          console.warn('Failed to remove original product:', removeResult.error);
        }
      }

      // Step 2: Fetch all product variants and prepare items to add
      const itemsToAdd = [];
      const failedProducts = [];

      for (const product of products) {
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
              '_upsell_source': 'nudge'
            }
          });
        } catch (error) {
          console.error(`Error processing product ${product.title}:`, error);
          failedProducts.push(product.title);
        }
      }

      // Step 3: Add all products to cart
      if (itemsToAdd.length === 0) {
        throw new Error('No valid products to add to cart');
      }

      const addResult = await cartOps.addToCart(itemsToAdd, { verify: true });
      if (!addResult.success) {
        throw new Error(addResult.error || 'Failed to add products to cart');
      }

      console.log(`✅ Nudge: ${itemsToAdd.length} products added successfully to cart`);

      // Track analytics for successfully added products
      products.forEach((product, index) => {
        if (index < itemsToAdd.length) {
          Analytics.track({
            eventType: 'add_to_cart',
            component: 'nudge',
            productId: product.id,
            variantId: product.variantId || product.id,
            value: product.price
          });
        }
      });

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

      // Save trigger context before cleanup (cleanup resets it)
      const shouldRedirectToCheckout = this.triggerContext === 'checkout';

      // Clean up popup completely
      this.cleanupPopup();

      // Navigate based on trigger context
      if (shouldRedirectToCheckout) {
        const checkoutUrl = cartOps.getCheckoutUrl();
        console.log(`✅ Nudge: Redirecting to checkout: ${checkoutUrl}`);
        window.location.href = checkoutUrl;
      } else {
        // Open cart drawer
        console.log(`📂 Nudge: Opening cart drawer`);
        this.openCartDrawer();
      }
    } catch (error) {
      console.error('❌ Nudge: Error in selectAllProducts:', error);

      // Save trigger context before cleanup (cleanup resets it)
      const shouldRedirectToCheckout = this.triggerContext === 'checkout';

      // Clean up popup
      this.cleanupPopup();

      showNotification(
        error.message || 'Failed to update cart. Please try again.',
        'error',
        5000
      );

      // If checkout trigger, still try to proceed
      if (shouldRedirectToCheckout) {
        const checkoutUrl = cartOps.getCheckoutUrl();
        console.log(`🔄 Nudge: Error occurred, but redirecting to checkout anyway: ${checkoutUrl}`);
        setTimeout(() => {
          window.location.href = checkoutUrl;
        }, 1000);
      }
    }
  }

  async continueWithOriginal() {
    // Close popup
    this.closePopup();

    // Navigate based on trigger context
    if (this.triggerContext === 'checkout') {
      // Proceed to checkout with current cart
      console.log('📋 Continuing with original cart to checkout');
      setTimeout(() => {
        window.location.href = cartOps.getCheckoutUrl();
      }, 200);
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
              cartOps.triggerCartUpdated();

              // Open cart drawer
              this.openCartDrawer();
            } else {
              throw new Error('Failed to add original product');
            }
          } catch (error) {
            console.error('Error adding original product to cart:', error);
            showNotification(
              'Failed to add product to cart. Please try again.',
              'error',
              5000
            );
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

  /**
   * Hide popup visually without triggering redirect logic
   * Used during selection flow before cart operations complete
   */
  hidePopupVisually() {
    const container = document.getElementById('upsellity-nudge-popup-root');
    if (container) {
      container.style.opacity = '0';
      container.style.pointerEvents = 'none';
    }
  }

  /**
   * Clean up popup completely without triggering redirect
   * Used after selection flow cart operations complete  
   */
  cleanupPopup() {
    const container = document.getElementById('upsellity-nudge-popup-root');
    if (container && this.reactRoot) {
      this.reactRoot.unmount();
      container.remove();
    }
    // Reset all state so popup can show again
    this.isOpen = false;
    this.isHandlingSelection = false;
    this.selectedProduct = null;
    this.triggerContext = null;
    this.matchedCartItem = null;
    this.selectedProductIds.clear(); // Reset checkbox selections
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

    // Only redirect to checkout if:
    // 1. Triggered from checkout context
    // 2. User did NOT select a product (closePopup called directly, not via selection flow)
    // 3. We're not currently in the middle of handling a selection
    // Note: selectProduct() and selectAllProducts() handle their own redirects via cleanupPopup()
    if (this.isHandlingSelection) {
      console.log('✅ Nudge: Popup closed during selection flow (redirect handled by selection method)');
      return; // Don't redirect, let the selection method handle it
    }

    if (this.triggerContext === 'checkout' && !this.selectedProduct) {
      console.log('🚪 Nudge: Popup closed without selection, redirecting to checkout with current cart');
      const checkoutUrl = cartOps.getCheckoutUrl();
      setTimeout(() => {
        window.location.href = checkoutUrl;
      }, 350);
    } else if (this.selectedProduct) {
      console.log('✅ Nudge: Popup closed after product selection (redirect handled by selectProduct)');
    } else {
      console.log('✅ Nudge: Popup closed (add_to_cart context, no redirect needed)');
    }

    // Reset state so popup can show again (only if not redirecting to checkout)
    if (!(this.triggerContext === 'checkout' && !this.selectedProduct)) {
      this.selectedProduct = null;
      this.triggerContext = null;
      this.matchedCartItem = null;
    }
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

