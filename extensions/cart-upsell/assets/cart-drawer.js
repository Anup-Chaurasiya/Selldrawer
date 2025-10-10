/**
 * Upsellity Cart Drawer
 * Automatically integrates with any Shopify theme
 */

class UpsellityCartDrawer {
  constructor() {
    this.shop = window.Shopify?.shop || null;
    this.config = null;
    this.isOpen = false;
    this.cart = null;
    
    this.init();
  }

  async init() {
    if (!this.shop) {
      console.error('Upsellity: Shop not detected');
      return;
    }

    // Load configuration from app
    await this.loadConfig();
    
    // Intercept add to cart
    this.interceptAddToCart();
    
    // Create drawer HTML
    this.createDrawer();
    
    // Listen for cart icon clicks
    this.attachCartTriggers();
    
    // Load initial cart
    await this.loadCart();
  }

  async loadConfig() {
    try {
      const appUrl = document.querySelector('[data-upsellity-app-url]')?.dataset.upsellityAppUrl;
      if (!appUrl) {
        console.error('Upsellity: App URL not configured');
        return;
      }

      const response = await fetch(`${appUrl}/api/cart-drawer?shop=${this.shop}`);
      this.config = await response.json();
    } catch (error) {
      console.error('Upsellity: Failed to load config', error);
    }
  }

  async loadCart() {
    try {
      const response = await fetch('/cart.js');
      this.cart = await response.json();
      this.render();
    } catch (error) {
      console.error('Upsellity: Failed to load cart', error);
    }
  }

