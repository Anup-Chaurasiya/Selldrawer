"use strict";
(() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));

  // extensions/cart-upsell/assets/modules/cart-operations-enhanced.js
  var DEFAULT_MAX_RETRIES = 3;
  var DEFAULT_RETRY_DELAY = 300;
  var CART_UPDATE_VERIFICATION_TIMEOUT = 2e3;
  var CartOperations = class {
    constructor() {
      this.isOperationInProgress = false;
      this.operationQueue = [];
    }
    /**
     * Retry a cart operation with exponential backoff
     * @param {Function} operation - The async operation to retry
     * @param {number} maxRetries - Maximum retry attempts
     * @param {number} baseDelay - Base delay between retries (ms)
     * @returns {Promise} Result of the operation
     */
    async retryOperation(operation, maxRetries = DEFAULT_MAX_RETRIES, baseDelay = DEFAULT_RETRY_DELAY) {
      let lastError;
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const result = await operation();
          return result;
        } catch (error) {
          lastError = error;
          console.warn(`Cart operation attempt ${attempt} failed:`, error);
          if (attempt < maxRetries) {
            const delay = baseDelay * Math.pow(2, attempt - 1);
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
        }
      }
      throw new Error(`Cart operation failed after ${maxRetries} attempts: ${(lastError == null ? void 0 : lastError.message) || "Unknown error"}`);
    }
    /**
     * Fetch current cart state
     * @returns {Promise<Object>} Current cart data
     */
    async getCart() {
      return this.retryOperation(async () => {
        const response = await fetch("/cart.js", {
          method: "GET",
          headers: {
            "Accept": "application/json"
          }
        });
        if (!response.ok) {
          throw new Error(`Cart fetch failed: ${response.status}`);
        }
        return await response.json();
      });
    }
    /**
     * Add items to cart with verification
     * @param {Array} items - Array of items to add [{id, quantity, properties}]
     * @param {Object} options - Additional options
     * @returns {Promise<Object>} Result with success status and cart data
     */
    async addToCart(items, options = {}) {
      const { verify = true, maxRetries = DEFAULT_MAX_RETRIES } = options;
      try {
        const result = await this.retryOperation(async () => {
          const response = await fetch("/cart/add.js", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ items })
          });
          if (!response.ok) {
            const errorText = await response.text();
            let errorData;
            try {
              errorData = JSON.parse(errorText);
            } catch (e) {
              errorData = { description: errorText };
            }
            throw new Error(errorData.description || `Failed to add to cart: ${response.status}`);
          }
          return await response.json();
        }, maxRetries);
        if (verify) {
          await new Promise((resolve) => setTimeout(resolve, 150));
          const cart = await this.getCart();
          const allItemsAdded = items.every((item) => {
            const itemId = this.normalizeVariantId(item.id);
            return cart.items.some((cartItem) => {
              const cartItemId = this.normalizeVariantId(cartItem.variant_id || cartItem.id);
              return cartItemId === itemId;
            });
          });
          if (!allItemsAdded) {
            console.warn("Not all items were verified in cart");
          }
        }
        return { success: true, data: result };
      } catch (error) {
        console.error("Add to cart failed:", error);
        return { success: false, error: error.message };
      }
    }
    /**
     * Remove item from cart by key
     * @param {string} itemKey - Cart item key
     * @param {Object} options - Additional options
     * @returns {Promise<Object>} Result with success status
     */
    async removeFromCart(itemKey, options = {}) {
      const { verify = true, maxRetries = DEFAULT_MAX_RETRIES } = options;
      try {
        await this.retryOperation(async () => {
          const response = await fetch("/cart/change.js", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              id: itemKey,
              quantity: 0
            })
          });
          if (!response.ok) {
            throw new Error(`Failed to remove from cart: ${response.status}`);
          }
          return await response.json();
        }, maxRetries);
        if (verify) {
          await new Promise((resolve) => setTimeout(resolve, 150));
          const cart = await this.getCart();
          const itemStillExists = cart.items.some((item) => item.key === itemKey);
          if (itemStillExists) {
            throw new Error("Item not removed from cart");
          }
        }
        return { success: true };
      } catch (error) {
        console.error("Remove from cart failed:", error);
        return { success: false, error: error.message };
      }
    }
    /**
     * Replace a cart item with new items (atomic operation)
     * @param {string} oldItemKey - Key of item to remove
     * @param {Array} newItems - New items to add
     * @param {Object} options - Additional options
     * @returns {Promise<Object>} Result with success status
     */
    async replaceCartItem(oldItemKey, newItems, options = {}) {
      const { maxRetries = DEFAULT_MAX_RETRIES } = options;
      try {
        const removeResult = await this.removeFromCart(oldItemKey, { verify: true, maxRetries });
        if (!removeResult.success) {
          throw new Error(`Failed to remove old item: ${removeResult.error}`);
        }
        const addResult = await this.addToCart(newItems, { verify: true, maxRetries });
        if (!addResult.success) {
          throw new Error(`Failed to add new items: ${addResult.error}`);
        }
        return { success: true };
      } catch (error) {
        console.error("Replace cart item failed:", error);
        return { success: false, error: error.message };
      }
    }
    /**
     * Verify a product is in the cart
     * @param {string|number} variantId - Variant ID to check
     * @returns {Promise<boolean>} True if product is in cart
     */
    async verifyProductInCart(variantId) {
      try {
        const cart = await this.getCart();
        const normalizedId = this.normalizeVariantId(variantId);
        return cart.items.some((item) => {
          const itemId = this.normalizeVariantId(item.variant_id || item.id);
          return itemId === normalizedId;
        });
      } catch (error) {
        console.error("Error verifying product in cart:", error);
        return false;
      }
    }
    /**
     * Wait for cart to be ready (not locked)
     * @param {number} timeout - Max time to wait in ms
     * @returns {Promise<boolean>} True if cart is ready
     */
    async waitForCartReady(timeout = CART_UPDATE_VERIFICATION_TIMEOUT) {
      const startTime = Date.now();
      while (Date.now() - startTime < timeout) {
        try {
          const cart = await this.getCart();
          return true;
        } catch (error) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }
      return false;
    }
    /**
     * Find cart item by variant ID
     * @param {string|number} variantId - Variant ID to find
     * @returns {Promise<Object|null>} Cart item or null
     */
    async findCartItem(variantId) {
      try {
        const cart = await this.getCart();
        const normalizedId = this.normalizeVariantId(variantId);
        return cart.items.find((item) => {
          const itemId = this.normalizeVariantId(item.variant_id || item.id);
          return itemId === normalizedId;
        }) || null;
      } catch (error) {
        console.error("Error finding cart item:", error);
        return null;
      }
    }
    /**
     * Normalize variant ID to consistent format (numeric string)
     * @param {string|number} variantId - Variant ID in any format
     * @returns {string} Normalized variant ID
     */
    normalizeVariantId(variantId) {
      if (!variantId)
        return "";
      let id = String(variantId);
      if (id.includes("gid://shopify/ProductVariant/")) {
        id = id.replace("gid://shopify/ProductVariant/", "");
      }
      const numericId = id.replace(/\D/g, "");
      return numericId;
    }
    /**
     * Get checkout URL (handles custom checkout apps)
     * @returns {string} Checkout URL
     */
    getCheckoutUrl() {
      if (typeof Shopify !== "undefined" && Shopify.routes && Shopify.routes.root) {
        const root = Shopify.routes.root.replace(/\/$/, "");
        return `${root}/checkout`;
      }
      return "/checkout";
    }
    /**
     * Validate variant ID format
     * @param {string|number} variantId - Variant ID to validate
     * @returns {boolean} True if valid
     */
    isValidVariantId(variantId) {
      if (!variantId)
        return false;
      const normalized = this.normalizeVariantId(variantId);
      const numericId = parseInt(normalized, 10);
      return !isNaN(numericId) && numericId > 0;
    }
    /**
     * Trigger cart updated event
     */
    triggerCartUpdated() {
      document.dispatchEvent(new CustomEvent("cart:updated", { bubbles: true }));
    }
    /**
     * Fetch product data from Shopify
     * @param {string} handle - Product handle
     * @returns {Promise<Object|null>} Product data or null
     */
    async fetchProductData(handle) {
      try {
        const response = await fetch(`/products/${handle}.js`);
        if (!response.ok) {
          throw new Error(`Failed to fetch product: ${response.status}`);
        }
        return await response.json();
      } catch (error) {
        console.error(`Error fetching product ${handle}:`, error);
        return null;
      }
    }
    /**
     * Get variant from product data
     * @param {Object} productData - Product data from Shopify
     * @param {string|number} variantId - Preferred variant ID
     * @returns {Object|null} Variant object or null
     */
    getVariantFromProduct(productData, variantId = null) {
      if (!productData || !productData.variants || productData.variants.length === 0) {
        return null;
      }
      if (variantId) {
        const normalizedId = this.normalizeVariantId(variantId);
        const variant = productData.variants.find((v) => {
          const vId = this.normalizeVariantId(v.id);
          return vId === normalizedId;
        });
        if (variant)
          return variant;
      }
      return productData.variants[0];
    }
  };
  var cartOps = new CartOperations();

  // extensions/cart-upsell/assets/modules/analytics.js
  var _a;
  var Analytics = {
    shop: ((_a = window.Shopify) == null ? void 0 : _a.shop) || window.location.hostname,
    appUrl: null,
    init(appUrl) {
      this.appUrl = appUrl;
    },
    getSessionId() {
      try {
        let sessionId = sessionStorage.getItem("selldrawer_session_id");
        if (!sessionId) {
          sessionId = "sess_" + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
          sessionStorage.setItem("selldrawer_session_id", sessionId);
        }
        return sessionId;
      } catch (e) {
        return "sess_" + Date.now();
      }
    },
    track(event) {
      if (!this.shop) {
        return;
      }
      if (!this.appUrl) {
        return;
      }
      const payload = {
        shop: this.shop,
        events: [__spreadProps(__spreadValues({}, event), {
          sessionId: this.getSessionId(),
          url: window.location.href
        })]
      };
      const apiUrl = `${this.appUrl}/api/analytics`;
      if (navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
        const sent = navigator.sendBeacon(apiUrl, blob);
        if (!sent) {
          this.fallbackFetch(apiUrl, payload);
        }
      } else {
        this.fallbackFetch(apiUrl, payload);
      }
    },
    fallbackFetch(apiUrl, payload) {
      fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload),
        keepalive: true
      }).then((response) => {
        if (!response.ok) {
        }
      }).catch((err) => {
      });
    }
  };

  // extensions/cart-upsell/assets/modules/fbt-widget-entry.js
  var FBTWidget = class {
    constructor() {
      this.config = null;
      this.recommendations = [];
      this.parentProduct = null;
      this.selectedProducts = /* @__PURE__ */ new Set();
      this.isLoading = false;
      this.container = null;
      this.shop = null;
    }
    async init() {
      this.container = document.querySelector(".selldrawer-fbt-widget");
      if (!this.container) {
        console.log("Selldrawer: FBT widget container not found");
        return;
      }
      this.shop = this.container.dataset.shop;
      const productHandle = this.container.dataset.productHandle;
      if (!this.shop || !productHandle) {
        console.error("Selldrawer: Missing shop or product handle");
        return;
      }
      const appUrl = true ? "https://java-usual-gentle-candle.trycloudflare.com" : "https://app.selldrawer.com";
      Analytics.init(appUrl);
      await this.loadFBTData(this.shop, productHandle);
    }
    async loadFBTData(shop, productHandle) {
      try {
        const appUrl = true ? "https://java-usual-gentle-candle.trycloudflare.com" : "https://app.selldrawer.com";
        const response = await fetch(`${appUrl}/api/fbt?shop=${encodeURIComponent(shop)}&productHandle=${encodeURIComponent(productHandle)}`);
        if (!response.ok) {
          throw new Error(`Failed to load FBT data: ${response.status}`);
        }
        const data = await response.json();
        if (!data.enabled || !data.config) {
          this.container.style.display = "none";
          return;
        }
        this.config = data.config;
        this.recommendations = data.recommendations || [];
        this.parentProduct = data.parentProduct;
        if (this.parentProduct) {
          this.selectedProducts.add(this.parentProduct.variantId || this.parentProduct.id);
        }
        this.recommendations.forEach((product) => {
          this.selectedProducts.add(product.variantId || product.id);
        });
        this.render();
        if (this.recommendations.length > 0) {
          Analytics.track({
            eventType: "impression",
            component: "fbt_widget",
            productId: productHandle,
            metadata: {
              recommendationCount: this.recommendations.length
            }
          });
        }
      } catch (error) {
        console.error("Selldrawer: Error loading FBT data:", error);
        this.container.style.display = "none";
      }
    }
    render() {
      if (!this.container || !this.config)
        return;
      const html = this.generateHTML();
      this.container.innerHTML = html;
      this.attachEventListeners();
    }
    generateHTML() {
      const { title, buttonText, buttonColor, buttonTextColor, showTotalPrice } = this.config;
      let productsHTML = "";
      if (this.parentProduct) {
        productsHTML += this.generateProductCard(this.parentProduct, true);
      }
      this.recommendations.forEach((product) => {
        productsHTML += this.generateProductCard(product, false);
      });
      const total = this.calculateTotal();
      const totalHTML = showTotalPrice ? `
      <div class="selldrawer-fbt-total">
        <span>Total:</span>
        <span class="selldrawer-fbt-total-price">${this.formatMoney(total)}</span>
      </div>
    ` : "";
      return `
      <div class="selldrawer-fbt-content">
        <h2 class="selldrawer-fbt-title">${title || "Frequently Bought Together"}</h2>
        <div class="selldrawer-fbt-products">
          ${productsHTML}
        </div>
        <div class="selldrawer-fbt-actions">
          ${totalHTML}
          <button 
            class="selldrawer-fbt-add-button"
            style="background-color: ${buttonColor || "#000"}; color: ${buttonTextColor || "#fff"};"
            data-action="add-to-cart"
          >
            ${buttonText || "Add selected to cart"}
          </button>
        </div>
      </div>
    `;
    }
    generateProductCard(product, isParent) {
      const variantId = product.variantId || product.id;
      const isSelected = this.selectedProducts.has(variantId);
      return `
      <div class="selldrawer-fbt-product ${isSelected ? "selected" : ""}" data-variant-id="${variantId}">
        <input 
          type="checkbox" 
          ${isSelected ? "checked" : ""} 
          ${isParent ? "disabled" : ""}
          data-action="toggle-product"
        />
        <img src="${product.imageUrl || ""}" alt="${product.title}" />
        <div class="selldrawer-fbt-product-info">
          <h3>${product.title}</h3>
          <p class="selldrawer-fbt-product-price">${this.formatMoney(product.price)}</p>
        </div>
      </div>
    `;
    }
    attachEventListeners() {
      const checkboxes = this.container.querySelectorAll('[data-action="toggle-product"]');
      checkboxes.forEach((checkbox) => {
        checkbox.addEventListener("change", (e) => {
          const productCard = e.target.closest(".selldrawer-fbt-product");
          const variantId = productCard.dataset.variantId;
          if (e.target.checked) {
            this.selectedProducts.add(variantId);
            productCard.classList.add("selected");
          } else {
            this.selectedProducts.delete(variantId);
            productCard.classList.remove("selected");
          }
          this.updateTotal();
        });
      });
      const addButton = this.container.querySelector('[data-action="add-to-cart"]');
      if (addButton) {
        addButton.addEventListener("click", () => this.handleAddToCart());
      }
    }
    updateTotal() {
      const totalElement = this.container.querySelector(".selldrawer-fbt-total-price");
      if (totalElement) {
        const total = this.calculateTotal();
        totalElement.textContent = this.formatMoney(total);
      }
    }
    calculateTotal() {
      let total = 0;
      if (this.parentProduct && this.selectedProducts.has(this.parentProduct.variantId || this.parentProduct.id)) {
        total += this.parentProduct.price;
      }
      this.recommendations.forEach((product) => {
        if (this.selectedProducts.has(product.variantId || product.id)) {
          total += product.price;
        }
      });
      return total;
    }
    async handleAddToCart() {
      if (this.isLoading || this.selectedProducts.size === 0)
        return;
      this.isLoading = true;
      const button = this.container.querySelector('[data-action="add-to-cart"]');
      if (button) {
        button.disabled = true;
        button.textContent = "Adding...";
      }
      try {
        const bundleId = `fbt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const bundleSize = this.selectedProducts.size;
        const bundleMetadata = this.config.bundleMetadata || {};
        const discountType = bundleMetadata.discountType;
        const discountValue = bundleMetadata.discountValue;
        const hasDiscount = bundleMetadata.hasDiscount;
        const items = [];
        if (this.parentProduct && this.selectedProducts.has(this.parentProduct.variantId || this.parentProduct.id)) {
          items.push({
            id: this.parentProduct.variantId || this.parentProduct.id,
            quantity: 1,
            properties: __spreadValues({
              "_fbt_bundle_id": bundleId,
              "_fbt_bundle_size": bundleSize.toString()
            }, hasDiscount && discountType && discountValue ? {
              "_fbt_discount_type": discountType.toUpperCase(),
              "_fbt_discount_value": discountValue.toString()
            } : {})
          });
        }
        this.recommendations.forEach((product) => {
          const variantId = product.variantId || product.id;
          if (this.selectedProducts.has(variantId)) {
            items.push({
              id: variantId,
              quantity: 1,
              properties: __spreadValues({
                "_fbt_bundle_id": bundleId,
                "_fbt_bundle_size": bundleSize.toString()
              }, hasDiscount && discountType && discountValue ? {
                "_fbt_discount_type": discountType.toUpperCase(),
                "_fbt_discount_value": discountValue.toString()
              } : {})
            });
          }
        });
        const result = await cartOps.addToCart(items);
        if (result.success) {
          Analytics.track({
            eventType: "add_to_cart",
            component: "fbt_widget",
            productId: this.container.dataset.productHandle,
            metadata: {
              bundleSize: items.length,
              hasDiscount,
              discountType,
              discountValue
            }
          });
          if (button) {
            button.textContent = "\u2713 Added to cart!";
            setTimeout(() => {
              button.textContent = this.config.buttonText || "Add selected to cart";
              button.disabled = false;
            }, 2e3);
          }
          if (typeof window.SelldrawerCartDrawer !== "undefined") {
            window.SelldrawerCartDrawer.open();
          } else {
            document.dispatchEvent(new CustomEvent("cart:updated"));
          }
        } else {
          throw new Error(result.error || "Failed to add to cart");
        }
      } catch (error) {
        console.error("Selldrawer: Error adding FBT bundle to cart:", error);
        alert("Failed to add items to cart. Please try again.");
        if (button) {
          button.textContent = this.config.buttonText || "Add selected to cart";
          button.disabled = false;
        }
      } finally {
        this.isLoading = false;
      }
    }
    formatMoney(cents) {
      const dollars = cents / 100;
      return new Intl.NumberFormat(void 0, {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      }).format(dollars);
    }
  };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      const widget = new FBTWidget();
      widget.init();
    });
  } else {
    const widget = new FBTWidget();
    widget.init();
  }
})();
