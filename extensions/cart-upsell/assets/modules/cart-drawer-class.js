/**
 * Main SelldrawerCartDrawer Class
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { FEATURE_ORDER_SENTINEL } from './constants.js';
import { splitFeatureOrder } from './utils.js';
import * as CartOps from './cart-operations.js';
import * as DiscountManager from './discount-manager.js';
import * as ProductLoader from './product-loader.js';
import * as AutoApplyStorage from './auto-apply-storage.js';
import { MilestoneRewardManager } from './milestone-reward-manager.js';
import { FreeGiftManager } from './free-gift-manager.js';
import { UnifiedCartDrawer } from './components/UnifiedCartDrawer.jsx';
import { Analytics } from './analytics.js';

export class SelldrawerCartDrawer {
  constructor(appUrl) {
    this.appUrl = appUrl;
    // Try every possible source for the shop domain
    this.shop = this._detectShop();
    this.config = null;
    this.isOpen = false;
    this.cart = null;
    this.availableDiscounts = [];
    this.showingAllOffers = false;
    this.productCompareAtPrices = {};
    this.reactRoot = null;
    this.cartJustUpdated = false;
    this.unlockedMilestone = null;
    this.milestones = [];
    this.isSyncingGifts = false;
    this.freeGifts = [];
    this.selectedGiftId = null;
    this.pendingOperations = new Set();

    this.init();
  }

  _detectShop() {
    // Try every known way Shopify exposes the shop domain
    return (
      window.selldrawer_config?.shop ||
      window.Shopify?.shop ||
      window.meta?.page?.pageType && window.Shopify?.shop ||
      document.querySelector('[data-shop-domain]')?.dataset?.shopDomain ||
      // Parse from canonical URL as last resort
      (document.querySelector('link[rel="canonical"]')?.href
        ? new URL(document.querySelector('link[rel="canonical"]').href).hostname
        : null) ||
      window.location.hostname
    );
  }

  async init() {
    if (!this.appUrl) {
      console.error('Selldrawer: App URL not configured');
      return;
    }

    // Log detected shop for debugging
    console.log('[Selldrawer] Initializing. Shop:', this.shop, '| AppURL:', this.appUrl);

    // STEP 1: Create DOM elements & attach triggers synchronously (instant)
    try {
      this.createDrawer();
      this.interceptAddToCart();
      this.attachCartTriggers();
      console.log('[Selldrawer] Drawer created and triggers attached.');
    } catch (e) {
      console.error('Selldrawer: Failed to initialize UI components', e);
    }

    // STEP 2: Load config and cart data in background (non-blocking)
    this.loadConfig()
      .then(() => this.loadCart())
      .catch(e => console.error('Selldrawer: Background data load failed', e));
  }

  async loadConfig() {
    try {
      // Initialize Analytics
      Analytics.init(this.appUrl);

      // ZERO-LATENCY: Use injected Metafield settings if available
      if (window.selldrawer_config?.settings && Object.keys(window.selldrawer_config.settings).length > 0) {
        console.log('[Selldrawer] Using zero-latency config from Metafields');
        this.config = window.selldrawer_config.settings;
      } else {
        // Fetch config from API
        const timestamp = new Date().getTime();
        let apiUrl = `${this.appUrl}/api/cart-drawer?shop=${encodeURIComponent(this.shop)}&_t=${timestamp}`;

        if (window.selldrawer_config?.customerId) {
          apiUrl += `&customerId=gid://shopify/Customer/${window.selldrawer_config.customerId}`;
        }

        console.log('[Selldrawer] Fetching config from:', apiUrl);

        const response = await fetch(apiUrl, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
        });

        if (!response.ok) {
          throw new Error(`Config API returned ${response.status}`);
        }

        this.config = await response.json();
        console.log('[Selldrawer] Config loaded:', this.config);
      }

      if (this.config?.features?.milestonesEnabled) {
        await this.loadMilestones();
      }
      if (this.config?.features?.freeGiftsEnabled) {
        await this.loadFreeGifts();
      }
    } catch (error) {
      console.error('Selldrawer: Failed to load config, using fallback:', error);
      // IMPORTANT: Use an ENABLED fallback so the cart can still display items.
      // Never use { enabled: false } — that hides the drawer permanently.
      this.config = {
        enabled: true,
        features: {
          freeShippingBar: null,
          productRecommendations: null,
          couponCodeField: null,
          milestonesEnabled: false,
          freeGiftsEnabled: false
        }
      };
    }
  }


  async loadFreeGifts() {
    try {
      // Guard: Ensure config exists before proceeding
      if (!this.config) {
        console.warn('Selldrawer: Config not loaded, skipping free gifts');
        return;
      }

      // Guard: Ensure cart exists before proceeding
      if (!this.cart) {
        console.warn('Selldrawer: Cart not loaded, skipping free gifts');
        return;
      }

      // Prevent concurrent gift syncing to avoid infinite loops
      if (this.isSyncingGifts) {
        console.log('Selldrawer Free Gifts: Already syncing, skipping');
        return;
      }

      // Calculate cart total EXCLUDING gift items to prevent circular dependency
      // This ensures that if a gift was added earlier, it doesn't count towards the threshold
      const cartTotalExcludingGifts = MilestoneRewardManager.calculateCartTotalExcludingGifts(this.cart);
      console.log('Selldrawer Free Gifts: Cart total check', {
        totalWithGifts: this.cart.total_price / 100,
        totalExcludingGifts: cartTotalExcludingGifts / 100
      });

      // Load free gifts from API using cart total WITHOUT gifts
      // Note: API will return empty array if milestone with gift reward is unlocked (priority system)
      const freeGifts = await FreeGiftManager.loadFreeGifts(
        this.appUrl,
        this.shop,
        this.cart,
        cartTotalExcludingGifts / 100 // Pass cart total in rupees, excluding gifts
      );
      this.freeGifts = freeGifts;

      // Only sync if API returned free gifts (meaning they have priority over milestones)
      if (freeGifts.length > 0 && freeGifts[0].qualified) {
        console.log('Selldrawer Free Gifts: API returned gifts, syncing');
        await FreeGiftManager.syncFreeGiftWithCart(
          freeGifts[0],
          this.cart,
          async () => {
            const response = await fetch('/cart.js');
            this.cart = await response.json();
          }
        );

        // Update selected gift ID
        this.selectedGiftId = FreeGiftManager.getSelectedGiftFromCart(this.cart, freeGifts[0]);
      } else {
        console.log('Selldrawer Free Gifts: No gifts from API, not syncing (milestone has priority)');
        // API returned no gifts - this means milestone has priority
        // Don't remove anything, let milestone handle it
        this.selectedGiftId = null;
      }
    } catch (error) {
      console.error('Selldrawer: Failed to load free gifts', error);
    }
  }

  async loadMilestones() {
    try {
      const appUrl = this.appUrl;
      if (!appUrl) return;

      // Guard: Ensure config exists before proceeding
      if (!this.config) {
        console.warn('Selldrawer: Config not loaded, skipping milestones');
        return;
      }

      // Guard: Ensure cart exists before proceeding
      if (!this.cart) {
        console.warn('Selldrawer: Cart not loaded, skipping milestones');
        return;
      }

      // CRITICAL FIX: Use original cart total (before discounts) for milestone calculation
      // This ensures milestones are calculated from the original cart value, not the discounted subtotal
      const cartTotalInCents = MilestoneRewardManager.calculateCartTotalExcludingGifts(this.cart);
      const cartTotal = cartTotalInCents / 100; // Convert cents to rupees


      const timestamp = new Date().getTime();
      const response = await fetch(
        `${appUrl}/api/milestones?shop=${this.shop}&_t=${timestamp}`,
        {
          method: 'POST',
          body: JSON.stringify({
            cartTotal,
            cartItems: this.cart ? this.cart.items : []
          }),
          headers: {
            'Content-Type': 'application/json',
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
      if (data.progressBarColor && this.config.features) {
        this.config.features.milestonesProgressBarColor = data.progressBarColor;
      }

      // Store all unlocked message if provided (always update, even if milestones is empty)
      if (data.allUnlockedMessage && this.config.features) {
        this.config.features.milestonesAllUnlockedMessage = data.allUnlockedMessage;
      }

      // Store background color if provided
      if (data.backgroundColor && this.config.features) {
        this.config.features.milestonesBackgroundColor = data.backgroundColor;
      }
    } catch (error) {
      console.error('Selldrawer: Failed to load milestones', error);
    }
  }

  async handleMilestoneRewards() {
    if (this.isSyncingGifts) {
      console.log('Selldrawer Milestones: Already syncing, skipping');
      return;
    }

    // Guard: Ensure cart exists before proceeding
    if (!this.cart) {
      console.warn('Selldrawer: Cart not loaded, skipping milestone rewards');
      return;
    }

    try {
      this.isSyncingGifts = true;
      console.log('Selldrawer Milestones: Starting sync');

      // Evaluate and handle milestone rewards
      const previousMilestone = this.unlockedMilestone;
      this.unlockedMilestone = await MilestoneRewardManager.handleMilestoneRewards(
        this.milestones,
        this.cart,
        async (cartData) => {
          // Pass skipGiftSync=true to prevent infinite loop
          await this.loadCart(cartData, false, true);
        }
      );

      // Show notification if milestone was just unlocked
      if (this.unlockedMilestone && (!previousMilestone || previousMilestone.id !== this.unlockedMilestone.id)) {
        MilestoneRewardManager.showMilestoneUnlockedNotification(this.unlockedMilestone);
      }

      console.log('Selldrawer Milestones: Sync complete');
    } catch (error) {
      console.error('Selldrawer Milestones: Error handling rewards', error);
    } finally {
      // Add a small delay before allowing next sync
      setTimeout(() => {
        this.isSyncingGifts = false;
      }, 1000);
    }
  }

  async loadCart(cartData = null, skipRender = false, skipGiftSync = false) {
    try {
      // OPTIMIZATION 1: Use provided cart data instead of fetching
      // When cart operations return updated cart data, we use it directly
      if (cartData) {
        this.cart = cartData;
      } else {
        // Only fetch if we don't have cart data
        const response = await fetch(`/cart.js?v=${new Date().getTime()}`, {
          headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
        });
        this.cart = await response.json();
      }

      // OPTIMIZATION 2: Render immediately with cart data we have
      // This gives instant feedback to the user
      if (!skipRender) {
        this.render();
      }

      // OPTIMIZATION 3: Load secondary data in background (non-blocking)
      // Fire and forget - these will update the UI when ready
      if (!skipGiftSync) {
        // Load milestones and gifts asynchronously without blocking
        this.loadSecondaryDataAsync();
      }

      // Load product data in parallel
      const promises = [
        ProductLoader.loadProductCompareAtPrices(this.cart),
        DiscountManager.loadAvailableDiscounts(this.appUrl, this.shop, this.config),
        ProductLoader.loadShopifyRecommendations(this.cart, this.config),
        ProductLoader.loadDynamicFreeShippingUpsells(this.cart, this.config)
      ];


      const [productCompareAtPrices, availableDiscounts] = await Promise.all(promises);

      this.productCompareAtPrices = productCompareAtPrices;
      this.availableDiscounts = availableDiscounts;

      // Auto-apply best discount only if user hasn't removed it recently
      if (this.config?.features?.couponCodeField &&
        this.config?.features?.couponCodeField?.enableAutoApply &&
        !this.getDiscountFromCart() &&
        this.availableDiscounts.length > 0 &&
        !AutoApplyStorage.wasDiscountRemoved()) {
        await DiscountManager.autoApplyBestDiscount(this.availableDiscounts, this.config, this.loadCart.bind(this));
      }

      // Re-render after secondary data is loaded
      if (!skipRender) {
        this.render();
      }
    } catch (error) {
      console.error('Selldrawer: Failed to load cart', error);
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

  // OPTIMIZATION: Load milestones and gifts asynchronously without blocking
  async loadSecondaryDataAsync() {
    try {
      if (this.config?.features?.milestonesEnabled) {
        await this.loadMilestones();
      } else {
        // If milestones are disabled, remove any milestone gifts from cart
        // Guard: Ensure cart exists before proceeding
        if (!this.cart) {
          console.warn('Selldrawer: Cart not loaded, skipping milestone cleanup');
          return;
        }

        const allGifts = MilestoneRewardManager.getAllGiftsInCart(this.cart);
        if (allGifts.length > 0) {
          let cartModified = false;
          for (const giftItem of allGifts) {
            // Only remove gifts that belong to milestones (or have no source)
            // DO NOT remove gifts from 'gifting_block' or other sources
            const props = MilestoneRewardManager.normalizeProperties(giftItem.properties);
            const source = props['_selldrawer_gift_source'];
            const isMilestoneGift = !source || source === 'milestone';

            if (isMilestoneGift) {
              console.log('Selldrawer Cart Drawer: Cleaning up disabled milestone gift', giftItem.key);
              await MilestoneRewardManager.removeGiftFromCart(giftItem.key);
              cartModified = true;
            } else {
              console.log('Selldrawer Cart Drawer: Ignoring gift from other source', source, giftItem.key);
            }
          }

          if (cartModified) {
            // Reload cart after cleanup
            const response = await fetch('/cart.js');
            this.cart = await response.json();
          }
        }
      }

      if (this.config?.features?.freeGiftsEnabled) {
        await this.loadFreeGifts();
      }

      // Re-render after milestones/gifts are loaded
      this.render();
    } catch (error) {
      console.error('Selldrawer: Failed to load secondary data', error);
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
            console.error('Selldrawer: Failed to add to cart', await response.text());
          }
        } catch (error) {
          console.error('Selldrawer: Failed to add to cart', error);
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
          console.error('Selldrawer: Error handling cart add', error);
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
    // ─────────────────────────────────────────────────────────────────────────
    // STEP 1: Suppress the theme's native cart drawer custom element.
    // Shopify themes (Dawn, Refresh, etc.) use <cart-drawer> or <cart-notification>
    // web components. We hide them so only our drawer shows.
    // ─────────────────────────────────────────────────────────────────────────
    const suppressThemeCartDrawer = () => {
      // Hide native <cart-drawer> elements
      document.querySelectorAll('cart-drawer').forEach(el => {
        el.style.display = 'none';
        el.style.visibility = 'hidden';
        // Disable the element's show/open methods
        if (el.show) el.show = () => { };
        if (el.open) el.open = () => { };
      });
      // Hide native <cart-notification> elements
      document.querySelectorAll('cart-notification').forEach(el => {
        el.style.display = 'none';
        if (el.renderContents) el.renderContents = () => { };
      });
    };

    // Suppress immediately and also watch for DOM changes (theme may create them late)
    suppressThemeCartDrawer();
    const mutationObserver = new MutationObserver(() => suppressThemeCartDrawer());
    mutationObserver.observe(document.body, { childList: true, subtree: false });

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 2: Intercept ALL click patterns used by Shopify themes in capture phase.
    // This covers: Dawn, Debut, Refresh, Brooklyn, Impulse, and most custom themes.
    // ─────────────────────────────────────────────────────────────────────────

    // Comprehensive CSS selector matching every Shopify theme cart button pattern
    const CART_TRIGGER_SELECTOR = [
      // Anchor tag cart links
      'a[href="/cart"]',
      'a[href*="/cart"]',
      // Button/element patterns used by theme
      '[data-cart-toggle]',
      '[data-cart-open]',
      '[data-open-cart]',
      '[aria-controls="cart-drawer"]',
      '[aria-controls="CartDrawer"]',
      '[aria-controls="cart-notification-product"]',
      '[aria-label*="cart" i]',
      '[aria-label*="Cart" i]',
      // Common class patterns
      '.cart-icon-bubble',
      '.cart__icon',
      '.header__icon--cart',
      '.site-header__cart',
      '.cart-link',
      '.js-cart-link',
      '.js-cart',
      '.cart-trigger',
      '.cart-toggle',
      '.mini-cart-icon',
      '.nav-cart-icon',
      '[class*="cart-icon"]',
      '[class*="CartIcon"]',
      // Icon-type selectors
      'a.icon-cart',
      '.icon-cart',
      // Shopify native custom elements as triggers
      'cart-icon-bubble',
    ].join(', ');

    const isCartTrigger = (target) => {
      if (!target) return false;
      // Walk up to 5 ancestor levels looking for a cart trigger element
      let el = target;
      for (let i = 0; i < 5; i++) {
        if (!el || el === document.body) break;
        if (el.matches && el.matches(CART_TRIGGER_SELECTOR)) {
          // Make sure it's not a checkout/login link
          const href = el.getAttribute('href') || '';
          if (href.includes('/checkout') || href.includes('/account') || href.includes('/collections')) {
            // not a cart trigger
          } else {
            return true;
          }
        }
        el = el.parentElement;
      }
      return false;
    };

    document.addEventListener('click', (e) => {
      if (!e.ctrlKey && !e.metaKey && !e.shiftKey && isCartTrigger(e.target)) {
        console.log('[Selldrawer] Cart trigger intercepted', e.target);
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        this.open();
      }
    }, true); // Capture phase — runs before theme handlers

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 3: Intercept theme-dispatched custom events that open the cart.
    // Some themes dispatch events instead of reacting to clicks.
    // ─────────────────────────────────────────────────────────────────────────
    const cartOpenEvents = ['cart:open', 'open-cart', 'CartDrawer:open', 'cart-drawer:open', 'theme:cart:open'];
    cartOpenEvents.forEach(eventName => {
      document.addEventListener(eventName, (e) => {
        console.log(`[Selldrawer] Intercepted theme event: ${eventName}`);
        e.preventDefault();
        e.stopImmediatePropagation();
        this.open();
      }, true);
    });

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 4: Keyboard shortcut
    // ─────────────────────────────────────────────────────────────────────────
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        this.open();
      }
    });

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 5: Listen for cart:updated from other modules (gifts, FBT, etc.)
    // ─────────────────────────────────────────────────────────────────────────
    document.addEventListener('cart:updated', async (e) => {
      let cartData = e.detail;

      // Defensive check: /cart/add.js returns the ITEM, not the CART
      if (!cartData || !cartData.items || !Array.isArray(cartData.items)) {
        console.log('Selldrawer Cart Drawer: Event data is not a full cart, fetching fresh data');
        cartData = null;
      }

      if (this.isOpen) {
        await this.loadCart(cartData, false, true);
      } else {
        if (cartData) {
          this.cart = cartData;
        }
      }
    });
  }

  createDrawer() {
    const drawer = document.createElement('div');
    drawer.id = 'selldrawer-cart-drawer';
    drawer.className = 'selldrawer-drawer';
    drawer.innerHTML = `
      <div class="selldrawer-drawer-overlay"></div>
      <div class="selldrawer-drawer-content">
        <div class="selldrawer-drawer-inner"></div>
      </div>
    `;

    document.body.appendChild(drawer);

    // Get references to drawer elements
    const overlay = drawer.querySelector('.selldrawer-drawer-overlay');
    const drawerContent = drawer.querySelector('.selldrawer-drawer-content');

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
    if (document.querySelector('#selldrawer-cart-drawer-styles')) {
      return;
    }
  }

  render() {
    const drawer = document.getElementById('selldrawer-cart-drawer');
    if (!drawer) {
      console.error('Selldrawer: Drawer element not found');
      return;
    }

    const inner = drawer.querySelector('.selldrawer-drawer-inner');
    if (!inner) {
      console.error('Selldrawer: Drawer inner element not found');
      return;
    }

    // Create or reuse React root (never unmount between open/close)
    if (!this.reactRoot) {
      this.reactRoot = createRoot(inner);
    }

    // If cart or config not yet loaded, show a loading skeleton
    if (!this.cart || !this.config) {
      this.reactRoot.render(
        React.createElement('div', { style: { padding: '20px', textAlign: 'center', color: '#6b7280' } },
          React.createElement('div', { style: { fontSize: '14px', marginTop: '40px' } }, 'Loading your cart...')
        )
      );
      return;
    }



    // Debug logging
    console.log('Selldrawer Cart Drawer Render:', {
      freeGifts: this.freeGifts,
      freeGiftsEnabled: this.config?.features?.freeGiftsEnabled,
      selectedGiftId: this.selectedGiftId
    });

    // Get discount from Shopify cart
    const appliedDiscount = this.getDiscountFromCart();

    // Render the unified React component
    this.reactRoot.render(
      React.createElement(UnifiedCartDrawer, {
        config: this.config,
        cart: this.cart,
        appliedDiscount: appliedDiscount,
        availableDiscounts: this.availableDiscounts,
        productCompareAtPrices: this.productCompareAtPrices,
        showingAllOffers: this.showingAllOffers,
        unlockedMilestone: this.unlockedMilestone,
        freeGifts: this.freeGifts,
        selectedGiftId: this.selectedGiftId,
        pendingOperations: this.pendingOperations,
        onClose: () => this.close(),
        onCheckout: () => this.handleCheckout(),
        onAddProductToCart: (variantId, quantity = 1, properties = {}) => this.addProductToCart(variantId, quantity, properties),
        onUpdateQuantity: (itemKey, newQuantity) => this.updateQuantity(itemKey, newQuantity),
        onRemoveItem: (itemKey) => this.removeItem(itemKey),
        onApplyCoupon: (code) => this.applyCouponWithCode(code),
        onRemoveDiscount: () => this.removeDiscount(),
        onSwitchDiscount: (code) => this.switchDiscount(code),
        onSelectGift: (giftId, variantId) => this.handleSelectGift(giftId, variantId),
        onUpdateNote: (note) => this.updateNote(note),
        onToggleShippingProtection: (variantId, enabled) => this.toggleShippingProtection(variantId, enabled),
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

  open() {
    const drawer = document.getElementById('selldrawer-cart-drawer');
    if (!drawer) {
      console.error('Selldrawer: Drawer container not found');
      return;
    }

    // Open drawer immediately for instant feedback
    drawer.classList.add('open');
    this.isOpen = true;

    // Reset this flag
    this.cartJustUpdated = false;

    // Render immediately — show loading skeleton if data not ready yet
    this.render();

    // Load fresh cart and config in the background (truly non-blocking)
    Promise.all([
      this.loadConfig(),
      fetch('/cart.js').then(res => res.json()).then(cart => {
        this.cart = cart;
      })
    ])
      .then(() => {
        // Re-render once data is ready
        this.render();
        // Load secondary data in background
        this.loadSecondaryData();
      })
      .catch(error => {
        console.error('Selldrawer: Failed to load data while opening', error);
        this.render();
      });
  }

  async loadSecondaryData() {
    try {
      // Guard: Ensure cart exists before proceeding
      if (!this.cart) {
        console.warn('Selldrawer: Cart not loaded, skipping secondary data');
        return;
      }

      // Load all product-related secondary data in parallel
      const promises = [
        ProductLoader.loadProductCompareAtPrices(this.cart),
        DiscountManager.loadAvailableDiscounts(this.appUrl, this.shop, this.config),
        ProductLoader.loadShopifyRecommendations(this.cart, this.config)
      ];

      const [productCompareAtPrices, availableDiscounts] = await Promise.all(promises);

      this.productCompareAtPrices = productCompareAtPrices;
      this.availableDiscounts = availableDiscounts;

      // Load milestones and free gifts asynchronously (non-blocking)
      this.loadSecondaryDataAsync();

      // Auto-apply best discount only if user hasn't removed it recently
      if (this.config?.features?.couponCodeField &&
        this.config?.features?.couponCodeField?.enableAutoApply &&
        !this.getDiscountFromCart() &&
        this.availableDiscounts.length > 0 &&
        !AutoApplyStorage.wasDiscountRemoved()) {
        await DiscountManager.autoApplyBestDiscount(this.availableDiscounts, this.config, this.loadCart.bind(this));
      }

      // Re-render with secondary data
      this.render();
    } catch (error) {
      console.error('Selldrawer: Failed to load secondary data', error);
    }
  }

  close() {
    const drawer = document.getElementById('selldrawer-cart-drawer');
    if (drawer) {
      drawer.classList.remove('open');
    }
    this.isOpen = false;
    // NOTE: Do NOT unmount the React root here.
    // Unmounting + nulling reactRoot causes React 18 to error on createRoot
    // when the drawer reopens on the same container. Keep the root alive.
  }

  // Handle gift selection
  async handleSelectGift(giftId, variantId) {
    // Get the free gift object
    const freeGift = this.freeGifts && this.freeGifts.length > 0 ? this.freeGifts[0] : null;

    if (!freeGift) {
      console.error('Selldrawer: No free gift available');
      return;
    }

    const success = await FreeGiftManager.selectGift(variantId, freeGift, async () => {
      // Reload cart after adding gift
      const response = await fetch('/cart.js');
      this.cart = await response.json();
      this.render();
    });

    if (success) {
      // Update selected gift ID after successful addition
      this.selectedGiftId = giftId;
      this.render();
    }
  }

  // Handle checkout with milestone rewards and free gifts
  async handleCheckout() {
    try {
      console.log('Selldrawer: Starting checkout process', {
        hasFreeGifts: this.freeGifts && this.freeGifts.length > 0,
        hasUnlockedMilestone: !!this.unlockedMilestone,
        cartTotal: this.cart?.total_price / 100
      });

      // Check free gifts first - only if qualified
      if (this.freeGifts && this.freeGifts.length > 0 && this.freeGifts[0].qualified) {
        console.log('Selldrawer: Free gift is qualified, checking discount code');

        // If free gift has discount code, use it for checkout
        if (this.freeGifts[0].discountCode) {
          console.log('Selldrawer: Using free gift discount code', this.freeGifts[0].discountCode);
          const checkoutUrl = FreeGiftManager.getCheckoutUrlWithDiscount(this.freeGifts[0]);
          window.location.href = checkoutUrl;
          return;
        } else {
          console.log('Selldrawer: Free gift has no discount code, proceeding to normal checkout');
          // Free gift is in cart but no discount code configured
          // This is OK - the BXGY automatic discount will apply at checkout
          // Continue to next priority
        }
      }

      // Priority 1: Use milestone discount if available
      if (this.unlockedMilestone && this.unlockedMilestone.discountCode) {
        console.log('Selldrawer: Using milestone discount', this.unlockedMilestone.discountCode);
        // Validate milestone before checkout
        const validation = await MilestoneRewardManager.validateMilestoneForCheckout(
          this.unlockedMilestone,
          this.cart
        );

        if (!validation.valid) {
          console.log('Selldrawer: Milestone validation failed', validation.message);
          return;
        }

        // Proceed to checkout with milestone discount
        const checkoutUrl = MilestoneRewardManager.getCheckoutUrlWithDiscount(this.unlockedMilestone);
        console.log('Selldrawer: Redirecting to checkout with milestone discount', checkoutUrl);
        window.location.href = checkoutUrl;
        return;
      }

      // Priority 2: Use manually applied discount (coupon code)
      const appliedDiscount = this.getDiscountFromCart();
      if (appliedDiscount && appliedDiscount.code) {
        console.log('Selldrawer: Using manually applied discount', appliedDiscount.code);
        const checkoutUrl = DiscountManager.getCheckoutUrl(appliedDiscount.code);
        window.location.href = checkoutUrl;
        return;
      }

      // Priority 3: No discount, proceed to normal checkout
      console.log('Selldrawer: Proceeding to normal checkout');
      window.location.href = '/checkout';
    } catch (error) {
      console.error('Selldrawer: Error during checkout', error);
      // showNotification('An error occurred. Proceeding to checkout...', 'error');

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
    // Check if there's already a pending operation for this item
    if (this.pendingOperations.has(itemKey)) {
      console.log('Selldrawer: Operation already pending for item', itemKey);
      return;
    }

    // Mark this item as having a pending operation
    this.pendingOperations.add(itemKey);

    try {
      await CartOps.updateQuantity(itemKey, newQuantity, async (updatedCart) => {
        // Update cart and reload free gifts to check qualification
        await this.loadCart(updatedCart);
      }, this.render.bind(this));
    } catch (error) {
      // Error is already handled in cart-operations.js with notifications
      // Just ensure cart is reloaded and rendered
      await this.loadCart();
      this.render();
    } finally {
      // Remove the item from pending operations
      this.pendingOperations.delete(itemKey);

      // Trigger cart:updated event for FBT monitor
      document.dispatchEvent(new CustomEvent('cart:updated'));
    }
  }

  async removeItem(itemKey) {
    // Check if there's already a pending operation for this item
    if (this.pendingOperations.has(itemKey)) {
      console.log('Selldrawer: Operation already pending for item', itemKey);
      return;
    }

    // Mark this item as having a pending operation
    this.pendingOperations.add(itemKey);

    try {
      await CartOps.removeItem(itemKey, async (updatedCart) => {
        // Update cart and reload free gifts to check qualification
        await this.loadCart(updatedCart);

        // Trigger cart:updated event for FBT monitor
        document.dispatchEvent(new CustomEvent('cart:updated'));
      }, this.render.bind(this));
    } finally {
      // Remove the item from pending operations
      this.pendingOperations.delete(itemKey);
    }
  }

  // Get discount from Shopify cart
  getDiscountFromCart() {
    return DiscountManager.getDiscountFromCart(this.cart);
  }

  // Discount management
  async applyCoupon() {
    await DiscountManager.applyCoupon(this.appUrl, this.shop, this.config, null, this.render.bind(this));
  }

  async applyCouponWithCode(code) {
    const success = await DiscountManager.validateAndApplyCoupon(
      this.appUrl,
      this.shop,
      this.config,
      code,
      this.loadCart.bind(this)
    );

    if (success) {
      // Clear removal preference when user manually applies a discount
      AutoApplyStorage.clearDiscountRemoval();
      await this.loadCart();
    }
  }

  async removeDiscount() {
    // Mark that user removed the discount FIRST (prevents auto-apply from re-triggering)
    AutoApplyStorage.markDiscountRemoved();

    const success = await DiscountManager.removeDiscount(async (cart) => {
      // Update cart data immediately
      this.cart = cart;
      // Render immediately - this gives instant feedback
      this.render();

      // Load secondary data in background (but auto-apply won't run because we marked it as removed)
      // This ensures UI is updated immediately while data loads in background
      this.loadSecondaryData();
    });

    // Don't call loadCart() again - it would cause delay and is unnecessary
    // The callback already updated the cart and rendered
  }

  toggleAllOffers() {
    this.showingAllOffers = !this.showingAllOffers;

    const dropdown = document.getElementById('selldrawer-all-offers-dropdown');
    const arrow = document.getElementById('selldrawer-offers-arrow');

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
      console.error('Selldrawer: Discount not found', discountCode);
      return;
    }

    const success = await DiscountManager.applyDiscountCode(discountCode, this.loadCart.bind(this));

    if (success) {
      this.showingAllOffers = false;

      // Clear removal preference when user manually switches to a discount
      AutoApplyStorage.clearDiscountRemoval();

      await this.loadCart();
    }
  }

  async updateNote(note) {
    this.pendingOperations.add('note');
    this.render();
    try {
      await CartOps.updateCartNote(note, async () => {
        const response = await fetch('/cart.js');
        const cart = await response.json();
        this.cart = cart;
      });
    } finally {
      this.pendingOperations.delete('note');
      this.render();
    }
  }

  async toggleShippingProtection(variantId, enabled) {
    this.pendingOperations.add('shipping_protection');
    this.render();
    try {
      await CartOps.toggleShippingProtection(variantId, enabled, async () => {
        const response = await fetch('/cart.js');
        const cart = await response.json();
        this.cart = cart;
      });
    } finally {
      this.pendingOperations.delete('shipping_protection');
      this.render();
    }
  }
}

