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
      this.originalProductVariantId = null;
      
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
            
            // Capture the variant ID from the form
            const form = button.closest('form');
            if (form) {
              const formData = new FormData(form);
              const variantId = formData.get('id') || formData.get('variant_id') || form.querySelector('[name="id"]')?.value;
              if (variantId) {
                this.originalProductVariantId = variantId.toString();
              } else if (this.currentProduct && this.currentProduct.variants && this.currentProduct.variants.length > 0) {
                // Fallback to first variant if no ID in form
                this.originalProductVariantId = this.currentProduct.variants[0].id.toString();
              }
            }
            
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
      
      // Limit products shown
      const productsToShow = this.recommendations.slice(0, this.config.maxProducts);
      
      // Add layout class and product count class for better styling
      productsContainer.className = `upsellity-nudge-products upsellity-nudge-layout-${this.config.layout} upsellity-nudge-products-${productsToShow.length}`;
      
      productsToShow.forEach(product => {
        const productCard = this.createProductCard(product);
        productsContainer.appendChild(productCard);
      });

      // Bottom action section - split layout
      const bottomSection = document.createElement('div');
      bottomSection.className = 'upsellity-nudge-bottom-section';

      // Left half - Continue button
      const continueSection = document.createElement('div');
      continueSection.className = 'upsellity-nudge-continue-section';
      const continueButton = document.createElement('button');
      continueButton.className = 'upsellity-nudge-continue-btn';
      continueButton.textContent = this.config.continueButtonText;
      continueButton.style.backgroundColor = this.config.continueButtonColor;
      continueButton.style.color = this.config.continueButtonTextColor;
      continueButton.addEventListener('click', () => this.continueWithOriginal());
      continueSection.appendChild(continueButton);

      // Right half - Select all upsell products button
      const selectionSection = document.createElement('div');
      selectionSection.className = 'upsellity-nudge-selection-section';
      
      if (productsToShow.length > 0) {
        const selectAllButton = document.createElement('button');
        selectAllButton.className = 'upsellity-nudge-select-all-btn';
        selectAllButton.textContent = this.config.selectButtonText || 'Select all alternatives';
        selectAllButton.style.backgroundColor = this.config.selectButtonColor;
        selectAllButton.style.color = this.config.selectButtonTextColor;
        selectAllButton.addEventListener('click', () => this.selectAllProducts(productsToShow));
        selectionSection.appendChild(selectAllButton);
      }

      bottomSection.appendChild(continueSection);
      bottomSection.appendChild(selectionSection);

      popup.appendChild(closeButton);
      popup.appendChild(title);
      popup.appendChild(subtitle);
      popup.appendChild(productsContainer);
      popup.appendChild(bottomSection);

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
      card.style.cursor = 'pointer';
      
      // Make card clickable to select this product
      card.addEventListener('click', () => {
        this.selectProduct(product);
      });

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

    async selectAllProducts(products) {
      // Close popup
      this.closePopup();
      
      try {
        // First, get the current cart to find and remove the original product
        const cartResponse = await fetch('/cart.js');
        if (cartResponse.ok) {
          const cart = await cartResponse.json();
          
          // Find the line item with the original variant ID
          let originalLineItemKey = null;
          if (this.originalProductVariantId && cart.items) {
            // Normalize the original variant ID (remove GID prefix if present)
            const normalizedOriginalId = this.originalProductVariantId.replace('gid://shopify/ProductVariant/', '');
            
            const matchingItem = cart.items.find(item => {
              const itemVariantId = item.variant_id?.toString();
              // Match by numeric ID
              return itemVariantId === normalizedOriginalId || itemVariantId === this.originalProductVariantId;
            });
            
            if (matchingItem) {
              originalLineItemKey = matchingItem.key;
            }
          }
          
          // Remove original product from cart if it exists
          if (originalLineItemKey) {
            try {
              await fetch('/cart/change.js', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  updates: {
                    [originalLineItemKey]: 0
                  }
                })
              });
            } catch (error) {
              console.error('Error removing original product from cart:', error);
            }
          }
        }
        
        // Fetch variant IDs from Shopify for each product
        const itemsToAdd = [];
        
        for (const product of products) {
          try {
            // Fetch product data from Shopify to get the correct variant ID
            const productResponse = await fetch(`/products/${product.handle}.js`);
            if (!productResponse.ok) {
              console.warn('Failed to fetch product:', product.handle);
              continue;
            }
            
            const productData = await productResponse.json();
            
            // Get the first available variant (or match by stored variant ID if possible)
            let variant = null;
            if (product.variantId && productData.variants) {
              // Try to find the variant by ID
              const storedVariantId = product.variantId.toString().replace('gid://shopify/ProductVariant/', '').replace(/\D/g, '');
              variant = productData.variants.find(v => {
                const vId = v.id.toString().replace('gid://shopify/ProductVariant/', '').replace(/\D/g, '');
                return vId === storedVariantId;
              });
            }
            
            // Fallback to first variant if not found
            if (!variant && productData.variants && productData.variants.length > 0) {
              variant = productData.variants[0];
            }
            
            if (!variant) {
              console.warn('No variant found for product:', product.title);
              continue;
            }
            
            // Extract numeric variant ID
            // Shopify's product JSON API returns variant.id as a number
            let variantId = variant.id;
            
            // Handle different formats
            if (typeof variantId === 'number') {
              // Already a number, use it directly
              itemsToAdd.push({
                id: variantId,
                quantity: 1
              });
            } else if (typeof variantId === 'string') {
              // Remove GID prefix if present
              if (variantId.includes('gid://shopify/ProductVariant/')) {
                variantId = variantId.replace('gid://shopify/ProductVariant/', '');
              }
              // Extract numeric part
              const numericId = parseInt(variantId.replace(/\D/g, ''), 10);
              if (isNaN(numericId)) {
                console.warn('Invalid variant ID for product:', product.title, 'variantId:', variant.id);
                continue;
              }
              itemsToAdd.push({
                id: numericId,
                quantity: 1
              });
            } else {
              console.warn('Unexpected variant ID type for product:', product.title, 'variantId:', variant.id, 'type:', typeof variantId);
              continue;
            }
          } catch (error) {
            console.error('Error fetching product variant for:', product.title, error);
          }
        }
        
        if (itemsToAdd.length === 0) {
          console.error('No valid products to add to cart');
          return;
        }
        
        const addResponse = await fetch('/cart/add.js', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            items: itemsToAdd
          })
        });
        
        if (!addResponse.ok) {
          const errorText = await addResponse.text();
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch (e) {
            errorData = { description: errorText };
          }
          console.error('Error adding upsell products to cart:', errorData);
          // Show error to user if possible
          if (errorData.description) {
            alert('Error adding products: ' + errorData.description);
          }
          return;
        }
        
        const responseData = await addResponse.json();
        
        // Wait a moment to ensure cart is fully updated
        await new Promise(resolve => setTimeout(resolve, 150));
        
        // Trigger cart update events
        document.dispatchEvent(new CustomEvent('cart:updated'));
        
        // Also trigger Shopify's native cart events if available
        if (typeof window.dispatchEvent !== 'undefined') {
          window.dispatchEvent(new CustomEvent('cart:refresh'));
          window.dispatchEvent(new CustomEvent('cart:build'));
        }
        
        // Trigger additional events that some themes listen to
        if (typeof document !== 'undefined') {
          document.dispatchEvent(new Event('cart:updated', { bubbles: true }));
        }
        
        // Try to open cart drawer if Shopify theme supports it
        setTimeout(() => {
          // Try multiple selectors that different themes might use
          const cartDrawerToggle = document.querySelector('[data-cart-drawer-toggle]') || 
                                   document.querySelector('.cart-drawer-toggle') ||
                                   document.querySelector('[aria-controls*="cart"]') ||
                                   document.querySelector('[data-drawer-toggle="cart"]') ||
                                   document.querySelector('.js-cart-drawer-toggle') ||
                                   document.querySelector('#cart-icon-bubble') ||
                                   document.querySelector('.cart-count-bubble');
          
          if (cartDrawerToggle) {
            cartDrawerToggle.click();
          } else {
            // If no toggle found, try to trigger cart update manually
            // Some themes auto-open on cart updates
            const cartUpdateEvent = new CustomEvent('cart:updated', { bubbles: true });
            document.dispatchEvent(cartUpdateEvent);
          }
        }, 200);
      } catch (error) {
        console.error('Error in selectAllProducts:', error);
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

