/**
 * Milestone Block Entry Point
 * Standalone milestone progress block that can be embedded anywhere on the site
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { MilestoneBlockWrapper } from './components/MilestoneBlockWrapper.jsx';
import { Analytics } from './analytics.js';
import {
  handleMilestoneRewards,
  getCheckoutUrlWithDiscount,
  evaluateMilestones,
  showMilestoneUnlockedNotification
} from './milestone-reward-manager.js';

// App URL is injected at build time from config.js
const APP_URL = typeof __APP_URL__ !== 'undefined' ? __APP_URL__ : 'https://app.upsellity.com';

// Version info
const VERSION = typeof __MILESTONE_BLOCK_VERSION__ !== 'undefined'
  ? __MILESTONE_BLOCK_VERSION__
  : '1.0.0';

// Initialize milestone blocks
function initMilestoneBlocks() {
  // Find all milestone block containers
  const containers = document.querySelectorAll('.upsellity-milestone-container');

  if (containers.length === 0) {
    return;
  }

  containers.forEach((container) => {
    const shop = container.getAttribute('data-shop');

    if (!shop) {
      return;
    }

    // Show loading state
    container.innerHTML = `
      <div style="
        padding: 40px 20px;
        text-align: center;
        background: #f9fafb;
        border-radius: 12px;
        border: 1px solid #e5e7eb;
      ">
        <div style="
          display: inline-block;
          width: 24px;
          height: 24px;
          border: 3px solid #e5e7eb;
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        "></div>
        <p style="
          margin-top: 12px;
          color: #6b7280;
          font-size: 14px;
        ">Loading milestone progress...</p>
      </div>
      <style>
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      </style>
    `;

    // Initialize Analytics with the app URL
    Analytics.init(APP_URL);

    // Function to fetch cart data
    const fetchCart = async () => {
      try {
        const response = await fetch('/cart.js');
        const cart = await response.json();
        return cart;
      } catch (error) {
        return { total_price: 0, items: [] };
      }
    };

    // Function to fetch cart total
    const fetchCartTotal = async () => {
      const cart = await fetchCart();
      return cart.total_price / 100; // Convert cents to currency
    };

    // Function to replace placeholders in messages
    const replacePlaceholders = (message, milestone, remaining) => {
      if (!message) return '';

      return message
        .replace(/{remaining}/g, `₹${remaining.toFixed(0)}`)
        .replace(/{reward}/g, milestone.title)
        .replace(/{target}/g, `₹${milestone.targetAmount.toFixed(0)}`)
        .replace(/{amount}/g, `₹${milestone.targetAmount.toFixed(0)}`);
    };

    // Function to calculate milestone status and messages
    const processMilestones = (milestones, cartTotal) => {
      return milestones.map(milestone => {
        const targetAmount = milestone.targetAmount;
        const progress = Math.min((cartTotal / targetAmount) * 100, 100);
        const remaining = Math.max(targetAmount - cartTotal, 0);

        let status = 'locked';
        let message = '';

        if (cartTotal >= targetAmount) {
          status = 'unlocked';
          message = milestone.unlockedMessage
            ? replacePlaceholders(milestone.unlockedMessage, milestone, remaining)
            : `🎉 ${milestone.title} unlocked!`;
        } else if (cartTotal > 0) {
          status = 'in_progress';
          message = milestone.inProgressMessage
            ? replacePlaceholders(milestone.inProgressMessage, milestone, remaining)
            : `₹${remaining.toFixed(0)} away from ${milestone.title}`;
        } else {
          status = 'locked';
          message = milestone.lockedMessage
            ? replacePlaceholders(milestone.lockedMessage, milestone, remaining)
            : `Spend ₹${targetAmount.toFixed(0)} to unlock ${milestone.title}`;
        }

        return {
          ...milestone,
          status,
          progress,
          remaining,
          message,
        };
      });
    };

    // Function to fetch and render milestone data
    const fetchAndRender = async () => {
      try {
        // Fetch milestone data
        const apiUrl = `${APP_URL}/api/milestone-block?shop=${encodeURIComponent(shop)}`;

        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Clear loading state
        container.innerHTML = '';

        // Check if milestone block is enabled and has milestones
        if (!data.enabled || !data.milestones || data.milestones.length === 0) {
          container.style.display = 'none';
          return;
        }

        // Fetch current cart total
        const cartTotal = await fetchCartTotal();

        // Process milestones with current cart total
        const processedMilestones = processMilestones(data.milestones, cartTotal);

        // Create React root and render
        const root = createRoot(container);

        const renderMilestones = (milestones, total) => {
          root.render(
            <MilestoneBlockWrapper
              milestones={milestones}
              cartTotal={total}
              progressBarColor={data.progressBarColor}
              allUnlockedMessage={data.allUnlockedMessage}
              shop={shop}
              isPreview={false}
              onImpression={() => {
                Analytics.track({
                  eventType: 'impression',
                  component: 'milestone_block',
                  value: 0
                });
              }}
            />
          );
        };

        // Track last unlocked milestone and processing state
        let lastUnlockedMilestone = null;
        let isProcessingRewards = false;
        let updateTimeout = null;

        // Initial render
        renderMilestones(processedMilestones, cartTotal);

        // Unified function to handle cart updates and milestone rewards
        const handleCartUpdate = async (skipRewardSync = false) => {
          // Prevent concurrent processing
          if (isProcessingRewards) {
            return;
          }

          try {
            isProcessingRewards = true;

            // Fetch fresh cart data
            const cart = await fetchCart();
            const newCartTotal = cart.total_price / 100;

            // Update UI with new milestones
            const updatedMilestones = processMilestones(data.milestones, newCartTotal);
            renderMilestones(updatedMilestones, newCartTotal);

            // Skip reward sync if requested (to avoid loops)
            if (skipRewardSync) {
              return;
            }

            // Handle milestone rewards (gifts and discounts)
            const newUnlockedMilestone = await handleMilestoneRewards(
              data.milestones,
              cart,
              async () => {
                // Wait longer for cart to update
                await new Promise(resolve => setTimeout(resolve, 1000));

                // Refresh UI after reward sync (skip further reward sync to avoid loop)
                await handleCartUpdate(true);
              }
            );

            // Show notification if a new milestone was unlocked
            if (newUnlockedMilestone &&
              (!lastUnlockedMilestone || newUnlockedMilestone.id !== lastUnlockedMilestone.id)) {
              showMilestoneUnlockedNotification(newUnlockedMilestone);
            }

            // Update last unlocked milestone
            lastUnlockedMilestone = newUnlockedMilestone;

          } catch (error) {
            // Error handling cart update
          } finally {
            isProcessingRewards = false;
          }
        };

        // Debounced update function to prevent rapid firing
        const debouncedUpdate = () => {
          if (updateTimeout) {
            clearTimeout(updateTimeout);
          }
          updateTimeout = setTimeout(() => {
            handleCartUpdate();
          }, 300);
        };

        // Initial milestone reward handling
        await handleCartUpdate();

        // Listen for multiple cart update events
        const cartEvents = ['cart:updated', 'cart:change', 'cart:refresh'];
        cartEvents.forEach(eventName => {
          document.addEventListener(eventName, debouncedUpdate);
        });

        // Also listen for Shopify theme cart drawer events
        if (window.Shopify && window.Shopify.theme) {
          document.addEventListener('theme:cart:change', debouncedUpdate);
        }

        // Poll cart periodically as fallback (every 3 seconds)
        let lastCartTotal = cartTotal;
        const pollInterval = setInterval(async () => {
          if (isProcessingRewards) {
            return; // Skip if already processing
          }

          const cart = await fetchCart();
          const currentTotal = cart.total_price / 100;

          if (Math.abs(currentTotal - lastCartTotal) > 0.01) { // Check for meaningful change
            lastCartTotal = currentTotal;
            await handleCartUpdate();
          }
        }, 3000);

        // Override checkout buttons to include discount code
        const overrideCheckoutButtons = () => {
          const checkoutButtons = document.querySelectorAll('button[name="checkout"], a[href="/checkout"], input[name="checkout"]');
          checkoutButtons.forEach(button => {
            button.addEventListener('click', async (e) => {
              const cart = await fetchCart();
              const unlockedMilestone = evaluateMilestones(data.milestones, cart);

              if (unlockedMilestone && unlockedMilestone.discountCode) {
                e.preventDefault();
                const checkoutUrl = getCheckoutUrlWithDiscount(unlockedMilestone);
                window.location.href = checkoutUrl;
              }
            });
          });
        };

        // Override checkout buttons after a delay to ensure they're loaded
        setTimeout(overrideCheckoutButtons, 1000);

        // Re-override when cart drawer opens
        document.addEventListener('cart:opened', () => {
          setTimeout(overrideCheckoutButtons, 500);
        });

      } catch (error) {
        container.innerHTML = `
          <div style="
            padding: 20px;
            text-align: center;
            background: #fef2f2;
            border-radius: 12px;
            border: 1px solid #fecaca;
          ">
            <p style="
              color: #991b1b;
              font-size: 14px;
              margin: 0;
            ">Failed to load milestone progress</p>
          </div>
        `;
      }
    };

    // Initial fetch and render
    fetchAndRender();
  });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMilestoneBlocks);
} else {
  initMilestoneBlocks();
}

// Also watch for dynamically added containers
if (typeof MutationObserver !== 'undefined') {
  const observer = new MutationObserver((mutations) => {
    let shouldInit = false;
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === 1) { // Element node
          if (node.classList?.contains('upsellity-milestone-container') ||
            node.querySelector?.('.upsellity-milestone-container')) {
            shouldInit = true;
          }
        }
      });
    });
    if (shouldInit) {
      initMilestoneBlocks();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}
