/**
 * FBT Widget Entry Point
 * Renders the Frequently Bought Together widget on product pages
 */

import { cartOps } from './cart-operations-enhanced.js';
import { Analytics } from './analytics.js';

class FBTWidget {
  constructor() {
    this.config = null;
    this.recommendations = [];
    this.parentProduct = null;
    this.selectedProducts = new Set();
    this.isLoading = false;
    this.container = null;
    this.shop = null;
  }

  async init() {
    // Find FBT widget container
    this.container = document.querySelector('.selldrawer-fbt-widget');
    if (!this.container) {
      console.log('Selldrawer: FBT widget container not found');
      return;
    }

    this.shop = this.container.dataset.shop;
    const productHandle = this.container.dataset.productHandle;

    if (!this.shop || !productHandle) {
      console.error('Selldrawer: Missing shop or product handle');
      return;
    }

    // Initialize analytics
    const appUrl = typeof __APP_URL__ !== 'undefined' ? __APP_URL__ : 'https://app.selldrawer.com';
    Analytics.init(appUrl);

    await this.loadFBTData(this.shop, productHandle);
  }

  async loadFBTData(shop, productHandle) {
    try {
      const appUrl = typeof __APP_URL__ !== 'undefined' ? __APP_URL__ : 'https://app.selldrawer.com';
      const response = await fetch(`${appUrl}/api/fbt?shop=${encodeURIComponent(shop)}&productHandle=${encodeURIComponent(productHandle)}`);
      
      if (!response.ok) {
        throw new Error(`Failed to load FBT data: ${response.status}`);
      }

      const data = await response.json();

      if (!data.enabled || !data.config) {
        this.container.style.display = 'none';
        return;
      }

      this.config = data.config;
      this.recommendations = data.recommendations || [];
      this.parentProduct = data.parentProduct;

      // Initialize selected products (all selected by default)
      if (this.parentProduct) {
        this.selectedProducts.add(this.parentProduct.variantId || this.parentProduct.id);
      }
      this.recommendations.forEach(product => {
        this.selectedProducts.add(product.variantId || product.id);
      });

      this.render();

      // Track impression
      if (this.recommendations.length > 0) {
        Analytics.track({
          eventType: 'impression',
          component: 'fbt_widget',
          productId: productHandle,
          metadata: {
            recommendationCount: this.recommendations.length
          }
        });
      }
    } catch (error) {
      console.error('Selldrawer: Error loading FBT data:', error);
      this.container.style.display = 'none';
    }
  }

  render() {
    if (!this.container || !this.config) return;

    const html = this.generateHTML();
    this.container.innerHTML = html;

    // Attach event listeners
    this.attachEventListeners();
  }

  generateHTML() {
    const { title, buttonText, buttonColor, buttonTextColor, showTotalPrice } = this.config;
    
    let productsHTML = '';
    
    // Add parent product if available
    if (this.parentProduct) {
      productsHTML += this.generateProductCard(this.parentProduct, true);
    }

    // Add recommendations
    this.recommendations.forEach(product => {
      productsHTML += this.generateProductCard(product, false);
    });

    const total = this.calculateTotal();
    const totalHTML = showTotalPrice ? `
      <div class="selldrawer-fbt-total">
        <span>Total:</span>
        <span class="selldrawer-fbt-total-price">${this.formatMoney(total)}</span>
      </div>
    ` : '';

    return `
      <div class="selldrawer-fbt-content">
        <h2 class="selldrawer-fbt-title">${title || 'Frequently Bought Together'}</h2>
        <div class="selldrawer-fbt-products">
          ${productsHTML}
        </div>
        <div class="selldrawer-fbt-actions">
          ${totalHTML}
          <button 
            class="selldrawer-fbt-add-button"
            style="background-color: ${buttonColor || '#000'}; color: ${buttonTextColor || '#fff'};"
            data-action="add-to-cart"
          >
            ${buttonText || 'Add selected to cart'}
          </button>
        </div>
      </div>
    `;
  }

  generateProductCard(product, isParent) {
    const variantId = product.variantId || product.id;
    const isSelected = this.selectedProducts.has(variantId);
    
    return `
      <div class="selldrawer-fbt-product ${isSelected ? 'selected' : ''}" data-variant-id="${variantId}">
        <input 
          type="checkbox" 
          ${isSelected ? 'checked' : ''} 
          ${isParent ? 'disabled' : ''}
          data-action="toggle-product"
        />
        <img src="${product.imageUrl || ''}" alt="${product.title}" />
        <div class="selldrawer-fbt-product-info">
          <h3>${product.title}</h3>
          <p class="selldrawer-fbt-product-price">${this.formatMoney(product.price)}</p>
        </div>
      </div>
    `;
  }

