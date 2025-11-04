(function() {
  'use strict';

  class FrequentlyBoughtTogether {
    constructor() {
      this.container = document.getElementById('upsellity-fbt-widget');
      if (!this.container) return;

      this.productHandle = this.container.dataset.productHandle;
      this.productId = this.container.dataset.productId;
      this.shop = this.container.dataset.shop;
      this.selectedProducts = new Set();
      this.config = null;
      this.recommendations = [];
      this.currentProduct = null;

      this.init();
    }

    async init() {
      try {
        await this.loadConfig();
        if (this.config && this.config.enabled) {
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
        // Get app URL from data attribute
        const appUrl = this.container.dataset.appUrl;
        if (!appUrl) {
          console.warn('FBT Widget: App URL not configured. Please set app_url in theme block settings.');
          this.config = null;
          this.recommendations = [];
          return;
        }

        const apiUrl = `${appUrl}/api/fbt?shop=${encodeURIComponent(this.shop)}&productHandle=${encodeURIComponent(this.productHandle)}`;
        const response = await fetch(apiUrl);

        console.log("FBT Widget Response:", response);
        if (!response.ok) {
          throw new Error(`Failed to load FBT config: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        this.config = data.config;
        this.recommendations = data.recommendations || [];
        
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
        // Auto-select current product
        this.selectedProducts.add(this.productId);
      } catch (error) {
        console.error('Error loading current product:', error);
      }
    }

    async loadRecommendations() {
      // If no manual recommendations and AI/auto is enabled, fetch from Shopify
      if (this.recommendations.length === 0 && (this.config.useAI || this.config.algorithm)) {
        try {
          const intent = this.config.algorithm === 'related' ? 'related' :
                        this.config.algorithm === 'complementary' ? 'complementary' : 'related';
          
          const response = await fetch(
            `/recommendations/products.json?product_id=${this.productId}&intent=${intent}&limit=3`
          );
          
          if (response.ok) {
            const data = await response.json();
            this.recommendations = data.products?.map(product => ({
              id: product.id.toString(),
              variantId: product.variants?.[0]?.id?.toString(),
              title: product.title,
              handle: product.handle,
              price: product.variants?.[0]?.price ? parseFloat(product.variants[0].price) / 100 : 0,
              compareAtPrice: product.variants?.[0]?.compare_at_price ? 
                parseFloat(product.variants[0].compare_at_price) / 100 : null,
              imageUrl: product.featured_image
            })) || [];
          }
        } catch (error) {
          console.error('Error loading Shopify recommendations:', error);
        }
      }

      // Auto-select all recommendations by default
      this.recommendations.forEach(rec => {
        this.selectedProducts.add(rec.variantId || rec.id);
      });
    }

    render() {
      if (this.recommendations.length === 0) {
        this.container.style.display = 'none';
        return;
      }

      const layout = this.config.layout || 'horizontal';
      
      let html = `
        <div class="upsellity-fbt-content">
          <h2 class="upsellity-fbt-title">${this.escapeHtml(this.config.title)}</h2>
          
          <div class="upsellity-fbt-products layout-${layout}">
            ${this.renderCurrentProduct()}
            ${this.renderPlusSeparator()}
            ${this.renderRecommendations()}
          </div>
          
          ${this.config.showTotalPrice ? this.renderTotal() : ''}
          ${this.renderButton()}
        </div>
      `;
      
      this.container.innerHTML = html;
      this.attachEventListeners();
    }

    renderCurrentProduct() {
      if (!this.currentProduct) return '';

      const variant = this.currentProduct.variants?.[0];
      const price = variant?.price ? parseFloat(variant.price) / 100 : 0;
      const compareAtPrice = variant?.compare_at_price ? parseFloat(variant.compare_at_price) / 100 : null;
      
      return `
        <div class="upsellity-fbt-product main-product" data-product-id="${this.productId}">
          ${this.config.showCheckboxes ? `
            <input 
              type="checkbox" 
              class="upsellity-fbt-checkbox" 
              data-variant-id="${this.productId}"
              checked 
              disabled
            />
          ` : ''}
          <img 
            src="${this.currentProduct.featured_image || 'https://via.placeholder.com/150'}" 
            alt="${this.escapeHtml(this.currentProduct.title)}"
            class="upsellity-fbt-product-image"
          />
          <h3 class="upsellity-fbt-product-title">${this.escapeHtml(this.currentProduct.title)}</h3>
          ${this.config.showIndividualPrices ? `
            <div class="upsellity-fbt-product-price">
              ${compareAtPrice && this.config.showDiscount ? 
                `<span class="upsellity-fbt-product-compare-price">$${compareAtPrice.toFixed(2)}</span>` : ''}
              $${price.toFixed(2)}
            </div>
          ` : ''}
          <div class="upsellity-fbt-label" style="font-size: 0.75rem; color: #3b82f6; margin-top: 0.5rem;">This item</div>
        </div>
      `;
    }

    renderPlusSeparator() {
      return '<div class="upsellity-fbt-plus">+</div>';
    }

    renderRecommendations() {
      return this.recommendations.map((product, index) => {
        const variantId = product.variantId || product.id;
        const isSelected = this.selectedProducts.has(variantId);
        const discountPercent = product.compareAtPrice && product.price < product.compareAtPrice ?
          Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100) : 0;

        return `
          <div class="upsellity-fbt-product" data-variant-id="${variantId}">
            ${this.config.showCheckboxes ? `
              <input 
                type="checkbox" 
                class="upsellity-fbt-checkbox" 
                data-variant-id="${variantId}"
                ${isSelected ? 'checked' : ''}
              />
            ` : ''}
            <img 
              src="${product.imageUrl || 'https://via.placeholder.com/150'}" 
              alt="${this.escapeHtml(product.title)}"
              class="upsellity-fbt-product-image"
            />
            <h3 class="upsellity-fbt-product-title">${this.escapeHtml(product.title)}</h3>
            ${this.config.showIndividualPrices ? `
              <div class="upsellity-fbt-product-price">
                ${product.compareAtPrice && this.config.showDiscount ? 
                  `<span class="upsellity-fbt-product-compare-price">$${product.compareAtPrice.toFixed(2)}</span>` : ''}
                $${product.price.toFixed(2)}
              </div>
            ` : ''}
            ${discountPercent > 0 && this.config.showDiscount ? 
              `<div class="upsellity-fbt-discount-badge">Save ${discountPercent}%</div>` : ''}
            ${this.config.showProductReviews ? this.renderReviews(product) : ''}
          </div>
          ${index < this.recommendations.length - 1 ? this.renderPlusSeparator() : ''}
        `;
      }).join('');
    }

    renderReviews(product) {
      // Placeholder for reviews integration
      return `<div class="upsellity-fbt-reviews">★★★★★ (0)</div>`;
    }

    renderTotal() {
      const total = this.calculateTotal();
      const originalTotal = this.calculateOriginalTotal();
      const hasDiscount = this.config.showDiscount && originalTotal > total;

      return `
        <div class="upsellity-fbt-total">
          <span class="upsellity-fbt-total-label">Total price:</span>
          <div>
            ${hasDiscount ? `<span class="upsellity-fbt-total-original">$${originalTotal.toFixed(2)}</span>` : ''}
            <span class="upsellity-fbt-total-price">$${total.toFixed(2)}</span>
          </div>
        </div>
      `;
    }

    renderButton() {
      const selectedCount = this.selectedProducts.size;
      const buttonText = this.config.buttonText || 'Add selected items';
      
      return `
        <button 
          class="upsellity-fbt-button" 
          id="upsellity-fbt-add-button"
          style="background-color: ${this.config.buttonColor}; color: ${this.config.buttonTextColor};"
          ${selectedCount === 0 ? 'disabled' : ''}
        >
          ${buttonText} ${selectedCount > 0 ? `(${selectedCount})` : ''}
        </button>
      `;
    }

    attachEventListeners() {
      // Checkbox listeners
      const checkboxes = this.container.querySelectorAll('.upsellity-fbt-checkbox:not([disabled])');
      checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
          const variantId = e.target.dataset.variantId;
          if (e.target.checked) {
            this.selectedProducts.add(variantId);
          } else {
            this.selectedProducts.delete(variantId);
          }
          this.updateUI();
        });
      });

      // Add to cart button
      const addButton = document.getElementById('upsellity-fbt-add-button');
      if (addButton) {
        addButton.addEventListener('click', () => this.addToCart());
      }
    }

    updateUI() {
      // Update total
      const totalElement = this.container.querySelector('.upsellity-fbt-total');
      if (totalElement && this.config.showTotalPrice) {
        totalElement.outerHTML = this.renderTotal();
      }

      // Update button
      const buttonElement = this.container.querySelector('.upsellity-fbt-button');
      if (buttonElement) {
        buttonElement.outerHTML = this.renderButton();
        // Reattach button listener
        const newButton = document.getElementById('upsellity-fbt-add-button');
        if (newButton) {
          newButton.addEventListener('click', () => this.addToCart());
        }
      }
    }

    calculateTotal() {
      let total = 0;
      
      // Add current product
      if (this.currentProduct && this.selectedProducts.has(this.productId)) {
        const variant = this.currentProduct.variants?.[0];
        total += variant?.price ? parseFloat(variant.price) / 100 : 0;
      }

      // Add selected recommendations
      this.recommendations.forEach(product => {
        const variantId = product.variantId || product.id;
        if (this.selectedProducts.has(variantId)) {
          total += product.price || 0;
        }
      });

      // Apply discount if configured
      if (this.config.discountValue && this.config.discountType) {
        if (this.config.discountType === 'percentage') {
          total = total * (1 - parseFloat(this.config.discountValue) / 100);
        } else if (this.config.discountType === 'fixed') {
          total = Math.max(0, total - parseFloat(this.config.discountValue));
        }
      }

      return total;
    }

    calculateOriginalTotal() {
      let total = 0;
      
      // Add current product
      if (this.currentProduct && this.selectedProducts.has(this.productId)) {
        const variant = this.currentProduct.variants?.[0];
        const compareAtPrice = variant?.compare_at_price ? parseFloat(variant.compare_at_price) / 100 : null;
        const price = variant?.price ? parseFloat(variant.price) / 100 : 0;
        total += compareAtPrice || price;
      }

      // Add selected recommendations
      this.recommendations.forEach(product => {
        const variantId = product.variantId || product.id;
        if (this.selectedProducts.has(variantId)) {
          total += product.compareAtPrice || product.price || 0;
        }
      });

      return total;
    }

    async addToCart() {
      const button = document.getElementById('upsellity-fbt-add-button');
      if (!button || button.disabled) return;

      button.disabled = true;
      button.textContent = 'Adding...';

      try {
        const items = [];

        // Add current product if selected
        if (this.currentProduct && this.selectedProducts.has(this.productId)) {
          items.push({
            id: this.currentProduct.variants?.[0]?.id,
            quantity: 1
          });
        }

        // Add selected recommendations
        for (const product of this.recommendations) {
          const variantId = product.variantId || product.id;
          if (this.selectedProducts.has(variantId)) {
            // Fetch product to get variant ID
            try {
              const response = await fetch(`/products/${product.handle}.js`);
              if (response.ok) {
                const productData = await response.json();
                items.push({
                  id: productData.variants?.[0]?.id,
                  quantity: 1
                });
              }
            } catch (error) {
              console.error('Error fetching product:', error);
            }
          }
        }

        // Add items to cart
        if (items.length > 0) {
          const response = await fetch('/cart/add.js', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ items })
          });

          if (response.ok) {
            // Trigger cart update event
            document.dispatchEvent(new CustomEvent('cart:updated'));
            
            // Show success message
            this.showSuccess();
            
            // Optional: Refresh cart drawer if it exists
            if (window.Shopify && window.Shopify.theme) {
              window.location.reload();
            }
          } else {
            throw new Error('Failed to add items to cart');
          }
        }
      } catch (error) {
        console.error('Error adding to cart:', error);
        alert('Failed to add items to cart. Please try again.');
      } finally {
        button.disabled = false;
        button.textContent = this.config.buttonText || 'Add selected items';
      }
    }

    showSuccess() {
      const originalHtml = this.container.innerHTML;
      this.container.innerHTML = `
        <div style="text-align: center; padding: 2rem;">
          <div style="font-size: 3rem; margin-bottom: 1rem;">✓</div>
          <h3 style="font-size: 1.25rem; font-weight: 600; color: #10b981; margin-bottom: 0.5rem;">
            Items added to cart!
          </h3>
          <p style="color: #6b7280;">Redirecting to cart...</p>
        </div>
      `;
      
      setTimeout(() => {
        this.container.innerHTML = originalHtml;
        this.attachEventListeners();
      }, 2000);
    }

    escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      new FrequentlyBoughtTogether();
    });
  } else {
    new FrequentlyBoughtTogether();
  }
})();

