/**
 * Enhanced Cart Operations Module
 * Provides robust cart operations with error handling, retries, and verification
 */

const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_RETRY_DELAY = 300;
const CART_UPDATE_VERIFICATION_TIMEOUT = 2000;

class CartOperations {
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
                    // Exponential backoff: 300ms, 600ms, 1200ms
                    const delay = baseDelay * Math.pow(2, attempt - 1);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }

        throw new Error(`Cart operation failed after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`);
    }

    /**
     * Fetch current cart state
     * @returns {Promise<Object>} Current cart data
     */
    async getCart() {
        return this.retryOperation(async () => {
            const response = await fetch('/cart.js', {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                },
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
                const response = await fetch('/cart/add.js', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ items }),
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

            // Verify items were added if requested
            if (verify) {
                await new Promise(resolve => setTimeout(resolve, 150));
                const cart = await this.getCart();

                // Check if all items exist in cart
                const allItemsAdded = items.every(item => {
                    const itemId = this.normalizeVariantId(item.id);
                    return cart.items.some(cartItem => {
                        const cartItemId = this.normalizeVariantId(cartItem.variant_id || cartItem.id);
                        return cartItemId === itemId;
                    });
                });

                if (!allItemsAdded) {
                    console.warn('Not all items were verified in cart');
                }
            }

            return { success: true, data: result };
        } catch (error) {
            console.error('Add to cart failed:', error);
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
                const response = await fetch('/cart/change.js', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        id: itemKey,
                        quantity: 0
                    }),
                });

                if (!response.ok) {
                    throw new Error(`Failed to remove from cart: ${response.status}`);
                }

                return await response.json();
            }, maxRetries);

            // Verify item was removed
            if (verify) {
                await new Promise(resolve => setTimeout(resolve, 150));
                const cart = await this.getCart();
                const itemStillExists = cart.items.some(item => item.key === itemKey);

                if (itemStillExists) {
                    throw new Error('Item not removed from cart');
                }
            }

            return { success: true };
        } catch (error) {
            console.error('Remove from cart failed:', error);
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
            // Step 1: Remove old item
            const removeResult = await this.removeFromCart(oldItemKey, { verify: true, maxRetries });
            if (!removeResult.success) {
                throw new Error(`Failed to remove old item: ${removeResult.error}`);
            }

            // Step 2: Add new items
            const addResult = await this.addToCart(newItems, { verify: true, maxRetries });
            if (!addResult.success) {
                throw new Error(`Failed to add new items: ${addResult.error}`);
            }

            return { success: true };
        } catch (error) {
            console.error('Replace cart item failed:', error);
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

            return cart.items.some(item => {
                const itemId = this.normalizeVariantId(item.variant_id || item.id);
                return itemId === normalizedId;
            });
        } catch (error) {
            console.error('Error verifying product in cart:', error);
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
                // If we successfully got the cart, it's ready
                return true;
            } catch (error) {
                // If cart is locked or unavailable, wait and retry
                await new Promise(resolve => setTimeout(resolve, 100));
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

            return cart.items.find(item => {
                const itemId = this.normalizeVariantId(item.variant_id || item.id);
                return itemId === normalizedId;
            }) || null;
        } catch (error) {
            console.error('Error finding cart item:', error);
            return null;
        }
    }

    /**
     * Normalize variant ID to consistent format (numeric string)
     * @param {string|number} variantId - Variant ID in any format
     * @returns {string} Normalized variant ID
     */
    normalizeVariantId(variantId) {
        if (!variantId) return '';

        let id = String(variantId);

        // Remove GID prefix if present
        if (id.includes('gid://shopify/ProductVariant/')) {
            id = id.replace('gid://shopify/ProductVariant/', '');
        }

        // Extract numeric part only
        const numericId = id.replace(/\D/g, '');

        return numericId;
    }

    /**
     * Get checkout URL (handles custom checkout apps)
     * @returns {string} Checkout URL
     */
    getCheckoutUrl() {
        // Check for custom checkout URL in theme settings
        if (typeof Shopify !== 'undefined' && Shopify.routes && Shopify.routes.root) {
            // Remove trailing slash to prevent double slashes
            const root = Shopify.routes.root.replace(/\/$/, '');
            return `${root}/checkout`;
        }

        return '/checkout';
    }

    /**
     * Validate variant ID format
     * @param {string|number} variantId - Variant ID to validate
     * @returns {boolean} True if valid
     */
    isValidVariantId(variantId) {
        if (!variantId) return false;

        const normalized = this.normalizeVariantId(variantId);
        const numericId = parseInt(normalized, 10);

        return !isNaN(numericId) && numericId > 0;
    }

    /**
     * Trigger cart updated event
     */
    triggerCartUpdated() {
        document.dispatchEvent(new CustomEvent('cart:updated', { bubbles: true }));
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

        // If variant ID provided, try to find it
        if (variantId) {
            const normalizedId = this.normalizeVariantId(variantId);
            const variant = productData.variants.find(v => {
                const vId = this.normalizeVariantId(v.id);
                return vId === normalizedId;
            });

            if (variant) return variant;
        }

        // Return first variant as fallback
        return productData.variants[0];
    }
}

// Export singleton instance
const cartOps = new CartOperations();
export { cartOps };