  attachEventListeners() {
    // Toggle product selection
    const checkboxes = this.container.querySelectorAll('[data-action="toggle-product"]');
    checkboxes.forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const productCard = e.target.closest('.selldrawer-fbt-product');
        const variantId = productCard.dataset.variantId;
        
        if (e.target.checked) {
          this.selectedProducts.add(variantId);
          productCard.classList.add('selected');
        } else {
          this.selectedProducts.delete(variantId);
          productCard.classList.remove('selected');
        }

        this.updateTotal();
      });
    });

    // Add to cart button
    const addButton = this.container.querySelector('[data-action="add-to-cart"]');
    if (addButton) {
      addButton.addEventListener('click', () => this.handleAddToCart());
    }
  }

  updateTotal() {
    const totalElement = this.container.querySelector('.selldrawer-fbt-total-price');
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

    this.recommendations.forEach(product => {
      if (this.selectedProducts.has(product.variantId || product.id)) {
        total += product.price;
      }
    });

    return total;
  }

  async handleAddToCart() {
    if (this.isLoading || this.selectedProducts.size === 0) return;

    this.isLoading = true;
    const button = this.container.querySelector('[data-action="add-to-cart"]');
    if (button) {
      button.disabled = true;
      button.textContent = 'Adding...';
    }

    try {
      // Generate unique bundle ID
      const bundleId = `fbt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const bundleSize = this.selectedProducts.size;

      // Get discount configuration from bundleMetadata
      const bundleMetadata = this.config.bundleMetadata || {};
      const discountType = bundleMetadata.discountType;
      const discountValue = bundleMetadata.discountValue;
      const hasDiscount = bundleMetadata.hasDiscount;

      // Prepare items with FBT discount attributes
      const items = [];

      // Add parent product
      if (this.parentProduct && this.selectedProducts.has(this.parentProduct.variantId || this.parentProduct.id)) {
        items.push({
          id: this.parentProduct.variantId || this.parentProduct.id,
          quantity: 1,
          properties: {
            '_fbt_bundle_id': bundleId,
            '_fbt_bundle_size': bundleSize.toString(),
            ...(hasDiscount && discountType && discountValue ? {
              '_fbt_discount_type': discountType.toUpperCase(),
              '_fbt_discount_value': discountValue.toString()
            } : {})
          }
        });
      }

      // Add recommendations
      this.recommendations.forEach(product => {
        const variantId = product.variantId || product.id;
        if (this.selectedProducts.has(variantId)) {
          items.push({
            id: variantId,
            quantity: 1,
            properties: {
              '_fbt_bundle_id': bundleId,
              '_fbt_bundle_size': bundleSize.toString(),
              ...(hasDiscount && discountType && discountValue ? {
                '_fbt_discount_type': discountType.toUpperCase(),
                '_fbt_discount_value': discountValue.toString()
              } : {})
            }
          });
        }
      });

      // Add to cart
      const result = await cartOps.addToCart(items);

      if (result.success) {
        // Track add to cart event
        Analytics.track({
          eventType: 'add_to_cart',
          component: 'fbt_widget',
          productId: this.container.dataset.productHandle,
          metadata: {
            bundleSize: items.length,
            hasDiscount: hasDiscount,
            discountType: discountType,
            discountValue: discountValue
          }
        });

        // Show success message
        if (button) {
          button.textContent = '✓ Added to cart!';
          setTimeout(() => {
            button.textContent = this.config.buttonText || 'Add selected to cart';
            button.disabled = false;
          }, 2000);
        }

        // Trigger cart drawer open if available
        if (typeof window.SelldrawerCartDrawer !== 'undefined') {
          window.SelldrawerCartDrawer.open();
        } else {
          // Fallback: trigger Shopify cart drawer
          document.dispatchEvent(new CustomEvent('cart:updated'));
        }
      } else {
        throw new Error(result.error || 'Failed to add to cart');
      }
    } catch (error) {
      console.error('Selldrawer: Error adding FBT bundle to cart:', error);
      alert('Failed to add items to cart. Please try again.');
      
      if (button) {
        button.textContent = this.config.buttonText || 'Add selected to cart';
        button.disabled = false;
      }
    } finally {
      this.isLoading = false;
    }
  }

  formatMoney(cents) {
    const dollars = cents / 100;
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(dollars);
  }
}

// Initialize FBT widget when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const widget = new FBTWidget();
    widget.init();
  });
} else {
  const widget = new FBTWidget();
  widget.init();
}
