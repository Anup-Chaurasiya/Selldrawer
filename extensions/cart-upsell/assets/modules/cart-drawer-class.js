/**
 * Main UpsellityCartDrawer Class
 */

import { FEATURE_ORDER_SENTINEL } from './constants.js';
import { splitFeatureOrder, showNotification } from './utils.js';
import * as CartOps from './cart-operations.js';
import * as DiscountManager from './discount-manager.js';
import * as ProductLoader from './product-loader.js';
import * as AutoApplyStorage from './auto-apply-storage.js';
import { renderFreeShippingBar } from './renderers/free-shipping-bar.js';
import { renderPromotionalBanner } from './renderers/promotional-banner.js';
import { renderCartItems } from './renderers/cart-items.js';
import { renderProductRecommendations } from './renderers/product-recommendations.js';
import { renderSavingsDisplay } from './renderers/savings-display.js';
import { renderFreeShippingMessage } from './renderers/free-shipping-message.js';
import { renderCouponCodeField } from './renderers/coupon-code-field.js';
import { renderCartTotals } from './renderers/cart-totals.js';

export class UpsellityCartDrawer {
  constructor() {
    this.shop = window.Shopify?.shop || null;
    this.config = null;
    this.isOpen = false;
    this.cart = null;
    this.appliedDiscount = null;
    this.availableDiscounts = [];
    this.showingAllOffers = false;
    this.productCompareAtPrices = {};
    this.reactRoots = {}; // Store React roots to avoid recreating them
    this.isInitialRender = true;
    this.cartJustUpdated = false; // Track if cart was just updated via add to cart
    
    this.init();
  }

  async init() {
    if (!this.shop) {
      console.error('Upsellity: Shop not detected');
      return;
    }

    this.createDrawer();
    await this.loadConfig();
    this.interceptAddToCart();
    this.attachCartTriggers();
    await this.loadCart();
  }

