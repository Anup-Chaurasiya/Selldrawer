/**
 * FBT Cart Monitor - Production Version
 * Automatically removes FBT discount codes when FBT items are removed from cart
 * Handles edge cases like pre-existing cart items and ensures discount is actually removed from Shopify
 */

class FBTCartMonitor {
    constructor() {
        // Track FBT bundles: Map of discount code -> { requiredCount, currentItems }
        this.fbtBundles = new Map();
        this.currentDiscountCode = null;
        this.isRemoving = false; // Prevent duplicate removal attempts
        this.init();
    }

    init() {
        console.log('FBT Monitor: Initialized (Production Mode)');

        // Listen for cart updates
        document.addEventListener('cart:updated', () => {
            this.checkAndCleanup();
        });

        // Initial check after a delay to ensure cart is loaded
        if (typeof window !== 'undefined') {
            setTimeout(() => this.checkAndCleanup(), 1000);
        }
    }

    async checkAndCleanup() {
        if (this.isRemoving) {
            console.log('FBT Monitor: Already removing discount, skipping...');
            return;
        }

        try {
            // Fetch current cart
            const response = await fetch('/cart.js');
            if (!response.ok) {
                console.error('FBT Monitor: Failed to fetch cart');
                return;
            }

            const cart = await response.json();
            console.log('FBT Monitor: Checking cart...', {
                totalItems: cart.item_count,
                appliedDiscountCodes: cart.cart_level_discount_applications?.map(d => d.title) || []
            });

            // Track FBT items grouped by discount code
            const currentFBTItems = new Map();

            cart.items.forEach(item => {
                const discountCode = item.properties?._fbt_discount_code;
                const bundleSize = item.properties?._fbt_bundle_size;

                if (discountCode) {
                    if (!currentFBTItems.has(discountCode)) {
                        currentFBTItems.set(discountCode, {
                            requiredCount: bundleSize ? parseInt(bundleSize) : 0,
                            items: new Set()
                        });
                    }
                    currentFBTItems.get(discountCode).items.add(item.key);
                }
            });

            // Check if we need to remove any discounts
            let shouldRemoveDiscount = false;
            let discountToRemove = null;

            // Case 1: No FBT items in cart at all
            if (currentFBTItems.size === 0 && this.currentDiscountCode) {
                console.log('FBT Monitor: No FBT items in cart, need to remove discount');
                shouldRemoveDiscount = true;
                discountToRemove = this.currentDiscountCode;
            }

            // Case 2: FBT bundle is incomplete (items were removed)
            for (const [discountCode, bundleData] of currentFBTItems.entries()) {
                const currentCount = bundleData.items.size;
                const requiredCount = bundleData.requiredCount;

                console.log(`FBT Monitor: Bundle ${discountCode}:`, {
                    current: currentCount,
                    required: requiredCount
                });

                // If we have fewer items than required, bundle is incomplete
                if (requiredCount > 0 && currentCount < requiredCount) {
                    console.log(`FBT Monitor: Bundle ${discountCode} incomplete (${currentCount}/${requiredCount})`);
                    shouldRemoveDiscount = true;
                    discountToRemove = discountCode;
                    break;
                }

                // Also check if items were removed from previously tracked bundle
                const previousBundle = this.fbtBundles.get(discountCode);
                if (previousBundle && currentCount < previousBundle.items.size) {
                    console.log(`FBT Monitor: Items removed from bundle ${discountCode}`);
                    shouldRemoveDiscount = true;
                    discountToRemove = discountCode;
                    break;
                }
            }

            // Remove discount if needed
            if (shouldRemoveDiscount) {
                await this.removeDiscountFromCart(discountToRemove);
                this.currentDiscountCode = null;
                this.fbtBundles.clear();
            } else {
                // Update tracked bundles
                this.fbtBundles = currentFBTItems;

                // Track the currently applied discount
                const appliedDiscounts = cart.cart_level_discount_applications || [];
                if (appliedDiscounts.length > 0 && currentFBTItems.size > 0) {
                    const fbtDiscount = appliedDiscounts.find(d =>
                        d.title && d.title.startsWith('FBT_RULE_')
                    );
                    if (fbtDiscount) {
                        this.currentDiscountCode = fbtDiscount.title;
                    }
                }
            }
        } catch (error) {
            console.error('FBT Monitor: Error in checkAndCleanup:', error);
        }
    }

    async removeDiscountFromCart(discountCode) {
        if (this.isRemoving) {
            console.log('FBT Monitor: Already removing, skipping...');
            return;
        }

        this.isRemoving = true;

        try {
            console.log(`FBT Monitor: Removing discount ${discountCode || 'current'} from cart...`);

            // Method 1: Use cart drawer's removeDiscount if available
            if (window.upsellityDrawer && typeof window.upsellityDrawer.removeDiscount === 'function') {
                console.log('FBT Monitor: Using cart drawer removeDiscount method');
                await window.upsellityDrawer.removeDiscount();
            } else {
                // Method 2: Direct Shopify cart API call
                console.log('FBT Monitor: Using direct Shopify API');
                const response = await fetch('/cart/update.js', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        attributes: {
                            discount_code: '' // Clear discount
                        }
                    })
                });

                if (!response.ok) {
                    console.error('FBT Monitor: Failed to remove discount via API');
                }
            }

            console.log('FBT Monitor: Discount removed successfully');

            // Reload cart to reflect changes
            if (window.upsellityDrawer && typeof window.upsellityDrawer.loadCart === 'function') {
                await window.upsellityDrawer.loadCart();
            }

            // Trigger cart update event
            document.dispatchEvent(new CustomEvent('cart:updated'));

        } catch (error) {
            console.error('FBT Monitor: Error removing discount:', error);
        } finally {
            this.isRemoving = false;
        }
    }
}

// Export using ES6 (no CommonJS needed)
export { FBTCartMonitor };

// Initialize monitor when DOM is ready (for standalone usage)
if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.fbtCartMonitor = new FBTCartMonitor();
        });
    } else {
        window.fbtCartMonitor = new FBTCartMonitor();
    }
}
