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
      this.enabled = false;
      this.recommendations = [];
      this.currentProduct = null;

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
        console.log("FBT Widget Data:", data);
        
        this.enabled = data.enabled || false;
        this.config = data.config || null;
        this.recommendations = data.recommendations || [];
        
        if (!this.enabled || !this.config) {
          console.warn('FBT Widget: Feature is disabled or config is missing');
        }
        
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
        // Don't auto-select current product - we only show upsell products
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
          // Get product ID from current product or dataset
          const rawProductId = this.currentProduct?.id || this.productId;
          const productId = this.extractProductId(rawProductId);
          
          if (!productId) {
            console.warn('FBT Widget: Product ID not available for AI recommendations', {
              currentProductId: this.currentProduct?.id,
              datasetProductId: this.productId
            });
          } else {
            const intent = this.config.algorithm === 'complementary' ? 'complementary' : 'related';
            const recommendationsUrl = `/recommendations/products.json?product_id=${productId}&intent=${intent}&limit=3`;
            
            console.log('FBT Widget: Fetching AI recommendations', { productId, intent, url: recommendationsUrl });
            
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
              
              // Limit AI recommendations if limitUpsellsInCart is enabled
              const maxUpsells = this.config.limitUpsellsInCart && this.config.maxUpsellsInCart 
                ? this.config.maxUpsellsInCart 
                : null;
              if (maxUpsells && aiRecommendations.length > maxUpsells) {
                aiRecommendations = aiRecommendations.slice(0, maxUpsells);
              }
              
              console.log(`FBT Widget: Loaded ${aiRecommendations.length} AI recommendations`);
            } else {
              console.warn(`FBT Widget: Failed to fetch AI recommendations (${response.status} ${response.statusText}). Shopify recommendations may not be enabled for your store.`);
            }
          }
        } catch (error) {
          console.error('Error loading Shopify recommendations:', error);
        }
      }

      // Combine recommendations based on recommendation type
      let allRecommendations = [];
      
      if (recommendationType === 'ai') {
        // AI only mode: use only AI recommendations
        allRecommendations = aiRecommendations;
        if (aiRecommendations.length === 0) {
          console.warn('FBT Widget: No AI recommendations found. Make sure Shopify recommendations are enabled for your store.');
        }
      } else if (recommendationType === 'hybrid') {
        // Hybrid mode: combine manual and AI, manual takes priority
        // Remove duplicates by handle
        const manualHandles = new Set(manualRecommendations.map(r => r.handle));
        const uniqueAI = aiRecommendations.filter(r => !manualHandles.has(r.handle));
        allRecommendations = [...manualRecommendations, ...uniqueAI];
      } else {
        // Manual mode: use only manual recommendations
        allRecommendations = manualRecommendations;
      }

      // Filter out the current product from recommendations (don't show it as an upsell)
      const currentProductHandle = this.productHandle;
      this.recommendations = allRecommendations.filter(rec => {
        // Filter by handle to avoid showing the current product
        return rec.handle !== currentProductHandle;
      });

      // Limit displayed recommendations if limitUpsellsInCart is enabled
      const maxUpsells = this.config.limitUpsellsInCart && this.config.maxUpsellsInCart 
        ? this.config.maxUpsellsInCart 
        : null;
      
      if (maxUpsells && this.recommendations.length > maxUpsells) {
        console.log(`FBT Widget: Limiting recommendations from ${this.recommendations.length} to ${maxUpsells}`);
        this.recommendations = this.recommendations.slice(0, maxUpsells);
      }

      // Auto-select up to maxUpsellsInCart recommendations by default
      const limitToSelect = maxUpsells || this.recommendations.length;
      this.recommendations.slice(0, limitToSelect).forEach(rec => {
        this.selectedProducts.add(rec.variantId || rec.id);
      });

      console.log(`FBT Widget: Loaded ${this.recommendations.length} recommendations (Type: ${recommendationType}, Filtered from ${allRecommendations.length} total, Max: ${maxUpsells || 'unlimited'})`);
    }

    render() {
      // Hide widget if no recommendations found
      if (this.recommendations.length === 0) {
        const recommendationType = this.config?.recommendationType || 'manual';
        console.warn(`FBT Widget: No recommendations found (Type: ${recommendationType}). Hiding widget.`);
        this.container.style.display = 'none';
        return;
      }

      const layout = this.config.layout || 'horizontal';
      
      let html = `
        <div class="upsellity-fbt-content">
          <h2 class="upsellity-fbt-title">${this.escapeHtml(this.config.title)}</h2>
          <div class="upsellity-fbt-layout">
            <div class="upsellity-fbt-products layout-${layout}">
              ${this.renderRecommendations()}
            </div>
            <div class="upsellity-fbt-sidebar">
              ${this.config.showTotalPrice ? this.renderTotal() : ''}
              ${this.renderButton()}
            </div>
          </div>
        </div>
      `;
      
      this.container.innerHTML = html;
      this.attachEventListeners();
    }

    renderRecommendations() {
      const maxUpsells = this.config.limitUpsellsInCart && this.config.maxUpsellsInCart 
        ? this.config.maxUpsellsInCart 
        : null;
      const selectedCount = this.selectedProducts.size;
      const isAtLimit = maxUpsells !== null && selectedCount >= maxUpsells;

      return this.recommendations.map((product, index) => {
        const variantId = product.variantId || product.id;
        const isSelected = this.selectedProducts.has(variantId);
        const isDisabled = isAtLimit && !isSelected; // Disable if limit reached and not selected
        const discountPercent = product.compareAtPrice && product.price < product.compareAtPrice ?
          Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100) : 0;

        const card = `
          <div class="upsellity-fbt-product ${isDisabled ? 'upsellity-fbt-product-disabled' : ''}" data-variant-id="${variantId}">
            ${this.config.showCheckboxes ? `
              <input 
                type="checkbox" 
                class="upsellity-fbt-checkbox" 
                data-variant-id="${variantId}"
                ${isSelected ? 'checked' : ''}
                ${isDisabled ? 'disabled' : ''}
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
        `;
        // Insert a plus separator between cards to match the design
        const needsPlus = index < this.recommendations.length - 1;
        return needsPlus ? `${card}<div class="upsellity-fbt-plus">+</div>` : card;
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
      const checkboxes = this.container.querySelectorAll('.upsellity-fbt-checkbox');
      checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
          const variantId = e.target.dataset.variantId;
          const maxUpsells = this.config.limitUpsellsInCart && this.config.maxUpsellsInCart 
            ? this.config.maxUpsellsInCart 
            : null;
          
          if (e.target.checked) {
            // Check if we're at the limit
            if (maxUpsells !== null && this.selectedProducts.size >= maxUpsells) {
              e.target.checked = false;
              this.showLimitMessage(maxUpsells);
              return;
            }
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

      // Update checkboxes - enable/disable based on limit
      const maxUpsells = this.config.limitUpsellsInCart && this.config.maxUpsellsInCart 
        ? this.config.maxUpsellsInCart 
        : null;
      const selectedCount = this.selectedProducts.size;
      const isAtLimit = maxUpsells !== null && selectedCount >= maxUpsells;

      const checkboxes = this.container.querySelectorAll('.upsellity-fbt-checkbox');
      const products = this.container.querySelectorAll('.upsellity-fbt-product');
      
      checkboxes.forEach((checkbox, index) => {
        const variantId = checkbox.dataset.variantId;
        const isSelected = this.selectedProducts.has(variantId);
        const shouldDisable = isAtLimit && !isSelected;
        
        checkbox.disabled = shouldDisable;
        const product = products[index];
        if (product) {
          if (shouldDisable) {
            product.classList.add('upsellity-fbt-product-disabled');
          } else {
            product.classList.remove('upsellity-fbt-product-disabled');
          }
        }
      });
    }

    showLimitMessage(maxUpsells) {
      // Create a temporary message element
      const messageDiv = document.createElement('div');
      messageDiv.className = 'upsellity-fbt-limit-message';
      messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #fef3c7;
        border: 1px solid #f59e0b;
        color: #92400e;
        padding: 12px 16px;
        border-radius: 6px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        z-index: 10000;
        font-size: 14px;
        font-weight: 500;
      `;
      messageDiv.textContent = `Maximum ${maxUpsells} upsell product${maxUpsells > 1 ? 's' : ''} can be selected.`;
      
      document.body.appendChild(messageDiv);
      
      // Remove after 3 seconds
      setTimeout(() => {
        messageDiv.remove();
      }, 3000);
    }

    calculateTotal() {
      let total = 0;

      // Only add selected recommendations (not the current product)
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

      // Only add selected recommendations (not the current product)
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

        // Only add selected recommendations (not the current product)
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

    extractProductId(productId) {
      // Handle GID format: gid://shopify/Product/123456 -> 123456
      if (typeof productId === 'string' && productId.includes('/')) {
        const parts = productId.split('/');
        return parts[parts.length - 1];
      }
      // Handle numeric string or number
      return productId?.toString();
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