  async loadConfig() {
    try {
      const appUrl = document.querySelector('[data-upsellity-app-url]')?.dataset.upsellityAppUrl;
      if (!appUrl) {
        console.warn('Upsellity: App URL not configured');
        this.config = { enabled: false, features: {} };
        return;
      }

      const timestamp = new Date().getTime();
      const response = await fetch(`${appUrl}/api/cart-drawer?shop=${this.shop}&_t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      this.config = await response.json();
    } catch (error) {
      console.error('Upsellity: Failed to load config', error);
      this.config = { enabled: false, features: {} };
    }
  }

  async loadCart(cartData = null, skipRender = false) {
    try {
      if (cartData) {
        this.cart = cartData;
      } else {
        const response = await fetch('/cart.js');
        this.cart = await response.json();
      }
      
      this.productCompareAtPrices = await ProductLoader.loadProductCompareAtPrices(this.cart);
      
      this.availableDiscounts = await DiscountManager.loadAvailableDiscounts(this.shop, this.config);
      
      // Auto-apply best discount only if user hasn't removed it recently
      if (this.config?.features?.couponCodeField?.enableAutoApply && 
          !this.appliedDiscount && 
          this.availableDiscounts.length > 0 &&
          !AutoApplyStorage.wasDiscountRemoved()) {
        this.appliedDiscount = DiscountManager.autoApplyBestDiscount(this.availableDiscounts, this.cart, this.config);
      }
      
      await ProductLoader.loadShopifyRecommendations(this.cart, this.config);
      
      if (!skipRender) {
        this.render();
      }
    } catch (error) {
      console.error('Upsellity: Failed to load cart', error);
      this.cart = {
        item_count: 0,
        total_price: 0,
        items: []
      };
      if (!skipRender) {
        this.render();
      }
    }
  }

  interceptAddToCart() {
    // Track if we're already handling an add to cart to prevent double-opening
    let isHandlingAddToCart = false;
    
    // Intercept form submissions
    document.addEventListener('submit', async (e) => {
      const form = e.target;
      const action = form.getAttribute('action');
      
      // Match various cart/add action formats
      if (action && (action === '/cart/add' || action.endsWith('/cart/add') || action.includes('/cart/add'))) {
        e.preventDefault();
        e.stopPropagation();
        
        if (isHandlingAddToCart) return;
        isHandlingAddToCart = true;
        
        const formData = new FormData(form);
        
        try {
          const response = await fetch('/cart/add.js', {
            method: 'POST',
            body: formData,
          });
          
          if (response.ok) {
            // Load cart data without rendering, then open will handle the render
            this.cartJustUpdated = true;
            await this.loadCart(null, true);
            await this.open();
          } else {
            console.error('Upsellity: Failed to add to cart', await response.text());
          }
        } catch (error) {
          console.error('Upsellity: Failed to add to cart', error);
        } finally {
          setTimeout(() => {
            isHandlingAddToCart = false;
          }, 500);
        }
      }
    }, true); // Use capture phase to intercept early

    // Intercept AJAX add to cart calls
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;
      const isCartAdd = url && (url.includes('/cart/add.js') || url.includes('/cart/add'));
      
      // Call original fetch
      const response = await originalFetch(...args);
      
      // Only open drawer if this is a cart add and we're not already handling it
      if (isCartAdd && !isHandlingAddToCart) {
        isHandlingAddToCart = true;
        
        // Clone response so the original caller can still use it
        const clonedResponse = response.clone();
        
         try {
           if (clonedResponse.ok) {
             // Load cart data without rendering, then open will handle the render
             this.cartJustUpdated = true;
             await this.loadCart(null, true);
             await this.open();
           }
         } catch (error) {
           console.error('Upsellity: Error handling cart add', error);
         } finally {
           setTimeout(() => {
             isHandlingAddToCart = false;
           }, 500);
         }
      }
      
      return response;
    };
  }

  attachCartTriggers() {
    // Intercept cart links with capture phase to prevent navigation early
    document.addEventListener('click', (e) => {
      const cartTrigger = e.target.closest('a[href="/cart"], a[href*="/cart"]');
      if (cartTrigger && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
        const href = cartTrigger.getAttribute('href');
        // Only intercept if it's actually a cart link (not checkout or other pages)
        if (href && (href === '/cart' || href.endsWith('/cart') || href.includes('/cart?'))) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          this.open();
        }
      }
    }, true); // Use capture phase

    // Keyboard shortcut to open cart
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        this.open();
      }
    });
  }

  createDrawer() {
    const drawer = document.createElement('div');
    drawer.id = 'upsellity-cart-drawer';
    drawer.className = 'upsellity-drawer';
    drawer.innerHTML = `
      <div class="upsellity-drawer-overlay"></div>
      <div class="upsellity-drawer-content">
        <div class="upsellity-drawer-inner"></div>
      </div>
    `;
    
    document.body.appendChild(drawer);
    
    // Add overlay click handler to close drawer
    const overlay = drawer.querySelector('.upsellity-drawer-overlay');
    if (overlay) {
      overlay.addEventListener('click', () => {
        if (this.isOpen) {
          this.close();
        }
      });
    }
    
    this.loadStyles();
  }

  loadStyles() {
    if (document.querySelector('#upsellity-cart-drawer-styles')) {
      return;
    }
  }

  render() {
    if (!this.cart) return;

    const drawer = document.getElementById('upsellity-cart-drawer');
    if (!drawer) {
      console.error('Upsellity: Drawer element not found');
      return;
    }
    
    const inner = drawer.querySelector('.upsellity-drawer-inner');
    if (!inner) {
      console.error('Upsellity: Drawer inner element not found');
      return;
    }
    
    // For initial render, create the structure
    if (this.isInitialRender) {
      this.renderInitial(inner);
      this.isInitialRender = false;
    } else {
      // For subsequent renders, only update the dynamic parts
      this.renderUpdate(inner);
    }
  }

  renderInitial(inner) {
    let html = `
      <button class="upsellity-close-btn" onclick="window.upsellityDrawer.close()">×</button>
      <h2 id="upsellity-cart-header" style="font-size: 20px; font-weight: 600; margin-bottom: 20px;">
        Your Cart (${this.cart.item_count} items)
      </h2>
    `;

    const { beforeItems, afterItems } = splitFeatureOrder(this.config?.featureOrder);

    // Create containers for each section
    beforeItems.forEach((id) => {
      html += `<div id="upsellity-section-${id}" style="margin-bottom: 12px;"></div>`;
    });

    html += `<div id="upsellity-section-cart-items" style="margin-bottom: 12px;"></div>`;

    afterItems.forEach((id) => {
      html += `<div id="upsellity-section-${id}" style="margin-bottom: 12px;"></div>`;
    });

    html += `<div id="upsellity-section-cart-totals" style="margin-bottom: 12px;"></div>`;
    html += `
      <button class="upsellity-checkout-btn" id="upsellity-checkout-btn" onclick="window.location.href='${DiscountManager.getCheckoutUrl(this.appliedDiscount)}'">
        Checkout
      </button>
      <div style="text-align: center; font-size: 12px; color: #6b7280; margin-top: 8px; display: flex; align-items: center; justify-content: center; gap: 12px;">
        <span style="display: flex; align-items: center; gap: 4px;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
          Secure Checkout
        </span>
        <span>•</span>
        <span>Free Returns</span>
      </div>
    `;

    inner.innerHTML = html;
    
    // Now populate each section
    this.updateAllSections();
  }

  renderUpdate(inner) {
    // Update cart header
    const header = inner.querySelector('#upsellity-cart-header');
    if (header) {
      header.textContent = `Your Cart (${this.cart.item_count} items)`;
    }

    // Update checkout button URL
    const checkoutBtn = inner.querySelector('#upsellity-checkout-btn');
    if (checkoutBtn) {
      checkoutBtn.onclick = () => window.location.href = DiscountManager.getCheckoutUrl(this.appliedDiscount);
    }

    // Update all dynamic sections
    this.updateAllSections();
  }

  updateAllSections() {
    const sections = {
      'free-shipping-bar': { 
        render: () => renderFreeShippingBar(this.config, this.cart, this.reactRoots),
        reactComponent: true
      },
      'promotional-banner': { 
        render: () => renderPromotionalBanner(this.config, this.reactRoots),
        reactComponent: true
      },
      'cart-items': { 
        render: () => renderCartItems(this.cart, this.productCompareAtPrices, this.appliedDiscount, this.reactRoots),
        reactComponent: true
      },
      'product-recommendations': { 
        render: () => renderProductRecommendations(this.config, this.reactRoots),
        reactComponent: true
      },
      'savings-display': { 
        render: () => renderSavingsDisplay(this.config, this.cart, this.appliedDiscount, this.reactRoots),
        reactComponent: true
      },
      'free-shipping-message': { 
        render: () => renderFreeShippingMessage(this.config, this.cart, this.reactRoots),
        reactComponent: true
      },
      'coupon-code': { 
        render: () => renderCouponCodeField(this.config, this.appliedDiscount, this.availableDiscounts, this.showingAllOffers, this.reactRoots),
        reactComponent: true
      },
      'cart-totals': { 
        render: () => renderCartTotals(this.cart, this.appliedDiscount, this.reactRoots),
        reactComponent: true
      }
    };

    const { beforeItems, afterItems } = splitFeatureOrder(this.config?.featureOrder);

    // Update sections in order
    [...beforeItems, 'cart-items', ...afterItems, 'cart-totals'].forEach((id) => {
      const section = sections[id];
      if (!section) return;

      const container = document.getElementById(`upsellity-section-${id}`);
      if (!container) return;
      
      const content = section.render();
      
      if (section.reactComponent) {
        // For React components, only set innerHTML if the nested container doesn't exist yet
        // Each renderer returns HTML like: <div id="upsellity-cart-items-root"></div>
        // We need this container div to exist before React can render into it
        const innerContainerId = content.match(/id="([^"]+)"/)?.[1];
        if (innerContainerId && !document.getElementById(innerContainerId)) {
          container.innerHTML = content;
        }
        // The render function's setTimeout will call root.render() to update the component
      } else {
        // For non-React content, always update innerHTML
        container.innerHTML = content;
      }
    });
  }

  async open() {
    const drawer = document.getElementById('upsellity-cart-drawer');
    const wasOpen = this.isOpen;
    
    // Only do initial render if drawer was previously closed
    if (!wasOpen) {
      this.isInitialRender = true;
    }
    
    // If cart was just updated (add to cart), don't reload, just render
    if (this.cartJustUpdated) {
      this.cartJustUpdated = false;
      this.render();
    } else {
      // Cart wasn't just updated, so reload to get fresh data
      await this.loadConfig();
      await this.loadCart();
    }
    
    // Prevent body scroll when drawer opens
    document.body.style.overflow = 'hidden';
    
    drawer.classList.add('open');
    this.isOpen = true;
  }

  close() {
    const drawer = document.getElementById('upsellity-cart-drawer');
    drawer.classList.remove('open');
    this.isOpen = false;
    
    // Restore body scroll
    document.body.style.overflow = '';
    
    // Clean up React roots when closing
    Object.values(this.reactRoots).forEach(root => {
      try {
        root.unmount();
      } catch (e) {
        // Ignore errors during unmount
      }
    });
    this.reactRoots = {};
  }

  // Handle promotional banner CTA clicks
  handleSlideCtaClick(url) {
    if (url) {
      window.location.href = url;
    }
  }

  // Cart operations
  async addProductToCart(variantId, quantity = 1) {
    await CartOps.addProductToCart(variantId, quantity, this.loadCart.bind(this));
  }

  async addProductToCartByHandle(productHandle, variantId, quantity = 1) {
    await CartOps.addProductToCartByHandle(productHandle, variantId, quantity, this.loadCart.bind(this));
  }

  async updateQuantity(itemKey, newQuantity) {
    await CartOps.updateQuantity(itemKey, newQuantity, this.loadCart.bind(this), this.render.bind(this));
  }

  async removeItem(itemKey) {
    await CartOps.removeItem(itemKey, this.loadCart.bind(this), this.render.bind(this));
  }

  // Discount management
  async applyCoupon() {
    const newDiscount = await DiscountManager.applyCoupon(this.shop, this.config, this.appliedDiscount, this.render.bind(this));
    if (newDiscount) {
      this.appliedDiscount = newDiscount;
    }
  }

  async applyCouponWithCode(code) {
    const newDiscount = await DiscountManager.validateAndApplyCoupon(this.shop, this.config, code, this.cart);
    if (newDiscount) {
      this.appliedDiscount = newDiscount;
      // Clear removal preference when user manually applies a discount
      AutoApplyStorage.clearDiscountRemoval();
      this.render();
    }
  }

  removeDiscount() {
    this.appliedDiscount = null;
    
    // Mark that user removed the discount (prevents auto-apply for 15 minutes)
    AutoApplyStorage.markDiscountRemoved();
    
    this.render();
    showNotification('Discount removed', 'info');
  }

  toggleAllOffers() {
    this.showingAllOffers = !this.showingAllOffers;
    
    const dropdown = document.getElementById('upsellity-all-offers-dropdown');
    const arrow = document.getElementById('upsellity-offers-arrow');
    
    if (dropdown) {
      dropdown.style.display = this.showingAllOffers ? 'block' : 'none';
    }
    
    if (arrow) {
      arrow.textContent = this.showingAllOffers ? '▲' : '▼';
    }
  }

  async switchDiscount(discountCode) {
    const discount = this.availableDiscounts.find(d => d.code === discountCode);
    
    if (!discount) {
      console.error('Upsellity: Discount not found', discountCode);
      return;
    }

    this.appliedDiscount = discount;
    this.showingAllOffers = false;
    
    // Clear removal preference when user manually switches to a discount
    AutoApplyStorage.clearDiscountRemoval();
    
    this.render();
    
    showNotification(`${discount.code} applied!`, 'success');
  }

}