  interceptAddToCart() {
    // Intercept form submissions
    document.addEventListener('submit', async (e) => {
      const form = e.target;
      if (form.getAttribute('action') === '/cart/add') {
        e.preventDefault();
        
        const formData = new FormData(form);
        
        try {
          const response = await fetch('/cart/add.js', {
            method: 'POST',
            body: formData,
          });
          
          if (response.ok) {
            await this.loadCart();
            this.open();
          }
        } catch (error) {
          console.error('Upsellity: Failed to add to cart', error);
        }
      }
    });

    // Intercept AJAX add to cart
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      
      if (args[0]?.includes('/cart/add')) {
        await this.loadCart();
        this.open();
      }
      
      return response;
    };
  }

  attachCartTriggers() {
    // Listen for cart icon clicks
    document.addEventListener('click', (e) => {
      const cartTrigger = e.target.closest('a[href="/cart"], a[href*="/cart"]');
      if (cartTrigger && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        this.open();
      }
    });
  }

  createDrawer() {
    const drawer = document.createElement('div');
    drawer.id = 'upsellity-cart-drawer';
    drawer.className = 'upsellity-drawer';
    drawer.innerHTML = `
      <div class="upsellity-drawer-overlay"></div>
      <div class="upsellity-drawer-content">
        <div class="upsellity-drawer-inner"></div>
      </div>
    `;
    
    document.body.appendChild(drawer);

    // Add styles
    this.injectStyles();

    // Close on overlay click
    drawer.querySelector('.upsellity-drawer-overlay').addEventListener('click', () => {
      this.close();
    });
  }

  injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .upsellity-drawer {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 9999;
        pointer-events: none;
      }
      
      .upsellity-drawer.open {
        pointer-events: auto;
      }
      
      .upsellity-drawer-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0);
        transition: background 0.3s ease;
      }
      
      .upsellity-drawer.open .upsellity-drawer-overlay {
        background: rgba(0, 0, 0, 0.5);
      }
      
      .upsellity-drawer-content {
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        width: 100%;
        max-width: 420px;
        background: white;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        overflow-y: auto;
        box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
      }
      
      .upsellity-drawer.open .upsellity-drawer-content {
        transform: translateX(0);
      }
      
      .upsellity-drawer-inner {
        padding: 20px;
      }
      
      .upsellity-close-btn {
        position: absolute;
        top: 16px;
        right: 20px;
        background: none;
        border: none;
        font-size: 28px;
        cursor: pointer;
        color: #6b7280;
        padding: 0;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10;
      }
      
      .upsellity-progress-bar {
        margin-bottom: 20px;
      }
      
      .upsellity-progress-bar-text {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
        font-size: 14px;
      }
      
      .upsellity-progress-bar-track {
        width: 100%;
        height: 8px;
        border-radius: 4px;
        overflow: hidden;
      }
      
      .upsellity-progress-bar-fill {
        height: 100%;
        transition: width 0.3s ease;
      }
      
      .upsellity-banner {
        padding: 16px;
        border-radius: 6px;
        text-align: center;
        margin-bottom: 20px;
      }
      
      .upsellity-banner-title {
        font-weight: 700;
        font-size: 16px;
        margin-bottom: 4px;
      }
      
      .upsellity-banner-subtitle {
        font-size: 14px;
      }
      
      .upsellity-cart-item {
        display: flex;
        gap: 12px;
        padding: 12px 0;
        border-bottom: 1px solid #f3f4f6;
      }
      
      .upsellity-cart-item-image {
        width: 80px;
        height: 80px;
        object-fit: cover;
        border-radius: 4px;
      }
      
      .upsellity-cart-item-details {
        flex: 1;
      }
      
      .upsellity-cart-item-title {
        font-weight: 600;
        margin-bottom: 4px;
      }
      
      .upsellity-cart-item-variant {
        font-size: 14px;
        color: #6b7280;
        margin-bottom: 8px;
      }
      
      .upsellity-cart-item-price {
        font-weight: 600;
        font-size: 16px;
      }
      
      .upsellity-cart-item-original-price {
        text-decoration: line-through;
        color: #9ca3af;
        font-size: 14px;
        margin-right: 8px;
      }
      
      .upsellity-recommendations {
        margin: 20px 0;
      }
      
      .upsellity-recommendations-title {
        font-size: 16px;
        font-weight: 600;
        margin-bottom: 12px;
      }
      
      .upsellity-recommendations-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }
      
      .upsellity-recommendation-card {
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        padding: 12px;
        text-align: center;
      }
      
      .upsellity-recommendation-image {
        width: 100%;
        height: 100px;
        background: #f3f4f6;
        border-radius: 4px;
        margin-bottom: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 32px;
      }
      
      .upsellity-savings-display {
        padding: 12px 16px;
        border-radius: 6px;
        text-align: center;
        font-weight: 600;
        font-size: 16px;
        margin: 20px 0;
      }
      
      .upsellity-shipping-message {
        padding: 12px 16px;
        border-radius: 6px;
        text-align: center;
        font-size: 14px;
        margin: 20px 0;
      }
      
      .upsellity-checkout-btn {
        width: 100%;
        padding: 14px;
        background: #1f2937;
        color: white;
        border: none;
        border-radius: 6px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        margin-top: 20px;
      }
      
      .upsellity-checkout-btn:hover {
        background: #111827;
      }
      
      @media (max-width: 640px) {
        .upsellity-drawer-content {
          max-width: 100%;
        }
      }
    `;
    
    document.head.appendChild(style);
  }

  render() {
    if (!this.cart || !this.config?.enabled) return;

    const drawer = document.getElementById('upsellity-cart-drawer');
    const inner = drawer.querySelector('.upsellity-drawer-inner');
    
    let html = `
      <button class="upsellity-close-btn" onclick="window.upsellityDrawer.close()">×</button>
      <h2 style="font-size: 20px; font-weight: 600; margin-bottom: 20px;">
        Your Cart (${this.cart.item_count} items)
      </h2>
    `;

    // Free Shipping Progress Bar
    if (this.config.features.freeShippingProgressBar) {
      const bar = this.config.features.freeShippingProgressBar;
      const threshold = parseFloat(bar.thresholdAmount);
      const progress = Math.min((this.cart.total_price / 100 / threshold) * 100, 100);
      const remaining = Math.max(threshold - (this.cart.total_price / 100), 0);

      html += `
        <div class="upsellity-progress-bar">
          <div class="upsellity-progress-bar-text">
            <span>${bar.beforeThresholdMessage.replace('{remaining}', `${bar.currency === 'INR' ? '₹' : '$'}${remaining.toFixed(2)}`)}</span>
            ${bar.showPercentage ? `<span>${progress.toFixed(0)}%</span>` : ''}
          </div>
          <div class="upsellity-progress-bar-track" style="background-color: ${bar.backgroundColor}">
            <div class="upsellity-progress-bar-fill" style="width: ${progress}%; background-color: ${bar.progressBarColor}"></div>
          </div>
        </div>
      `;
    }

    // Promotional Banner
    if (this.config.features.promotionalBanner) {
      const banner = this.config.features.promotionalBanner;
      html += `
        <div class="upsellity-banner" style="background-color: ${banner.backgroundColor}; color: ${banner.textColor}">
          <div class="upsellity-banner-title">${banner.title}</div>
          ${banner.subtitle ? `<div class="upsellity-banner-subtitle">${banner.subtitle}</div>` : ''}
        </div>
      `;
    }

    // Cart Items
    this.cart.items.forEach(item => {
      html += `
        <div class="upsellity-cart-item">
          <img src="${item.featured_image?.url || item.image}" alt="${item.title}" class="upsellity-cart-item-image" />
          <div class="upsellity-cart-item-details">
            <div class="upsellity-cart-item-title">${item.title}</div>
            <div class="upsellity-cart-item-variant">${item.variant_title || ''}</div>
            <div class="upsellity-cart-item-price">
              ${item.original_price > item.final_price ? `<span class="upsellity-cart-item-original-price">${this.formatMoney(item.original_price)}</span>` : ''}
              ${this.formatMoney(item.final_price)}
            </div>
          </div>
        </div>
      `;
    });

    // Savings Display
    if (this.config.features.savingsDisplay) {
      const savings = this.config.features.savingsDisplay;
      const totalSavings = this.cart.items.reduce((sum, item) => {
        return sum + (item.original_price - item.final_price) * item.quantity;
      }, 0);

      if (totalSavings > 0) {
        html += `
          <div class="upsellity-savings-display" style="background-color: ${savings.backgroundColor}; color: ${savings.textColor}">
            ${savings.message.replace('{amount}', this.formatMoney(totalSavings))}
          </div>
        `;
      }
    }

    // Free Shipping Message
    if (this.config.features.freeShippingMessage) {
      const msg = this.config.features.freeShippingMessage;
      const threshold = parseFloat(msg.thresholdAmount);
      const remaining = Math.max(threshold - (this.cart.total_price / 100), 0);

      html += `
        <div class="upsellity-shipping-message" style="background-color: ${msg.backgroundColor}; color: ${msg.textColor}">
          ${remaining > 0 
            ? msg.beforeThresholdMessage.replace('{threshold}', `${msg.currency === 'INR' ? '₹' : '$'}${threshold}`).replace('{remaining}', `${msg.currency === 'INR' ? '₹' : '$'}${remaining.toFixed(2)}`)
            : msg.achievedMessage
          }
        </div>
      `;
    }

    // Checkout Button
    html += `
      <div style="font-size: 18px; font-weight: 600; margin: 20px 0; display: flex; justify-content: space-between;">
        <span>Total</span>
        <span>${this.formatMoney(this.cart.total_price)}</span>
      </div>
      <button class="upsellity-checkout-btn" onclick="window.location.href='/checkout'">
        Checkout →
      </button>
      <div style="text-align: center; font-size: 12px; color: #6b7280; margin-top: 16px;">
        Secure Checkout • Free Returns
      </div>
    `;

    inner.innerHTML = html;
  }

  formatMoney(cents) {
    const amount = cents / 100;
    return `₹${amount.toFixed(2)}`;
  }

  open() {
    const drawer = document.getElementById('upsellity-cart-drawer');
    drawer.classList.add('open');
    document.body.style.overflow = 'hidden';
    this.isOpen = true;
  }

  close() {
    const drawer = document.getElementById('upsellity-cart-drawer');
    drawer.classList.remove('open');
    document.body.style.overflow = '';
    this.isOpen = false;
  }
}

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.upsellityDrawer = new UpsellityCartDrawer();
  });
} else {
  window.upsellityDrawer = new UpsellityCartDrawer();
}

