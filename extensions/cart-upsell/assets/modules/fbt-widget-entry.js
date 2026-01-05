/**
 * Upsellity FBT Widget - Entry Point for Build
 * This file serves as the entry point for bundling all FBT modules
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { FBTWidget } from '../../../../app/components/shared/FBTWidget.tsx';
import { Analytics } from './analytics.js';

// App URL is injected at build time from config.js
const APP_URL = typeof __APP_URL__ !== 'undefined' ? __APP_URL__ : 'https://app.upsellity.com';

class FrequentlyBoughtTogether {
  constructor(container) {
    this.container = container;
    if (!this.container) return;

    this.productHandle = this.container.dataset.productHandle;
    this.productId = this.container.dataset.productId;
    this.shop = this.container.dataset.shop;
    this.selectedProducts = new Set();
    this.config = null;
    this.enabled = false;
    this.recommendations = [];
    this.currentProduct = null;
    this.reactRoot = null;

    this.init();
  }

  async init() {
    try {
      await this.loadConfig();
      if (this.enabled && this.config) {
        await this.loadCurrentProduct();
        await this.loadRecommendations();
        this.render();
      } else {
        this.container.style.display = 'none';
      }
    } catch (error) {
      console.error('FBT Widget Error:', error);
      this.container.style.display = 'none';
    }
  }

  async loadConfig() {
    try {
      // Initialize Analytics with the app URL
      Analytics.init(APP_URL);

      const apiUrl = `${APP_URL}/api/fbt?shop=${encodeURIComponent(this.shop)}&productHandle=${encodeURIComponent(this.productHandle)}`;
      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error(`Failed to load FBT config: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      this.enabled = data.enabled || false;
      this.config = data.config || null;
      this.recommendations = data.recommendations || [];
      this.parentProduct = data.parentProduct || null;

      return data;
    } catch (error) {
      console.error('Error loading FBT config:', error);
      throw error;
    }
  }

  async loadCurrentProduct() {
    try {
      const response = await fetch(`/products/${this.productHandle}.js`);
      if (!response.ok) throw new Error('Failed to load product');

      this.currentProduct = await response.json();
    } catch (error) {
      console.error('Error loading current product:', error);
    }
  }

  async loadRecommendations() {
    const recommendationType = this.config.recommendationType || 'manual';
    const manualRecommendations = [...this.recommendations];
    let aiRecommendations = [];

    // Fetch AI recommendations if needed
    if (recommendationType === 'ai' || recommendationType === 'hybrid') {
      try {
        const rawProductId = this.currentProduct?.id || this.productId;
        const productId = this.extractProductId(rawProductId);

        if (!productId) {
          console.warn('FBT Widget: Product ID not available for AI recommendations');
        } else {
          const intent = this.config.algorithm === 'complementary' ? 'complementary' : 'related';
          const recommendationsUrl = `/recommendations/products.json?product_id=${productId}&intent=${intent}&limit=3`;

          const response = await fetch(recommendationsUrl);

          if (response.ok) {
            const data = await response.json();
            aiRecommendations = data.products?.map(product => ({
              id: product.id.toString(),
              variantId: product.variants?.[0]?.id?.toString(),
              title: product.title,
              handle: product.handle,
              price: product.variants?.[0]?.price ? parseFloat(product.variants[0].price) / 100 : 0,
              compareAtPrice: product.variants?.[0]?.compare_at_price ?
                parseFloat(product.variants[0].compare_at_price) / 100 : null,
              imageUrl: product.featured_image,
              source: 'ai'
            })) || [];

            const maxUpsells = this.config.limitUpsellsInCart && this.config.maxUpsellsInCart
              ? this.config.maxUpsellsInCart
              : null;
            if (maxUpsells && aiRecommendations.length > maxUpsells) {
              aiRecommendations = aiRecommendations.slice(0, maxUpsells);
            }
          } else {
            console.warn(`FBT Widget: Failed to fetch AI recommendations (${response.status} ${response.statusText})`);
          }
        }
      } catch (error) {
        console.error('Error loading Shopify recommendations:', error);
      }
    }

    // Combine recommendations based on recommendation type
    let allRecommendations = [];

    if (recommendationType === 'ai') {
      allRecommendations = aiRecommendations;
    } else if (recommendationType === 'hybrid') {
      const manualHandles = new Set(manualRecommendations.map(r => r.handle));
      const uniqueAI = aiRecommendations.filter(r => !manualHandles.has(r.handle));
      allRecommendations = [...manualRecommendations, ...uniqueAI];
    } else {
      allRecommendations = manualRecommendations;
    }

    // Filter out the current product from recommendations
    const currentProductHandle = this.productHandle;
    this.recommendations = allRecommendations.filter(rec => rec.handle !== currentProductHandle);

    // Limit displayed recommendations
    const maxUpsells = this.config.limitUpsellsInCart && this.config.maxUpsellsInCart
      ? this.config.maxUpsellsInCart
      : null;

    if (maxUpsells && this.recommendations.length > maxUpsells) {
      this.recommendations = this.recommendations.slice(0, maxUpsells);
    }

    // Auto-select recommendations
    const limitToSelect = maxUpsells || this.recommendations.length;

    // Auto-select parent product first
    if (this.parentProduct) {
      this.selectedProducts.add(this.parentProduct.variantId || this.parentProduct.id);
    }

    // Then auto-select recommendations
    this.recommendations.slice(0, limitToSelect).forEach(rec => {
      this.selectedProducts.add(rec.variantId || rec.id);
    });
  }

  render() {
    // Hide widget if no recommendations found
    if (this.recommendations.length === 0) {
      const recommendationType = this.config?.recommendationType || 'manual';
      console.warn(`FBT Widget: No recommendations found (Type: ${recommendationType}). Hiding widget.`);
      this.container.style.display = 'none';
      return;
    }

    try {
      // Clear loading state
      this.container.innerHTML = '';

      // Create React root if not exists
      if (!this.reactRoot) {
        this.reactRoot = createRoot(this.container);
      }

      // Render React component
      this.reactRoot.render(
        React.createElement(FBTWidget, {
          config: this.config,
          recommendations: this.recommendations,
          parentProduct: this.parentProduct,
          selectedProductIds: this.selectedProducts,
          onSelectionChange: (selectedIds) => {
            this.selectedProducts = selectedIds;
          },
          onAddToCart: (selectedIds) => this.addToCart(selectedIds),
          onImpression: () => {
            Analytics.track({
              eventType: 'impression',
              component: 'fbt',
              value: 0
            });
          },
          onProductClick: (productId, variantId) => {
            Analytics.track({
              eventType: 'click',
              component: 'fbt',
              productId: productId,
              variantId: variantId,
              value: 0
            });
          },
          isPreview: false
        })
      );
    } catch (error) {
      console.error('Error rendering FBT widget:', error);
      this.container.style.display = 'none';
    }
  }

  async addToCart(selectedIds) {
    try {
      const items = [];

      // Add parent product first if selected
      if (this.parentProduct) {
        const parentVariantId = this.parentProduct.variantId || this.parentProduct.id;
        if (selectedIds.has(parentVariantId)) {
          try {
            const response = await fetch(`/products/${this.parentProduct.handle}.js`);
            if (response.ok) {
              const productData = await response.json();
              items.push({
                id: productData.variants?.[0]?.id,
                quantity: 1,
                properties: {
                  '_upsell_source': 'fbt',
                  '_fbt_parent': 'true'
                }
              });

              // Track Add to Cart for parent
              Analytics.track({
                eventType: 'add_to_cart',
                component: 'fbt',
                productId: this.parentProduct.id,
                variantId: productData.variants?.[0]?.id?.toString(),
                value: typeof this.parentProduct.price === 'number' ? this.parentProduct.price : parseFloat(this.parentProduct.price)
              });
            }
          } catch (error) {
            console.error('Error fetching parent product:', error);
          }
        }
      }

      // Add selected recommendations
      for (const product of this.recommendations) {
        const variantId = product.variantId || product.id;
        if (selectedIds.has(variantId)) {
          try {
            const response = await fetch(`/products/${product.handle}.js`);
            if (response.ok) {
              const productData = await response.json();
              items.push({
                id: productData.variants?.[0]?.id,
                quantity: 1,
                properties: {
                  '_upsell_source': 'fbt'
                }
              });

              // Track Add to Cart
              Analytics.track({
                eventType: 'add_to_cart',
                component: 'fbt',
                productId: product.id,
                variantId: productData.variants?.[0]?.id?.toString(),
                value: typeof product.price === 'number' ? product.price : parseFloat(product.price)
              });
            }
          } catch (error) {
            console.error('Error fetching product:', error);
          }
        }
      }

      if (items.length > 0) {
        const response = await fetch('/cart/add.js', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ items })
        });

        if (response.ok) {
          document.dispatchEvent(new CustomEvent('cart:updated'));

          if (window.upsellityDrawer && typeof window.upsellityDrawer.open === 'function') {
            setTimeout(() => {
              window.upsellityDrawer.open();
            }, 1500);
          }

          return true;
        } else {
          throw new Error('Failed to add items to cart');
        }
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Failed to add items to cart. Please try again.');
      throw error;
    }

    return false;
  }

  extractProductId(productId) {
    if (typeof productId === 'string' && productId.includes('/')) {
      const parts = productId.split('/');
      return parts[parts.length - 1];
    }
    return productId?.toString();
  }
}

// Initialize all widgets when DOM is ready
function initializeWidgets() {
  const widgets = document.querySelectorAll('.upsellity-fbt-widget');
  widgets.forEach(container => {
    new FrequentlyBoughtTogether(container);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeWidgets);
} else {
  initializeWidgets();
}

// Watch for dynamically added widgets
if (typeof MutationObserver !== 'undefined') {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === 1) {
          if (node.classList && node.classList.contains('upsellity-fbt-widget')) {
            new FrequentlyBoughtTogether(node);
          } else {
            const widgets = node.querySelectorAll && node.querySelectorAll('.upsellity-fbt-widget');
            if (widgets && widgets.length > 0) {
              widgets.forEach(container => {
                if (!container.dataset.initialized) {
                  container.dataset.initialized = 'true';
                  new FrequentlyBoughtTogether(container);
                }
              });
            }
          }
        }
      });
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

