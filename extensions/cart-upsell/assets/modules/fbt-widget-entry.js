/**
 * Selldrawer FBT Widget - Entry Point for Build
 * This file serves as the entry point for bundling all FBT modules
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { FBTWidget } from '../../../../app/components/shared/FBTWidget.tsx';
import { Analytics } from './analytics.js';

// App URL is injected at build time from config.js
const APP_URL = typeof __APP_URL__ !== 'undefined' ? __APP_URL__ : 'https://app.selldrawer.com';

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

        // For AI/Hybrid mode, set current product as parent if not set by API
        if (!this.parentProduct && this.currentProduct) {
          this.parentProduct = {
            id: this.currentProduct.id?.toString() || this.productId,
            variantId: this.currentProduct.variants?.[0]?.id?.toString() || this.productId,
            title: this.currentProduct.title,
            handle: this.currentProduct.handle,
            price: this.currentProduct.price ? this.currentProduct.price / 100 : 0,
            compareAtPrice: this.currentProduct.compare_at_price ? this.currentProduct.compare_at_price / 100 : null,
            imageUrl: this.currentProduct.featured_image || this.currentProduct.images?.[0] || null
          };
        }

        // Fetch full parent product details if available
        if (this.parentProduct && this.parentProduct.handle) {
          try {
            const response = await fetch(`/products/${this.parentProduct.handle}.js`);
            if (response.ok) {
              const productData = await response.json();
              this.parentProduct = {
                ...this.parentProduct,
                price: productData.price / 100,
                compareAtPrice: productData.compare_at_price ? productData.compare_at_price / 100 : null,
                imageUrl: productData.featured_image || productData.images?.[0] || null,
                variantId: productData.variants?.[0]?.id?.toString() || this.parentProduct.variantId
              };
            }
          } catch (error) {
            console.error('Error fetching parent product details:', error);
          }
        }

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
          const algorithm = this.config.algorithm || 'related';

          // Helper function to fetch recommendations by intent
          const fetchRecommendationsByIntent = async (intent) => {
            const recommendationsUrl = `/recommendations/products.json?product_id=${productId}&intent=${intent}&limit=3`;
            const response = await fetch(recommendationsUrl);

            if (!response.ok) {
              return null;
            }

            const data = await response.json();
            const rawProducts = data.products || [];

            return rawProducts.map(product => {
              const variant = product.variants?.[0];

              // Fix: Handle undefined inventory_quantity from Shopify API
              const isAvailable = variant ? (
                variant.available !== false &&
                (variant.inventory_management === null ||
                  variant.inventory_quantity === null ||
                  variant.inventory_quantity === undefined ||
                  variant.inventory_quantity > 0)
              ) : false;

              return {
                id: product.id.toString(),
                variantId: variant?.id?.toString(),
                title: product.title,
                handle: product.handle,
                price: variant?.price ? parseFloat(variant.price) / 100 : 0,
                compareAtPrice: variant?.compare_at_price ? parseFloat(variant.compare_at_price) / 100 : null,
                imageUrl: product.featured_image,
                available: isAvailable,
                source: 'ai'
              };
            }).filter(rec => rec.available);
          };

          // Determine primary intent
          const primaryIntent = algorithm === 'complementary' ? 'complementary' : 'related';

          // Fetch primary recommendations
          aiRecommendations = await fetchRecommendationsByIntent(primaryIntent);

          // Fallback to related if complementary returns empty
          if (algorithm === 'complementary' && (!aiRecommendations || aiRecommendations.length === 0)) {
            aiRecommendations = await fetchRecommendationsByIntent('related');
          }

          // Filter final recommendations - hard maximum of 4 (parent + 4 = 5 total)
          if (aiRecommendations && aiRecommendations.length > 0) {
            const maxRecommendations = this.config?.maxUpsellsShown || 4;
            if (aiRecommendations.length > maxRecommendations) {
              aiRecommendations = aiRecommendations.slice(0, maxRecommendations);
            }
          } else {
            aiRecommendations = [];
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

    // Filter final recommendations
    const maxRecommendations = this.config?.maxUpsellsShown || 4;
    if (this.recommendations.length > maxRecommendations) {
      this.recommendations = this.recommendations.slice(0, maxRecommendations);
    }

    // Auto-select recommendations
    const limitToSelect = Math.min(maxRecommendations, this.recommendations.length);

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
      // Check if bundle has discount configuration
      const bundleMetadata = this.config?.bundleMetadata;
      const hasDiscount = bundleMetadata?.hasDiscount;

      // Generate unique bundle ID for this transaction
      const bundleId = hasDiscount && bundleMetadata?.ruleId
        ? `fbt_${bundleMetadata.ruleId}_${Date.now()}`
        : null;

      const items = [];
      const allProducts = [];

      // Collect parent product if selected
      if (this.parentProduct) {
        const parentVariantId = this.parentProduct.variantId || this.parentProduct.id;
        if (selectedIds.has(parentVariantId)) {
          allProducts.push(this.parentProduct);
        }
      }

      // Collect selected recommendations
      for (const product of this.recommendations) {
        const variantId = product.variantId || product.id;
        if (selectedIds.has(variantId)) {
          allProducts.push(product);
        }
      }

      // Add all selected products with bundle properties
      for (let i = 0; i < allProducts.length; i++) {
        const product = allProducts[i];
        try {
          const response = await fetch(`/products/${product.handle}.js`);
          if (response.ok) {
            const productData = await response.json();
            const variantId = productData.variants?.[0]?.id;

            if (variantId) {
              // Base properties
              const properties = {
                '_upsell_source': 'fbt'
              };

              // Add bundle properties if discount is configured
              if (bundleId && hasDiscount) {
                // Calculate Discount Value per item
                // If FIXED, divide the total discount by the number of items in the bundle
                const type = (bundleMetadata.discountType || 'PERCENTAGE').toUpperCase();
                let value = (bundleMetadata.discountValue || '0').toString();

                if (type === 'FIXED') {
                  const totalDiscount = parseFloat(value);
                  const count = allProducts.length;
                  if (count > 0 && totalDiscount > 0) {
                    // Calculate split with 2 decimal precision
                    // We use simple division here. 
                    // e.g. 200 / 3 = 66.666... -> 66.67
                    // Shopify will handle the rounding validation
                    value = (totalDiscount / count).toFixed(2);
                  }
                }

                // Track total bundle size for integrity check (Product + Recommendations)
                properties['_fbt_bundle_id'] = bundleId;
                properties['_fbt_rule_id'] = bundleMetadata.ruleId;
                properties['_fbt_discount_type'] = type;
                properties['_fbt_discount_value'] = value;
                properties['_fbt_bundle_size'] = allProducts.length.toString();
              }

              items.push({
                id: variantId,
                quantity: 1,
                properties: properties
              });

              // Track Add to Cart
              Analytics.track({
                eventType: 'add_to_cart',
                component: 'fbt',
                productId: product.id,
                variantId: variantId.toString(),
                value: typeof product.price === 'number' ? product.price : parseFloat(product.price)
              });
            }
          }
        } catch (error) {
          console.error(`Error fetching product ${product.handle}:`, error);
        }
      }

      if (items.length > 0) {
        // Add all items in ONE request (critical for bundle grouping)
        const response = await fetch('/cart/add.js', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ items })
        });

        if (response.ok) {
          document.dispatchEvent(new CustomEvent('cart:updated'));

          document.dispatchEvent(new CustomEvent('cart:updated'));

          if (bundleId) {
            console.log('✅ FBT Bundle added with discount');
          } else {
            console.log('✅ FBT items added to cart');
          }

          // Open cart drawer
          if (window.selldrawerDrawer && typeof window.selldrawerDrawer.open === 'function') {
            console.log('FBT: Opening cart drawer...');
            setTimeout(() => {
              window.selldrawerDrawer.open();
              console.log('FBT: Cart drawer opened');
            }, 500);
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
  const widgets = document.querySelectorAll('.selldrawer-fbt-widget');
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
          if (node.classList && node.classList.contains('selldrawer-fbt-widget')) {
            new FrequentlyBoughtTogether(node);
          } else {
            const widgets = node.querySelectorAll && node.querySelectorAll('.selldrawer-fbt-widget');
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

