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
import * as FreeGiftManager from './free-gift-manager.js';
import { UnifiedCartDrawer } from './components/UnifiedCartDrawer.jsx';
import { Analytics } from './analytics.js';

export class UpsellityCartDrawer {
  constructor(appUrl) {
    this.appUrl = appUrl;
    this.shop = window.Shopify?.shop || null;
    this.config = null;
    this.isOpen = false;
    this.cart = null;
    this.availableDiscounts = [];
    this.showingAllOffers = false;
    this.productCompareAtPrices = {};
    this.reactRoot = null; // Single React root for the entire drawer
    this.cartJustUpdated = false; // Track if cart was just updated via add to cart
    this.unlockedMilestone = null; // Currently unlocked milestone
    this.milestones = []; // All milestones from API
    this.isSyncingGifts = false; // Prevent concurrent gift syncing
    this.freeGifts = []; // Free gift offers
    this.selectedGiftId = null; // Currently selected gift
    this.pendingOperations = new Set(); // Track pending cart operations by item key

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

      // Load free gifts if enabled
      if (this.config?.features?.freeGiftsEnabled) {
        await this.loadFreeGifts();
      }
    } catch (error) {
      console.error('Upsellity: Failed to load config', error);
      this.config = { enabled: false, features: {} };
    }
  }

  async loadFreeGifts() {
    try {
      // Prevent concurrent gift syncing to avoid infinite loops
      if (this.isSyncingGifts) {
        console.log('Upsellity Free Gifts: Already syncing, skipping');
        return;
      }

      // Calculate cart total EXCLUDING gift items to prevent circular dependency
      // This ensures that if a gift was added earlier, it doesn't count towards the threshold
      const cartTotalExcludingGifts = MilestoneRewardManager.calculateCartTotalExcludingGifts(this.cart);
      console.log('Upsellity Free Gifts: Cart total check', {
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
        console.log('Upsellity Free Gifts: API returned gifts, syncing');
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
        console.log('Upsellity Free Gifts: No gifts from API, not syncing (milestone has priority)');
        // API returned no gifts - this means milestone has priority
        // Don't remove anything, let milestone handle it
        this.selectedGiftId = null;
      }
    } catch (error) {
      console.error('Upsellity: Failed to load free gifts', error);
    }
  }

  async loadMilestones() {
    try {
      const appUrl = document.querySelector('[data-upsellity-app-url]')?.dataset.upsellityAppUrl;
      if (!appUrl) return;

      // CRITICAL FIX: Use original cart total (before discounts) for milestone calculation
      // This ensures milestones are calculated from the original cart value, not the discounted subtotal
      const cartTotalInCents = MilestoneRewardManager.calculateCartTotalExcludingGifts(this.cart);
      const cartTotal = cartTotalInCents / 100; // Convert cents to rupees
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
      console.log('Upsellity Milestones: Already syncing, skipping');
      return;
    }

    try {
      this.isSyncingGifts = true;
      console.log('Upsellity Milestones: Starting sync');

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

      console.log('Upsellity Milestones: Sync complete');
    } catch (error) {
      console.error('Upsellity Milestones: Error handling rewards', error);
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
        const response = await fetch('/cart.js');
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
        ProductLoader.loadShopifyRecommendations(this.cart, this.config)
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

  // OPTIMIZATION: Load milestones and gifts asynchronously without blocking
  async loadSecondaryDataAsync() {
    try {
      if (this.config?.features?.milestonesEnabled) {
        await this.loadMilestones();
      } else {
        // If milestones are disabled, remove any milestone gifts from cart
        const allGifts = MilestoneRewardManager.getAllGiftsInCart(this.cart);
        if (allGifts.length > 0) {
          for (const giftItem of allGifts) {
            await MilestoneRewardManager.removeGiftFromCart(giftItem.key);
          }
          // Reload cart after cleanup
          const response = await fetch('/cart.js');
          this.cart = await response.json();
        }
      }

      if (this.config?.features?.freeGiftsEnabled) {
        await this.loadFreeGifts();
      }

      // Re-render after milestones/gifts are loaded
      this.render();
    } catch (error) {
      console.error('Upsellity: Failed to load secondary data', error);
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

    // Debug logging
    console.log('Upsellity Cart Drawer Render:', {
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
        onAddProductToCart: (variantId) => this.addProductToCart(variantId, 1, { '_upsell_source': 'cart_drawer_recommendation' }),
        onUpdateQuantity: (itemKey, newQuantity) => this.updateQuantity(itemKey, newQuantity),
        onRemoveItem: (itemKey) => this.removeItem(itemKey),
        onApplyCoupon: (code) => this.applyCouponWithCode(code),
        onRemoveDiscount: () => this.removeDiscount(),
        onSwitchDiscount: (code) => this.switchDiscount(code),
        onSlideCtaClick: (url) => this.handleSlideCtaClick(url),
        onSelectGift: (giftId, variantId) => this.handleSelectGift(giftId, variantId),
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

  // Handle gift selection
  async handleSelectGift(giftId, variantId) {
    // Get the free gift object
    const freeGift = this.freeGifts && this.freeGifts.length > 0 ? this.freeGifts[0] : null;

    if (!freeGift) {
      console.error('Upsellity: No free gift available');
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
      console.log('Upsellity: Starting checkout process', {
        hasFreeGifts: this.freeGifts && this.freeGifts.length > 0,
        hasUnlockedMilestone: !!this.unlockedMilestone,
        cartTotal: this.cart?.total_price / 100
      });

      // Check free gifts first - only if qualified
      if (this.freeGifts && this.freeGifts.length > 0 && this.freeGifts[0].qualified) {
        console.log('Upsellity: Free gift is qualified, checking discount code');

        // If free gift has discount code, use it for checkout
        if (this.freeGifts[0].discountCode) {
          console.log('Upsellity: Using free gift discount code', this.freeGifts[0].discountCode);
          const checkoutUrl = FreeGiftManager.getCheckoutUrlWithDiscount(this.freeGifts[0]);
          window.location.href = checkoutUrl;
          return;
        } else {
          console.log('Upsellity: Free gift has no discount code, proceeding to normal checkout');
          // Free gift is in cart but no discount code configured
          // This is OK - the BXGY automatic discount will apply at checkout
          // Continue to next priority
        }
      }

      // Priority 1: Use milestone discount if available
      if (this.unlockedMilestone && this.unlockedMilestone.discountCode) {
        console.log('Upsellity: Using milestone discount', this.unlockedMilestone.discountCode);
        // Validate milestone before checkout
        const validation = await MilestoneRewardManager.validateMilestoneForCheckout(
          this.unlockedMilestone,
          this.cart
        );

        if (!validation.valid) {
          console.log('Upsellity: Milestone validation failed', validation.message);
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
        console.log('Upsellity: Redirecting to checkout with milestone discount', checkoutUrl);
        window.location.href = checkoutUrl;
        return;
      }

      // Priority 2: Use manually applied discount (coupon code)
      const appliedDiscount = this.getDiscountFromCart();
      if (appliedDiscount && appliedDiscount.code) {
        console.log('Upsellity: Using manually applied discount', appliedDiscount.code);
        const checkoutUrl = DiscountManager.getCheckoutUrl(appliedDiscount.code);
        window.location.href = checkoutUrl;
        return;
      }

      // Priority 3: No discount, proceed to normal checkout
      console.log('Upsellity: Proceeding to normal checkout');
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
    // Check if there's already a pending operation for this item
    if (this.pendingOperations.has(itemKey)) {
      console.log('Upsellity: Operation already pending for item', itemKey);
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
      console.log('Upsellity: Operation already pending for item', itemKey);
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

    const success = await DiscountManager.applyDiscountCode(discountCode, this.loadCart.bind(this));

    if (success) {
      this.showingAllOffers = false;

      // Clear removal preference when user manually switches to a discount
      AutoApplyStorage.clearDiscountRemoval();

      await this.loadCart();
    }
  }

}

