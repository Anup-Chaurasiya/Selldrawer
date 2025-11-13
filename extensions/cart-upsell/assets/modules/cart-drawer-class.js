/**
 * Main UpsellityCartDrawer Class
 */

import { FEATURE_ORDER_SENTINEL } from './constants.js';
import { splitFeatureOrder, showNotification } from './utils.js';
import * as CartOps from './cart-operations.js';
import * as DiscountManager from './discount-manager.js';
import * as ProductLoader from './product-loader.js';
import { renderFreeShippingBar } from './renderers/free-shipping-bar.js';
import { renderPromotionalBanner } from './renderers/promotional-banner.js';
import { renderCartItems } from './renderers/cart-items.js';
import { renderProductRecommendations } from './renderers/product-recommendations.js';
import { renderSavingsDisplay, renderFreeShippingMessage, renderCouponCodeField, renderCartTotals } from './renderers/other-features.js';

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
      
      console.log('Upsellity: Loaded config:', this.config);
      console.log('Upsellity: Free shipping message config:', this.config.features?.freeShippingMessage);
    } catch (error) {
      console.error('Upsellity: Failed to load config', error);
      this.config = { enabled: false, features: {} };
    }
  }

  async loadCart(cartData = null) {
    try {
      if (cartData) {
        this.cart = cartData;
      } else {
        const response = await fetch('/cart.js');
        this.cart = await response.json();
      }
      
      this.productCompareAtPrices = await ProductLoader.loadProductCompareAtPrices(this.cart);
      
      this.availableDiscounts = await DiscountManager.loadAvailableDiscounts(this.shop, this.config);
      
      if (this.config?.features?.couponCodeField?.enableAutoApply && !this.appliedDiscount && this.availableDiscounts.length > 0) {
        this.appliedDiscount = DiscountManager.autoApplyBestDiscount(this.availableDiscounts, this.cart, this.config);
      }
      
      await ProductLoader.loadShopifyRecommendations(this.cart, this.config);
      
      this.render();
    } catch (error) {
      console.error('Upsellity: Failed to load cart', error);
      this.cart = {
        item_count: 0,
        total_price: 0,
        items: []
      };
      this.render();
    }
  }

  interceptAddToCart() {
    document.addEventListener('submit', async (e) => {
      const form = e.target;
      if (form.getAttribute('action') === '/cart/add') {
        e.preventDefault();
        
        const formData = new FormData(form);
        
        try {
          const response = await fetch('/cart/add.js', {
            method: 'POST',
            body: formData,
          });
          
          if (response.ok) {
            await this.loadCart();
            this.open();
          }
        } catch (error) {
          console.error('Upsellity: Failed to add to cart', error);
        }
      }
    });

    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      
      if (args[0]?.includes('/cart/add')) {
        await this.loadCart();
        this.open();
      }
      
      return response;
    };
  }

  attachCartTriggers() {
    document.addEventListener('click', (e) => {
      const cartTrigger = e.target.closest('a[href="/cart"], a[href*="/cart"]');
      if (cartTrigger && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        this.open();
      }
    });

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
    
    let html = `
      <button class="upsellity-close-btn" onclick="window.upsellityDrawer.close()">×</button>
      <h2 style="font-size: 20px; font-weight: 600; margin-bottom: 20px;">
        Your Cart (${this.cart.item_count} items)
      </h2>
    `;

    const sections = {
      'free-shipping-bar': renderFreeShippingBar(this.config, this.cart),
      'promotional-banner': renderPromotionalBanner(this.config),
      [FEATURE_ORDER_SENTINEL]: renderCartItems(this.cart, this.productCompareAtPrices, this.appliedDiscount),
      'product-recommendations': renderProductRecommendations(this.config),
      'savings-display': renderSavingsDisplay(this.config, this.cart, this.appliedDiscount),
      'free-shipping-message': renderFreeShippingMessage(this.config, this.cart),
      'coupon-code': renderCouponCodeField(this.config, this.appliedDiscount, this.availableDiscounts, this.showingAllOffers),
    };

    const { beforeItems, afterItems } = splitFeatureOrder(this.config?.featureOrder);

    beforeItems.forEach((id) => {
      if (sections[id]) html += sections[id];
    });

    if (sections[FEATURE_ORDER_SENTINEL]) {
      html += sections[FEATURE_ORDER_SENTINEL];
    }

    afterItems.forEach((id) => {
      if (sections[id]) html += sections[id];
    });

    html += renderCartTotals(this.cart, this.appliedDiscount);
    html += `
      <button class="upsellity-checkout-btn" onclick="window.location.href='${DiscountManager.getCheckoutUrl(this.appliedDiscount)}'">
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
  }

  async open() {
    const drawer = document.getElementById('upsellity-cart-drawer');
    drawer.classList.add('open');
    this.isOpen = true;
    
    await this.loadConfig();
    await this.loadCart();
  }

  close() {
    const drawer = document.getElementById('upsellity-cart-drawer');
    drawer.classList.remove('open');
    this.isOpen = false;
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

  removeDiscount() {
    this.appliedDiscount = null;
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
    
    this.render();
    
    showNotification(`${discount.code} applied!`, 'success');
  }

}

