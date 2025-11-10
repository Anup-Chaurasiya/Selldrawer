(function() {
  'use strict';

  class NudgePopup {
    constructor() {
      this.shop = null;
      this.appUrl = null;
      this.config = null;
      this.enabled = false;
      this.recommendations = [];
      this.currentProduct = null;
      this.selectedProduct = null;
      this.isOpen = false;
      this.originalAddToCartButton = null;
      
      this.init();
    }

    async init() {
      try {
        // Get shop and app URL from meta tags or data attributes
        this.shop = this.getShopDomain();
        this.appUrl = this.getAppUrl();
        
        if (!this.shop || !this.appUrl) {
          console.warn('Nudge Popup: Shop or App URL not configured');
          return;
        }

        await this.loadConfig();
        
        if (this.enabled && this.config) {
          this.setupAddToCartInterceptor();
        }
      } catch (error) {
        console.error('Error initializing Nudge Popup:', error);
      }
    }

    getShopDomain() {
      // Try to get from Shopify.shop
      if (typeof Shopify !== 'undefined' && Shopify.shop) {
        return Shopify.shop;
      }
      
      // Try to get from meta tag
      const metaTag = document.querySelector('meta[name="shopify-shop"]');
      if (metaTag) {
        return metaTag.content;
      }
      
      return null;
    }

    getAppUrl() {
      // Try to get from data attribute on script tag
      const scriptTag = document.querySelector('script[data-nudge-app-url]');
      if (scriptTag) {
        return scriptTag.dataset.nudgeAppUrl;
      }
      
      // Default URL
      return 'https://app.upsellity.com';
    }

    async loadConfig() {
      try {
        const productHandle = this.getCurrentProductHandle();
        if (!productHandle) {
          return;
        }

        const apiUrl = `${this.appUrl}/api/nudge?shop=${encodeURIComponent(this.shop)}&productHandle=${encodeURIComponent(productHandle)}`;
        const response = await fetch(apiUrl);

        if (!response.ok) {
          throw new Error(`Failed to load Nudge config: ${response.status}`);
        }
        
        const data = await response.json();
        
        this.enabled = data.enabled || false;
        this.config = data.config || null;
        this.recommendations = data.recommendations || [];
        
        // If AI recommendations are enabled, fetch them
        if (this.enabled && this.config && (this.config.recommendationType === 'ai' || this.config.recommendationType === 'hybrid')) {
          await this.loadAIRecommendations();
        }
        
      } catch (error) {
        console.error('Error loading Nudge config:', error);
        this.enabled = false;
      }
    }

    getCurrentProductHandle() {
      // Try to get from URL
      const path = window.location.pathname;
      const match = path.match(/\/products\/([^/?]+)/);
      if (match) {
        return match[1];
      }
      
      // Try to get from meta tag
      const metaTag = document.querySelector('meta[property="og:url"]');
      if (metaTag) {
        const urlMatch = metaTag.content.match(/\/products\/([^/?]+)/);
        if (urlMatch) {
          return urlMatch[1];
        }
      }
      
      return null;
    }

    async loadAIRecommendations() {
      try {
        const productHandle = this.getCurrentProductHandle();
        if (!productHandle) return;

        const productId = this.getProductIdFromHandle(productHandle);
        if (!productId) return;

        const algorithm = this.config.algorithm || 'related';
        const intent = algorithm === 'complementary' ? 'complementary' : 'related';
        
        const response = await fetch(
          `/recommendations/products.json?product_id=${productId}&limit=${this.config.maxProducts || 4}&intent=${intent}`
        );

        if (response.ok) {
          const data = await response.json();
          if (data.products && data.products.length > 0) {
            const aiRecommendations = data.products.map((product, index) => ({
              id: product.id.toString(),
              variantId: product.variants[0]?.id?.toString() || null,
              title: product.title,
              handle: product.handle,
              price: parseFloat(product.variants[0]?.price || 0),
              compareAtPrice: product.variants[0]?.compare_at_price ? parseFloat(product.variants[0].compare_at_price) : null,
              imageUrl: product.featured_image || null,
              description: product.body_html || null,
              position: index
            }));

            // Combine or replace with manual recommendations
            if (this.config.recommendationType === 'hybrid') {
              // Add AI recommendations to manual ones, avoiding duplicates
              const existingIds = new Set(this.recommendations.map(r => r.handle));
              aiRecommendations.forEach(rec => {
                if (!existingIds.has(rec.handle)) {
                  this.recommendations.push(rec);
                }
              });
            } else {
              // AI only, replace manual
              this.recommendations = aiRecommendations;
            }
          }
        }
      } catch (error) {
        console.error('Error loading AI recommendations:', error);
      }
    }

    getProductIdFromHandle(handle) {
      // Try to get from meta tag
      const metaTag = document.querySelector('meta[property="og:product:id"]');
      if (metaTag) {
        return metaTag.content;
      }
      
      // Try to get from product JSON
      if (typeof window.ShopifyAnalytics !== 'undefined' && window.ShopifyAnalytics.meta?.product?.id) {
        return window.ShopifyAnalytics.meta.product.id;
      }
      
      return null;
    }

    setupAddToCartInterceptor() {
      // Intercept all "Add to Cart" buttons
      const addToCartButtons = document.querySelectorAll('[name="add"], [data-add-to-cart], button[type="submit"][name="add"], form[action*="/cart/add"] button[type="submit"]');
      
      addToCartButtons.forEach(button => {
        button.addEventListener('click', async (e) => {
          // Only intercept if we have recommendations
          if (this.recommendations.length > 0 && this.config.showOnAddToCart) {
            e.preventDefault();
            e.stopPropagation();
            
            this.originalAddToCartButton = button;
            this.currentProduct = await this.getCurrentProductData();
            
            // Show popup with delay
            if (this.config.popupDelay > 0) {
              setTimeout(() => this.showPopup(), this.config.popupDelay);
            } else {
              this.showPopup();
            }
          }
        }, true);
      });
    }

    async getCurrentProductData() {
      try {
        const productHandle = this.getCurrentProductHandle();
        if (!productHandle) return null;

        const response = await fetch(`/products/${productHandle}.js`);
        if (response.ok) {
          return await response.json();
        }
      } catch (error) {
        console.error('Error loading current product:', error);
      }
      return null;
    }

    showPopup() {
      if (this.isOpen) return;
      
      this.isOpen = true;
      const popup = this.createPopupElement();
      document.body.appendChild(popup);
      
      // Trigger animation
      setTimeout(() => {
        popup.classList.add('upsellity-nudge-visible');
      }, 10);
    }

    createPopupElement() {
      const overlay = document.createElement('div');
      overlay.className = 'upsellity-nudge-overlay';
      overlay.style.backgroundColor = this.hexToRgba(this.config.overlayColor, this.config.overlayOpacity / 100);
      
      if (this.config.enableAnimation) {
        overlay.classList.add(`upsellity-nudge-animation-${this.config.animationType}`);
      }

      const popup = document.createElement('div');
      popup.className = 'upsellity-nudge-popup';
      popup.style.backgroundColor = this.config.popupBackgroundColor;
      popup.style.borderRadius = `${this.config.popupBorderRadius}px`;

      // Close button
      const closeButton = document.createElement('button');
      closeButton.className = 'upsellity-nudge-close';
      closeButton.innerHTML = '&times;';
      closeButton.style.color = this.config.closeButtonColor;
      closeButton.addEventListener('click', () => this.closePopup());

      // Title
      const title = document.createElement('h2');
      title.className = 'upsellity-nudge-title';
      title.textContent = this.config.title;
      title.style.color = this.config.titleColor;

      // Subtitle
      const subtitle = document.createElement('p');
      subtitle.className = 'upsellity-nudge-subtitle';
      subtitle.textContent = this.config.subtitle;
      subtitle.style.color = this.config.subtitleColor;

      // Products container
      const productsContainer = document.createElement('div');
      productsContainer.className = `upsellity-nudge-products upsellity-nudge-layout-${this.config.layout}`;

      // Limit products shown
      const productsToShow = this.recommendations.slice(0, this.config.maxProducts);
      
      productsToShow.forEach(product => {
        const productCard = this.createProductCard(product);
        productsContainer.appendChild(productCard);
      });

      // Continue button
      const continueButton = document.createElement('button');
      continueButton.className = 'upsellity-nudge-continue-btn';
      continueButton.textContent = this.config.continueButtonText;
      continueButton.style.backgroundColor = this.config.continueButtonColor;
      continueButton.style.color = this.config.continueButtonTextColor;
      continueButton.addEventListener('click', () => this.continueWithOriginal());

      popup.appendChild(closeButton);
      popup.appendChild(title);
      popup.appendChild(subtitle);
      popup.appendChild(productsContainer);
      popup.appendChild(continueButton);

      overlay.appendChild(popup);

      // Close on overlay click
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          this.closePopup();
        }
      });

      return overlay;
    }

    createProductCard(product) {
      const card = document.createElement('div');
      card.className = 'upsellity-nudge-product-card';

      if (this.config.showProductImage && product.imageUrl) {
        const img = document.createElement('img');
        img.src = product.imageUrl;
        img.alt = product.title;
        img.className = 'upsellity-nudge-product-image';
        card.appendChild(img);
      }

      const details = document.createElement('div');
      details.className = 'upsellity-nudge-product-details';

      const title = document.createElement('h3');
      title.className = 'upsellity-nudge-product-title';
      title.textContent = product.title;
      details.appendChild(title);

      if (this.config.showProductDescription && product.description) {
        const desc = document.createElement('p');
        desc.className = 'upsellity-nudge-product-description';
        desc.textContent = this.stripHtml(product.description).substring(0, 100) + '...';
        details.appendChild(desc);
      }

      if (this.config.showProductPrice) {
        const priceContainer = document.createElement('div');
        priceContainer.className = 'upsellity-nudge-product-price-container';

        const price = document.createElement('span');
        price.className = 'upsellity-nudge-product-price';
        price.textContent = this.formatPrice(product.price);
        priceContainer.appendChild(price);

        if (this.config.showProductComparePrice && product.compareAtPrice && product.compareAtPrice > product.price) {
          const comparePrice = document.createElement('span');
          comparePrice.className = 'upsellity-nudge-product-compare-price';
          comparePrice.textContent = this.formatPrice(product.compareAtPrice);
          priceContainer.appendChild(comparePrice);
        }

        details.appendChild(priceContainer);
      }

      const selectButton = document.createElement('button');
      selectButton.className = 'upsellity-nudge-select-btn';
      selectButton.textContent = this.config.selectButtonText;
      selectButton.style.backgroundColor = this.config.selectButtonColor;
      selectButton.style.color = this.config.selectButtonTextColor;
      selectButton.addEventListener('click', () => this.selectProduct(product));

      details.appendChild(selectButton);
      card.appendChild(details);

      return card;
    }

    async selectProduct(product) {
      this.selectedProduct = product;
      
      // Close popup
      this.closePopup();
      
      // Add selected product to cart instead of original
      try {
        const formData = {
          items: [{
            id: product.variantId || product.id,
            quantity: 1
          }]
        };

        const response = await fetch('/cart/add.js', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData)
        });

        if (response.ok) {
          // Trigger cart update events
          document.dispatchEvent(new CustomEvent('cart:updated'));
          
          // Show success message or redirect to cart
          if (typeof window.location !== 'undefined') {
            // Optionally redirect to cart or show notification
            // window.location.href = '/cart';
          }
        }
      } catch (error) {
        console.error('Error adding product to cart:', error);
      }
    }

    async continueWithOriginal() {
      // Close popup
      this.closePopup();
      
      // Add original product to cart
      if (this.originalAddToCartButton) {
        // Find the form containing the button
        const form = this.originalAddToCartButton.closest('form');
        if (form) {
          const formData = new FormData(form);
          
          try {
            const response = await fetch('/cart/add.js', {
              method: 'POST',
              body: formData
            });

            if (response.ok) {
              // Trigger cart update events
              document.dispatchEvent(new CustomEvent('cart:updated'));
            }
          } catch (error) {
            console.error('Error adding original product to cart:', error);
          }
        }
      }
    }

    closePopup() {
      const overlay = document.querySelector('.upsellity-nudge-overlay');
      if (overlay) {
        overlay.classList.remove('upsellity-nudge-visible');
        setTimeout(() => {
          overlay.remove();
        }, 300);
      }
      this.isOpen = false;
    }

    hexToRgba(hex, alpha) {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    formatPrice(cents) {
      if (typeof Shopify !== 'undefined' && Shopify.formatMoney) {
        return Shopify.formatMoney(cents * 100, Shopify.money_format || '${{amount}}');
      }
      return `$${(cents).toFixed(2)}`;
    }

    stripHtml(html) {
      const tmp = document.createElement('div');
      tmp.innerHTML = html;
      return tmp.textContent || tmp.innerText || '';
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      new NudgePopup();
    });
  } else {
    new NudgePopup();
  }
})();

