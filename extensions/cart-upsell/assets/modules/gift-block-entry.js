/**
 * Gifting Block Entry Point
 * Standalone free gifts feature that can be embedded anywhere on the site
 * 
 * Pattern: Based on milestone-block-entry.js
 * Last Updated: 2026-01-22
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { GiftingBlockWrapper } from './components/GiftingBlockWrapper.jsx';
import { Analytics } from './analytics.js';
import {
    loadGiftingBlockGifts,
    syncFreeGiftWithCart,
    selectGift,
    getSelectedGiftFromCart
} from './free-gift-manager.js';
import { calculateCartTotalExcludingGifts } from './milestone-reward-manager.js';

// App URL is injected at build time from config.js
const APP_URL = typeof __APP_URL__ !== 'undefined' ? __APP_URL__ : 'https://app.upsellity.com';

// Version info
const VERSION = typeof __GIFT_BLOCK_VERSION__ !== 'undefined'
    ? __GIFT_BLOCK_VERSION__
    : '1.0.0';

// Initialize gifting blocks
function initGiftingBlocks() {
    // Find all gifting block containers
    const containers = document.querySelectorAll('.upsellity-gifting-container');

    if (containers.length === 0) {
        console.log('Upsellity Gifting Block: No containers found');
        return;
    }

    console.log(`Upsellity Gifting Block: Initializing ${containers.length} container(s)`);

    containers.forEach((container) => {
        const shop = container.getAttribute('data-shop');

        if (!shop) {
            console.error('Upsellity Gifting Block: Missing data-shop attribute');
            return;
        }

        // Initialize Analytics with the app URL
        Analytics.init(APP_URL);

        // Track React root and processing state
        let root = null;
        let isProcessingGifts = false;

        // Function to fetch cart data
        const fetchCart = async () => {
            try {
                // Add timestamp to prevent caching issues
                const response = await fetch(`/cart.js?v=${new Date().getTime()}`, {
                    headers: {
                        'Cache-Control': 'no-cache',
                        'Pragma': 'no-cache'
                    }
                });
                const cart = await response.json();
                return cart;
            } catch (error) {
                console.error('Upsellity Gifting Block: Failed to fetch cart', error);
                return { total_price: 0, items: [] };
            }
        };

        // Function to fetch cart total (using ORIGINAL prices, excluding gifts)
        const fetchCartTotal = async () => {
            const cart = await fetchCart();
            const cartTotalInCents = calculateCartTotalExcludingGifts(cart);
            const cartTotalInRupees = cartTotalInCents / 100;
            console.log('Upsellity Gifting Block: Cart total (excl. gifts):', cartTotalInRupees);
            return cartTotalInRupees;
        };

        const renderGiftBlock = (gift, selectedGiftId) => {
            // Make container visible
            container.style.display = 'block';

            if (!root) {
                // Clear any existing HTML (like loading spinners)
                container.innerHTML = '';
                root = createRoot(container);
            }

            root.render(
                <GiftingBlockWrapper
                    gift={gift}
                    selectedGiftId={selectedGiftId}
                    shop={shop}
                    isPreview={false}
                    onSelectGift={async (giftId, variantId) => {
                        console.log('Upsellity Gifting Block: User selecting gift', variantId);
                        await selectGift(variantId, gift, async () => {
                            // Reload cart after selection
                            await new Promise(resolve => setTimeout(resolve, 500));
                            await handleCartUpdate();
                        });
                    }}
                    onImpression={() => {
                        Analytics.track({
                            eventType: 'impression',
                            component: 'gifting_block',
                            value: 0
                        });
                    }}
                />
            );
        };

        const clearGiftBlock = () => {
            container.style.display = 'none';
            if (root) {
                root.render(null);
            } else {
                container.innerHTML = '';
            }
        };

        // Handle cart updates and gift synchronization
        const handleCartUpdate = async () => {
            if (isProcessingGifts) {
                console.log('Upsellity Gifting Block: Already processing, skipping');
                return;
            }

            try {
                isProcessingGifts = true;

                // Fetch fresh cart data
                const cart = await fetchCart();
                const newCartTotal = await fetchCartTotal();

                // Load updated gifts
                const updatedGifts = await loadGiftingBlockGifts(APP_URL, shop, cart, newCartTotal);

                if (!updatedGifts || updatedGifts.length === 0) {
                    console.log('Upsellity Gifting Block: No qualified gifts, hiding block and cleaning up');

                    // CRITICAL FIX: Ensure we clean up any existing gifts in the cart
                    // Pass null as the gift to trigger removal of all 'gifting_block' gifts
                    await syncFreeGiftWithCart(null, cart, async () => {
                        // Wait a bit for removal to process
                        await new Promise(resolve => setTimeout(resolve, 300));
                    });

                    clearGiftBlock();
                    return;
                }

                const newQualifiedGift = updatedGifts[0];

                console.log('Upsellity Gifting Block: Qualified gift:', newQualifiedGift);

                // Sync gift with cart (auto-add for single, wait for selection for multiple)
                await syncFreeGiftWithCart(newQualifiedGift, cart, async () => {
                    await new Promise(resolve => setTimeout(resolve, 500));
                });

                // Get currently selected gift from cart
                const selectedGiftId = getSelectedGiftFromCart(cart, newQualifiedGift);

                // Re-render with updated data
                renderGiftBlock(newQualifiedGift, selectedGiftId);

            } catch (error) {
                console.error('Upsellity Gifting Block: Error handling cart update', error);

                // Only show error UI if we haven't rendered anything yet
                if (!root && container.style.display !== 'none') {
                    container.innerHTML = `
                      <div style="
                        padding: 16px;
                        text-align: center;
                        background: #fef2f2;
                        border-radius: 8px;
                        border: 1px solid #fecaca;
                      ">
                        <p style="
                          color: #991b1b;
                          font-size: 13px;
                          margin: 0;
                        ">Failed to load gifts</p>
                      </div>
                    `;
                }
            } finally {
                isProcessingGifts = false;
            }
        };

        // Initial setup
        const init = async () => {
            // Show loading state ONLY if we don't have a root yet (initial load)
            if (!root) {
                container.innerHTML = `
                  <div style="
                    padding: 20px;
                    text-align: center;
                    background: #f9fafb;
                    border-radius: 8px;
                    border: 1px solid #e5e7eb;
                  ">
                    <div style="
                      display: inline-block;
                      width: 20px;
                      height: 20px;
                      border: 2px solid #e5e7eb;
                      border-top-color: #16a34a;
                      border-radius: 50%;
                      animation: spin 1s linear infinite;
                    "></div>
                    <p style="
                      margin-top: 8px;
                      color: #6b7280;
                      font-size: 13px;
                    ">Loading gifts...</p>
                  </div>
                  <style>
                    @keyframes spin {
                      to { transform: rotate(360deg); }
                    }
                  </style>
                `;
            }

            await handleCartUpdate();

            // Add listeners AFTER initial load (or concurrently, but safer here)
            const cartEvents = ['cart:updated', 'cart:change', 'cart:refresh'];
            cartEvents.forEach(eventName => {
                document.addEventListener(eventName, () => handleCartUpdate());
            });

            if (window.Shopify && window.Shopify.theme) {
                document.addEventListener('theme:cart:change', () => handleCartUpdate());
            }

            // Polling
            let lastCartTotal = 0;
            // Initial polling baseline
            fetchCartTotal().then(t => lastCartTotal = t);

            setInterval(async () => {
                if (isProcessingGifts) return;
                const currentTotal = await fetchCartTotal();
                if (Math.abs(currentTotal - lastCartTotal) > 0.01) {
                    console.log('Upsellity Gifting Block: Cart total changed via polling');
                    lastCartTotal = currentTotal;
                    await handleCartUpdate();
                }
            }, 3000);
        };

        // Start initialization
        init();
    });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGiftingBlocks);
} else {
    initGiftingBlocks();
}

// Also watch for dynamically added containers
if (typeof MutationObserver !== 'undefined') {
    const observer = new MutationObserver((mutations) => {
        let shouldInit = false;
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1) {
                    if (node.classList?.contains('upsellity-gifting-container') ||
                        node.querySelector?.('.upsellity-gifting-container')) {
                        shouldInit = true;
                    }
                }
            });
        });
        if (shouldInit) {
            initGiftingBlocks();
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

console.log(`Upsellity Gifting Block v${VERSION} loaded`);
