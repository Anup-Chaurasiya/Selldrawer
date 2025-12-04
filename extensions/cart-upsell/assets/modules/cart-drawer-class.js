/**
 * Main UpsellityCartDrawer Class
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { FEATURE_ORDER_SENTINEL } from './constants.js';
import { splitFeatureOrder, showNotification } from './utils.js';
import * as CartOps from './cart-operations.js';
import * as DiscountManager from './discount-manager.js';
import * as ProductLoader from './product-loader.js';
import * as AutoApplyStorage from './auto-apply-storage.js';
import * as MilestoneRewardManager from './milestone-reward-manager.js';
import { UnifiedCartDrawer } from './components/UnifiedCartDrawer.jsx';
import { Analytics } from './analytics.js';

export class UpsellityCartDrawer {
  constructor(appUrl) {
    this.appUrl = appUrl;
    this.shop = window.Shopify?.shop || null;
    this.config = null;
    this.isOpen = false;
    this.cart = null;
    this.appliedDiscount = null;
    this.availableDiscounts = [];
    this.showingAllOffers = false;
    this.productCompareAtPrices = {};
    this.reactRoot = null; // Single React root for the entire drawer
    this.cartJustUpdated = false; // Track if cart was just updated via add to cart
    this.unlockedMilestone = null; // Currently unlocked milestone
    this.milestones = []; // All milestones from API
    this.isSyncingGifts = false; // Prevent concurrent gift syncing
    
    this.init();
  }

  async init() {
    if (!this.shop) {
      console.error('Upsellity: Shop not detected');
      return;
    }

    if (!this.appUrl) {
      console.error('Upsellity: App URL not configured');
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
      // Initialize Analytics with the app URL
      Analytics.init(this.appUrl);

      const timestamp = new Date().getTime();
      const response = await fetch(`${this.appUrl}/api/cart-drawer?shop=${this.shop}&_t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      this.config = await response.json();
      
      // Load milestones if enabled
      if (this.config?.features?.milestonesEnabled) {
        await this.loadMilestones();
      }
    } catch (error) {
      console.error('Upsellity: Failed to load config', error);
      this.config = { enabled: false, features: {} };
    }
  }

  async loadMilestones() {
    try {
      const appUrl = document.querySelector('[data-upsellity-app-url]')?.dataset.upsellityAppUrl;
      if (!appUrl) return;

      const cartTotal = this.cart ? this.cart.total_price / 100 : 0; // Convert cents to rupees
      const cartItemsJson = this.cart ? JSON.stringify(this.cart.items) : '[]';
      
      const timestamp = new Date().getTime();
      const response = await fetch(
        `${appUrl}/api/milestones?shop=${this.shop}&cartTotal=${cartTotal}&cartItems=${encodeURIComponent(cartItemsJson)}&_t=${timestamp}`,
        {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        }
      );
      
      const data = await response.json();
      
      if (data.milestones) {
        // Store milestones for reward evaluation
        this.milestones = data.milestones;
        
        // Store milestones in config for rendering
        if (!this.config.features) {
          this.config.features = {};
        }
        this.config.features.milestones = data.milestones;
        
        // Handle milestone rewards (evaluate and sync gifts)
        await this.handleMilestoneRewards();
      }
      
      // Store progress bar color if provided (always update, even if milestones is empty)
      if (data.progressBarColor) {
        this.config.features.milestonesProgressBarColor = data.progressBarColor;
      }
      
      // Store all unlocked message if provided (always update, even if milestones is empty)
      if (data.allUnlockedMessage) {
        this.config.features.milestonesAllUnlockedMessage = data.allUnlockedMessage;
      }
    } catch (error) {
      console.error('Upsellity: Failed to load milestones', error);
    }
  }

  async handleMilestoneRewards() {
    if (this.isSyncingGifts) {
      console.log('Upsellity Milestones: Already syncing gifts, skipping...');
      return;
    }
    
    try {
      this.isSyncingGifts = true;
      
      // Evaluate and handle milestone rewards
      const previousMilestone = this.unlockedMilestone;
      this.unlockedMilestone = await MilestoneRewardManager.handleMilestoneRewards(
        this.milestones,
        this.cart,
        this.loadCart.bind(this)
      );
      
      // Show notification if milestone was just unlocked
      if (this.unlockedMilestone && (!previousMilestone || previousMilestone.id !== this.unlockedMilestone.id)) {
        MilestoneRewardManager.showMilestoneUnlockedNotification(this.unlockedMilestone);
      }
    } catch (error) {
      console.error('Upsellity Milestones: Error handling rewards', error);
    } finally {
      this.isSyncingGifts = false;
    }
  }

  async loadCart(cartData = null, skipRender = false) {
    try {
      // Load cart data first (required for rendering)
      if (cartData) {
        this.cart = cartData;
      } else {
        const response = await fetch('/cart.js');
        this.cart = await response.json();
      }
      
      // Render immediately if we're not skipping render
      // This ensures drawer opens as soon as we have cart + config
      if (!skipRender) {
        this.render();
      }
      
      // Load all secondary data in parallel (can complete after drawer is open)
      const promises = [
        ProductLoader.loadProductCompareAtPrices(this.cart),
        DiscountManager.loadAvailableDiscounts(this.appUrl, this.shop, this.config),
        ProductLoader.loadShopifyRecommendations(this.cart, this.config)
      ];
      
      // Add milestones loading if enabled
      if (this.config?.features?.milestonesEnabled) {
        promises.push(this.loadMilestones());
      }
      
      const [productCompareAtPrices, availableDiscounts] = await Promise.all(promises);
      
      this.productCompareAtPrices = productCompareAtPrices;
      this.availableDiscounts = availableDiscounts;
      
      // Auto-apply best discount only if user hasn't removed it recently
      if (this.config?.features?.couponCodeField?.enableAutoApply && 
          !this.appliedDiscount && 
          this.availableDiscounts.length > 0 &&
          !AutoApplyStorage.wasDiscountRemoved()) {
        this.appliedDiscount = DiscountManager.autoApplyBestDiscount(this.availableDiscounts, this.cart, this.config);
      }
      
      // Re-render after secondary data is loaded
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
            // Ensure config is loaded, then load cart and open
            if (!this.config) {
              await this.loadConfig();
            }
            
            // Load fresh cart data
            const cartResponse = await fetch('/cart.js');
            this.cart = await cartResponse.json();
            
            // Mark that cart was just updated and open drawer
            this.cartJustUpdated = true;
            await this.open();
            
            // Load secondary data in background
            this.loadSecondaryData();
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
             // Ensure config is loaded, then load cart and open
             if (!this.config) {
               await this.loadConfig();
             }
             
             // Load fresh cart data
             const cartResponse = await fetch('/cart.js');
             this.cart = await cartResponse.json();
             
             // Mark that cart was just updated and open drawer
             this.cartJustUpdated = true;
             await this.open();
             
             // Load secondary data in background
             this.loadSecondaryData();
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
    
    // Get references to drawer elements
    const overlay = drawer.querySelector('.upsellity-drawer-overlay');
    const drawerContent = drawer.querySelector('.upsellity-drawer-content');
    
    // Click handler for the main drawer container
    // This catches clicks anywhere in the drawer area
    drawer.addEventListener('click', (e) => {
      // Close if clicking directly on the drawer container (outside content area)
      if (this.isOpen && e.target === drawer) {
        this.close();
      }
    });
    
    // Click handler for overlay - closes drawer when clicking on the dark background
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (this.isOpen) {
          e.stopPropagation();
          this.close();
        }
      });
    }
    
    // Prevent clicks inside drawer content from bubbling up and closing the drawer
    if (drawerContent) {
      drawerContent.addEventListener('click', (e) => {
        // Stop propagation so clicks inside content don't reach the drawer/overlay handlers
        e.stopPropagation();
      });
    }
    
    // Close drawer on Escape key press
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });
    
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
    
    // Create or reuse React root
    if (!this.reactRoot) {
      this.reactRoot = createRoot(inner);
    }
    
    // Render the unified React component
    this.reactRoot.render(
      React.createElement(UnifiedCartDrawer, {
        config: this.config,
        cart: this.cart,
        appliedDiscount: this.appliedDiscount,
        availableDiscounts: this.availableDiscounts,
        productCompareAtPrices: this.productCompareAtPrices,
        showingAllOffers: this.showingAllOffers,
        unlockedMilestone: this.unlockedMilestone,
        onClose: () => this.close(),
        onCheckout: () => window.location.href = DiscountManager.getCheckoutUrl(this.appliedDiscount),
        onAddProductToCart: (variantId) => this.addProductToCart(variantId, 1, { '_upsell_source': 'cart_drawer_recommendation' }),
        onUpdateQuantity: (itemKey, newQuantity) => this.updateQuantity(itemKey, newQuantity),
        onRemoveItem: (itemKey) => this.removeItem(itemKey),
        onApplyCoupon: (code) => this.applyCouponWithCode(code),
        onRemoveDiscount: () => this.removeDiscount(),
        onSwitchDiscount: (code) => this.switchDiscount(code),
        onSlideCtaClick: (url) => this.handleSlideCtaClick(url),
        onImpression: () => {
          Analytics.track({
            eventType: 'impression',
            component: 'cart_drawer',
            value: 0
          });
        },
        onFeatureImpression: (feature) => {
          Analytics.track({
            eventType: 'impression',
            component: feature,
            value: 0
          });
        },
        onFeatureClick: (feature, data) => {
          Analytics.track({
            eventType: 'click',
            component: feature,
            value: 0,
            ...data
          });
        }
      })
    );
  }

  async open() {
    const drawer = document.getElementById('upsellity-cart-drawer');
    
    // If cart was just updated (add to cart), render and open immediately
    if (this.cartJustUpdated) {
      this.cartJustUpdated = false;
      this.render();
      
      // Open drawer immediately (don't lock body scroll - allow page scrolling)
      drawer.classList.add('open');
      this.isOpen = true;
    } else {
      // Cart wasn't just updated, so reload to get fresh data
      // Load config and cart in parallel
      await Promise.all([
        this.loadConfig(),
        fetch('/cart.js').then(res => res.json()).then(cart => {
          this.cart = cart;
        })
      ]);
      
      // Render and open drawer immediately after config + cart are loaded
      this.render();
      // Don't lock body scroll - allow page scrolling
      drawer.classList.add('open');
      this.isOpen = true;
      
      // Load secondary data in background (will re-render when done)
      this.loadSecondaryData();
    }
  }
  
  async loadSecondaryData() {
    try {
      // Load all secondary data in parallel
      const promises = [
        ProductLoader.loadProductCompareAtPrices(this.cart),
        DiscountManager.loadAvailableDiscounts(this.appUrl, this.shop, this.config),
        ProductLoader.loadShopifyRecommendations(this.cart, this.config)
      ];
      
      // Add milestones loading if enabled
      if (this.config?.features?.milestonesEnabled) {
        promises.push(this.loadMilestones());
      }
      
      const [productCompareAtPrices, availableDiscounts] = await Promise.all(promises);
      
      this.productCompareAtPrices = productCompareAtPrices;
      this.availableDiscounts = availableDiscounts;
      
      // Auto-apply best discount only if user hasn't removed it recently
      if (this.config?.features?.couponCodeField?.enableAutoApply && 
          !this.appliedDiscount && 
          this.availableDiscounts.length > 0 &&
          !AutoApplyStorage.wasDiscountRemoved()) {
        this.appliedDiscount = DiscountManager.autoApplyBestDiscount(this.availableDiscounts, this.cart, this.config);
      }
      
      // Re-render with secondary data
      this.render();
    } catch (error) {
      console.error('Upsellity: Failed to load secondary data', error);
    }
  }

  close() {
    const drawer = document.getElementById('upsellity-cart-drawer');
    drawer.classList.remove('open');
    this.isOpen = false;
    
    // Clean up React root when closing
    if (this.reactRoot) {
      try {
        this.reactRoot.unmount();
      } catch (e) {
        // Ignore errors during unmount
      }
      this.reactRoot = null;
    }
  }

  // Handle promotional banner CTA clicks
  handleSlideCtaClick(url) {
    if (url) {
      window.location.href = url;
    }
  }

  // Handle checkout with milestone rewards
  async handleCheckout() {
    try {
      // Priority 1: Use milestone discount if available
      if (this.unlockedMilestone && this.unlockedMilestone.discountCode) {
        // Validate milestone before checkout
        const validation = await MilestoneRewardManager.validateMilestoneForCheckout(
          this.unlockedMilestone,
          this.cart
        );
        
        if (!validation.valid) {
          showNotification(validation.message, 'info');
          
          // If gifts are missing, try to sync them
          if (this.unlockedMilestone.rewardType === 'gift_wrapping') {
            await this.handleMilestoneRewards();
            
            // Wait a bit and try again
            setTimeout(() => {
              this.handleCheckout();
            }, 500);
          }
          
          return;
        }
        
        // Proceed to checkout with milestone discount
        const checkoutUrl = MilestoneRewardManager.getCheckoutUrlWithDiscount(this.unlockedMilestone);
        window.location.href = checkoutUrl;
        return;
      }
      
      // Priority 2: Use manually applied discount (coupon code)
      if (this.appliedDiscount && this.appliedDiscount.code) {
        const checkoutUrl = DiscountManager.getCheckoutUrl(this.appliedDiscount);
        window.location.href = checkoutUrl;
        return;
      }
      
      // Priority 3: No discount, proceed to normal checkout
      window.location.href = '/checkout';
    } catch (error) {
      console.error('Upsellity: Error during checkout', error);
      showNotification('An error occurred. Proceeding to checkout...', 'error');
      
      // Fallback to normal checkout
      setTimeout(() => {
        window.location.href = '/checkout';
      }, 1000);
    }
  }

  // Cart operations
  async addProductToCart(variantId, quantity = 1, properties = {}) {
    await CartOps.addProductToCart(variantId, quantity, this.loadCart.bind(this), properties);
    
    // Track add to cart if coming from upsell
    if (properties._upsell_source) {
      Analytics.track({
        eventType: 'add_to_cart',
        component: properties._upsell_source,
        variantId: variantId.toString(),
        value: 0 // Ideally we'd have price here, but we might not
      });
    }
  }

  async addProductToCartByHandle(productHandle, variantId, quantity = 1, properties = {}) {
    await CartOps.addProductToCartByHandle(productHandle, variantId, quantity, this.loadCart.bind(this), properties);
  }

  async updateQuantity(itemKey, newQuantity) {
    await CartOps.updateQuantity(itemKey, newQuantity, this.loadCart.bind(this), this.render.bind(this));
  }

  async removeItem(itemKey) {
    await CartOps.removeItem(itemKey, this.loadCart.bind(this), this.render.bind(this));
  }

  // Discount management
  async applyCoupon() {
    const newDiscount = await DiscountManager.applyCoupon(this.appUrl, this.shop, this.config, this.appliedDiscount, this.render.bind(this));
    if (newDiscount) {
      this.appliedDiscount = newDiscount;
    }
  }

  async applyCouponWithCode(code) {
    const newDiscount = await DiscountManager.validateAndApplyCoupon(this.appUrl, this.shop, this.config, code, this.cart);
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

