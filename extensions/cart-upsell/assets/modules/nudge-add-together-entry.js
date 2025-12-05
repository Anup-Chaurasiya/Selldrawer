/**
 * Upsellity Nudge Add Together - Entry Point for Build
 * This file serves as the entry point for bundling the nudge add together module
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { NudgeAddTogetherWidgetWrapper } from './components/NudgeAddTogetherWidgetWrapper.jsx';
import { Analytics } from './analytics.js';

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
      
      console.log('Nudge Add Together: Config loaded', {
        enabled: this.enabled,
        hasConfig: !!this.config,
        recommendationsCount: this.recommendations.length,
        showOnAddToCart: this.config?.showOnAddToCart
      });
      
      if (this.enabled && this.config && this.config.showOnAddToCart) {
        // Setup interceptor after a small delay
        setTimeout(() => this.setupAddToCartInterceptor(), 200);
      } else {
        console.log('Nudge Add Together: Not enabled or no config', {
          enabled: this.enabled,
          hasConfig: !!this.config,
          showOnAddToCart: this.config?.showOnAddToCart
        });
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
        console.log('Nudge Add Together: No product handle found');
        return;
      }

      console.log('Nudge Add Together: Loading config for product:', productHandle);

      // Initialize Analytics with the app URL
      Analytics.init(APP_URL);

      const apiUrl = `${APP_URL}/api/nudge-add-together?shop=${encodeURIComponent(this.shop)}&productHandle=${encodeURIComponent(productHandle)}`;
      console.log('Nudge Add Together: Fetching config from:', apiUrl);
      
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
      
      console.log('Nudge Add Together: Config received:', {
        enabled: data.enabled,
        hasConfig: !!data.config,
        recommendationsCount: data.recommendations?.length || 0
      });
      
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
    
    console.log('Nudge Add Together: Setting up interceptor, found buttons:', addToCartButtons.length);
    
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
        console.log('Nudge Add Together: Add to cart clicked', {
          recommendationsCount: this.recommendations.length,
          showOnAddToCart: this.config?.showOnAddToCart,
          enabled: this.enabled
        });
        
        // Only intercept if we have recommendations
        if (this.recommendations.length > 0 && this.config && this.config.showOnAddToCart && this.enabled) {
          e.preventDefault();
          e.stopPropagation();
          
          console.log('Nudge Add Together: Intercepting add to cart');
          
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
            await this.addOriginalProductToCart(form);
            
            console.log('Nudge Add Together: Showing popup');
            
            // THEN: Show popup with delay (cart drawer will already be open)
            if (this.config.popupDelay > 0) {
              setTimeout(() => this.showPopup(), this.config.popupDelay);
            } else {
              // Small delay to ensure cart drawer opens first, then popup appears on top
              setTimeout(() => this.showPopup(), 300);
            }
          } catch (error) {
            console.error('Nudge Add Together: Failed to add original product, not showing popup');
            // If adding to cart fails, don't show popup
          }
        } else {
          console.log('Nudge Add Together: Not intercepting', {
            hasRecommendations: this.recommendations.length > 0,
            hasConfig: !!this.config,
            showOnAddToCart: this.config?.showOnAddToCart,
            enabled: this.enabled
          });
        }
      }, true);
    });
    
    console.log('Nudge Add Together: Interceptor setup complete');
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
        console.warn('Nudge Add Together: No form found to add original product');
        return;
      }

      const formData = new FormData(form);
      
      const response = await fetch('/cart/add.js', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        console.log('Nudge Add Together: Original product added to cart');
        
        // Trigger cart update events
        document.dispatchEvent(new CustomEvent('cart:updated'));
        
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
      } else {
        const errorText = await response.text();
        console.error('Nudge Add Together: Failed to add original product to cart:', errorText);
        throw new Error('Failed to add product to cart');
      }
    } catch (error) {
      console.error('Nudge Add Together: Error adding original product to cart:', error);
      throw error;
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

      // NOTE: Original product is already in cart (added immediately when "Add to Cart" was clicked)
      // So we only add the selected popup products here

      // Add selected popup products
      for (const product of selectedProducts) {
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
          
          // Extract numeric variant ID - ensure it's a string first
          let variantId = String(variant.id || '');
          
          if (!variantId) {
            console.warn('No variant ID found for product:', product.title);
            continue;
          }
          
          // Remove GID prefix if present
          if (variantId.includes('gid://shopify/ProductVariant/')) {
            variantId = variantId.replace('gid://shopify/ProductVariant/', '');
          }
          
          // Extract numeric part
          const numericId = parseInt(variantId.replace(/\D/g, ''), 10);
          if (isNaN(numericId) || numericId <= 0) {
            console.warn('Invalid variant ID for product:', product.title, 'Original ID:', variant.id);
            continue;
          }
          
          itemsToAdd.push({
            id: numericId,
            quantity: 1,
            properties: {
              '_upsell_source': 'nudge-add-together'
            }
          });
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
        console.error('Error adding products to cart:', errorData);
        if (errorData.description) {
          alert('Error adding products: ' + errorData.description);
        }
        return;
      }

      // Track events for selected products (original already tracked)
      selectedProducts.forEach(product => {
        Analytics.track({
          eventType: 'add_to_cart',
          component: 'nudge-add-together',
          productId: product.id,
          variantId: product.variantId || product.id,
          value: product.price
        });
      });
      
      // Wait a moment to ensure cart is fully updated
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Trigger cart update events
      document.dispatchEvent(new CustomEvent('cart:updated'));
      
      // Try to open cart drawer
      this.openCartDrawer();
    } catch (error) {
      console.error('Error in addSelectedProducts:', error);
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
  }
}

// Initialize when DOM is ready
(function() {
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

