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

    // Create drawer HTML first
    this.createDrawer();
    
    // Load configuration from app
    await this.loadConfig();
    
    // Intercept add to cart
    this.interceptAddToCart();
    
    // Listen for cart icon clicks
    this.attachCartTriggers();
    
    // Load initial cart
    await this.loadCart();
  }

  async loadConfig() {
    try {
      const appUrl = document.querySelector('[data-upsellity-app-url]')?.dataset.upsellityAppUrl;
      if (!appUrl) {
        console.warn('Upsellity: App URL not configured, using default config');
        this.config = {
          enabled: true,
          features: {
            freeShippingProgressBar: {
              thresholdAmount: 5000,
              currency: 'INR',
              beforeThresholdMessage: 'Add {remaining} for FREE shipping',
              achievedMessage: '🎉 You qualify for FREE shipping!',
              showPercentage: true
            },
            productRecommendations: {
              title: 'You may also like',
              maxProducts: 4,
              layout: 'grid',
              recommendationType: 'manual',
              showDiscount: true,
              showDiscountBadge: true,
              showAddButton: true
            }
          }
        };
        return;
      }

      const response = await fetch(`${appUrl}/api/cart-drawer?shop=${this.shop}`);
      this.config = await response.json();
      console.log('Upsellity: Config loaded', this.config);
      console.log('Upsellity: Promotional banner config', this.config.features?.promotionalBanner);
    } catch (error) {
      console.error('Upsellity: Failed to load config, using default', error);
      this.config = {
        enabled: true,
        features: {
          freeShippingProgressBar: {
            thresholdAmount: 5000,
            currency: 'INR',
            beforeThresholdMessage: 'Add {remaining} for FREE shipping',
            achievedMessage: '🎉 You qualify for FREE shipping!',
            showPercentage: true
          },
          productRecommendations: {
            title: 'You may also like',
            maxProducts: 4,
            layout: 'grid',
            recommendationType: 'manual',
            showDiscount: true,
            showDiscountBadge: true,
            showAddButton: true
          }
        }
      };
    }
  }

  async loadCart() {
    try {
      const response = await fetch('/cart.js');
      this.cart = await response.json();
      console.log('Upsellity: Cart loaded', this.cart);
      this.render();
    } catch (error) {
      console.error('Upsellity: Failed to load cart', error);
      // Use mock cart for testing
      this.cart = {
        item_count: 1,
        total_price: 150000, // ₹1,500 in cents
        items: [{
          key: 'test-item',
          title: 'Test Product',
          variant_title: 'Default',
          final_price: 150000,
          original_price: 150000,
          quantity: 1,
          featured_image: { url: 'https://via.placeholder.com/80' }
        }]
      };
      console.log('Upsellity: Using mock cart for testing', this.cart);
      this.render();
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

    // Add keyboard shortcut for testing (Ctrl+Shift+C)
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        console.log('Upsellity: Opening cart drawer via keyboard shortcut');
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
      
      .upsellity-banner-image {
        border-radius: 6px;
        overflow: hidden;
        margin-bottom: 20px;
        position: relative;
      }
      
      .upsellity-banner-img {
        width: 100%;
        height: 120px;
        object-fit: cover;
        display: block;
      }
      
      .upsellity-banner-content {
        padding: 12px;
        background-color: #f8f9fa;
        border-top: 1px solid #e9ecef;
      }
      
      .upsellity-banner-carousel {
        border-radius: 6px;
        overflow: hidden;
        margin-bottom: 20px;
        position: relative;
      }
      
      .upsellity-carousel-container {
        position: relative;
        height: 120px;
        overflow: hidden;
      }
      
      .upsellity-carousel-track {
        display: flex;
        height: 100%;
        transition: transform 0.5s ease;
      }
      
      .upsellity-carousel-slide {
        min-width: 100%;
        height: 100%;
        position: relative;
      }
      
      .upsellity-carousel-slide.active {
        display: block;
      }
      
      .upsellity-carousel-arrow {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        background: rgba(0, 0, 0, 0.5);
        color: white;
        border: none;
        width: 30px;
        height: 30px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 18px;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2;
      }
      
      .upsellity-carousel-prev {
        left: 10px;
      }
      
      .upsellity-carousel-next {
        right: 10px;
      }
      
      .upsellity-carousel-dots {
        position: absolute;
        bottom: 10px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        gap: 4px;
        z-index: 2;
      }
      
      .upsellity-carousel-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        border: none;
        background-color: rgba(255, 255, 255, 0.5);
        cursor: pointer;
        transition: background-color 0.3s ease;
      }
      
      .upsellity-carousel-dot.active {
        background-color: #007bff;
      }
      
      .upsellity-banner-cta {
        margin-top: 12px;
      }
      
      .upsellity-cta-button {
        background-color: #007bff;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        font-weight: 600;
        cursor: pointer;
        font-size: 14px;
        transition: background-color 0.2s ease;
      }
      
      .upsellity-cta-button:hover {
        background-color: #0056b3;
      }
      
      .upsellity-banner-content .upsellity-cta-button {
        font-size: 12px;
        padding: 6px 12px;
      }
      
      /* Enhanced Banner Styles */
      .upsellity-enhanced-banner {
        position: relative;
        border-radius: 8px;
        overflow: hidden;
        margin-bottom: 20px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }
      
      .upsellity-enhanced-carousel {
        position: relative;
        border-radius: 8px;
        overflow: hidden;
        margin-bottom: 20px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }
      
      .upsellity-banner-main-image {
        width: 100%;
        height: 200px;
        object-fit: cover;
        display: block;
      }
      
      .upsellity-banner-overlay {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        background: linear-gradient(transparent, rgba(0,0,0,0.8));
        padding: 20px;
        color: white;
      }
      
      .upsellity-banner-overlay .upsellity-banner-title {
        font-size: 20px;
        font-weight: 700;
        margin-bottom: 8px;
        text-shadow: 0 1px 3px rgba(0,0,0,0.5);
      }
      
      .upsellity-banner-overlay .upsellity-banner-subtitle {
        font-size: 14px;
        margin-bottom: 12px;
        opacity: 0.9;
        text-shadow: 0 1px 2px rgba(0,0,0,0.5);
      }
      
      .upsellity-banner-overlay .upsellity-cta-button {
        background: #007bff;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 6px;
        font-weight: 600;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.2s ease;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      }
      
      .upsellity-banner-overlay .upsellity-cta-button:hover {
        background: #0056b3;
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
      }
      
      /* Enhanced Carousel Styles */
      .upsellity-carousel-container {
        position: relative;
        height: 200px;
        overflow: hidden;
      }
      
      .upsellity-carousel-track {
        display: flex;
        height: 100%;
        transition: transform 0.5s ease;
      }
      
      .upsellity-carousel-slide {
        min-width: 100%;
        height: 100%;
        position: relative;
      }
      
      .upsellity-carousel-dots {
        position: absolute;
        bottom: 10px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        gap: 6px;
        z-index: 10;
      }
      
      .upsellity-carousel-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        border: none;
        background-color: rgba(255, 255, 255, 0.5);
        cursor: pointer;
        transition: background-color 0.3s ease;
      }
      
      .upsellity-carousel-dot.active {
        background-color: #007bff;
      }
      
      /* Mobile Responsive */
      @media (max-width: 640px) {
        .upsellity-banner-main-image {
          height: 150px;
        }
        
        .upsellity-banner-overlay {
          padding: 16px;
        }
        
        .upsellity-banner-overlay .upsellity-banner-title {
          font-size: 18px;
        }
        
        .upsellity-banner-overlay .upsellity-banner-subtitle {
          font-size: 13px;
        }
        
        .upsellity-banner-overlay .upsellity-cta-button {
          padding: 8px 16px;
          font-size: 13px;
        }
      }
      
      .upsellity-cart-item {
        display: flex;
        gap: 12px;
        padding: 12px 0;
        border-bottom: 1px solid #f3f4f6;
        position: relative;
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
      
      .upsellity-cart-item-controls {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 8px;
      }
      
      .upsellity-quantity-controls {
        display: flex;
        align-items: center;
        gap: 4px;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        background: white;
      }
      
      .upsellity-quantity-btn {
        width: 32px;
        height: 32px;
        border: none;
        background: #f8f9fa;
        color: #374151;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        border-radius: 4px;
      }
      
      .upsellity-quantity-btn:hover {
        background: #e5e7eb;
        transform: scale(1.05);
      }
      
      .upsellity-quantity-btn:active {
        transform: scale(0.95);
      }
      
      .upsellity-quantity-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none;
      }
      
      .upsellity-quantity-display {
        min-width: 40px;
        text-align: center;
        font-weight: 600;
        font-size: 14px;
        color: #374151;
        padding: 0 8px;
      }
      
      .upsellity-remove-btn {
        width: 32px;
        height: 32px;
        border: none;
        background: #ef4444;
        color: white;
        border-radius: 6px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        transition: all 0.2s ease;
      }
      
      .upsellity-remove-btn:hover {
        background: #dc2626;
        transform: scale(1.05);
      }
      
      .upsellity-remove-btn:active {
        transform: scale(0.95);
      }
      
      .upsellity-progress-bar-enhanced {
        margin-bottom: 20px;
        padding: 16px;
        background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
        border-radius: 12px;
        border: 1px solid #e2e8f0;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      }
      
      .upsellity-progress-bar-text-enhanced {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
        font-size: 14px;
        font-weight: 600;
      }
      
      .upsellity-progress-bar-message {
        color: #374151;
      }
      
      .upsellity-progress-bar-percentage {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white;
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 700;
        box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3);
      }
      
      .upsellity-progress-bar-track-enhanced {
        width: 100%;
        height: 12px;
        border-radius: 8px;
        overflow: hidden;
        background: #e5e7eb !important;
        position: relative;
        box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
        display: block;
      }
      
      .upsellity-progress-bar-fill-enhanced {
        height: 100% !important;
        border-radius: 8px;
        transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        overflow: hidden;
        display: block;
        min-width: 2px;
      }
      
      .upsellity-progress-bar-fill-enhanced::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.3) 50%, transparent 100%);
        animation: shimmer 2s infinite;
      }
      
      @keyframes shimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }
      
      .upsellity-progress-complete {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      }
      
      .upsellity-progress-incomplete {
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      }
      
      .upsellity-loading {
        opacity: 0.6;
        pointer-events: none;
      }
      
      .upsellity-loading .upsellity-quantity-btn,
      .upsellity-loading .upsellity-remove-btn {
        cursor: not-allowed;
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
      
      .upsellity-add-recommendation-btn:hover {
        background: #f97316 !important;
        color: white !important;
        transform: translateY(-1px);
        box-shadow: 0 2px 4px rgba(249, 115, 22, 0.3);
      }
      
      .upsellity-add-recommendation-btn:active {
        transform: translateY(0);
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
        
        .upsellity-cart-item {
          flex-direction: column;
          gap: 8px;
        }
        
        .upsellity-cart-item-image {
          width: 60px;
          height: 60px;
        }
        
        .upsellity-cart-item-controls {
          justify-content: space-between;
          width: 100%;
        }
        
        .upsellity-quantity-controls {
          flex: 1;
          max-width: 120px;
        }
        
        .upsellity-progress-bar-enhanced {
          padding: 12px;
        }
        
        .upsellity-progress-bar-text-enhanced {
          flex-direction: column;
          gap: 8px;
          align-items: flex-start;
        }
        
        .upsellity-progress-bar-percentage {
          align-self: flex-end;
        }
      }
    `;
    
    document.head.appendChild(style);
  }

  render() {
    if (!this.cart) {
      console.log('Upsellity: No cart data available');
      return;
    }

    const drawer = document.getElementById('upsellity-cart-drawer');
    if (!drawer) {
      console.error('Upsellity: Drawer element not found');
      return;
    }
    
    const inner = drawer.querySelector('.upsellity-drawer-inner');
    if (!inner) {
      console.error('Upsellity: Drawer inner element not found');
      return;
    }
    
    console.log('Upsellity: Rendering cart drawer', {
      cart: this.cart,
      config: this.config,
      enabled: this.config?.enabled
    });
    
    let html = `
      <button class="upsellity-close-btn" onclick="window.upsellityDrawer.close()">×</button>
      <h2 style="font-size: 20px; font-weight: 600; margin-bottom: 20px;">
        Your Cart (${this.cart.item_count} items)
      </h2>
    `;

    // Enhanced Free Shipping Progress Bar - Always show with default config if no config exists
    const bar = this.config?.features?.freeShippingProgressBar || {
      thresholdAmount: 5000,
      currency: 'INR',
      beforeThresholdMessage: 'Add {remaining} for FREE shipping',
      achievedMessage: '🎉 You qualify for FREE shipping!',
      showPercentage: true
    };
    
    const threshold = parseFloat(bar.thresholdAmount);
    const progress = Math.min((this.cart.total_price / 100 / threshold) * 100, 100);
    const remaining = Math.max(threshold - (this.cart.total_price / 100), 0);
    const isComplete = progress >= 100;
    
    console.log('Upsellity: Progress bar calculation', {
      cartTotal: this.cart.total_price,
      threshold,
      progress: progress.toFixed(2) + '%',
      remaining: remaining.toFixed(2),
      isComplete,
      bar,
      willRender: true
    });

    html += `
      <div class="upsellity-progress-bar-enhanced" style="margin-bottom: 20px; padding: 16px; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);">
        <div class="upsellity-progress-bar-text-enhanced" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; font-size: 14px; font-weight: 600;">
          <span class="upsellity-progress-bar-message" style="color: #374151;">
            ${isComplete 
              ? (bar.achievedMessage || '🎉 You qualify for FREE shipping!')
              : bar.beforeThresholdMessage.replace('{remaining}', `${bar.currency === 'INR' ? '₹' : '$'}${Math.round(remaining)}`)
            }
          </span>
          ${bar.showPercentage ? `<span class="upsellity-progress-bar-percentage" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3);">${progress.toFixed(0)}%</span>` : ''}
        </div>
        <div class="upsellity-progress-bar-track-enhanced" style="width: 100%; height: 12px; border-radius: 8px; overflow: hidden; background: #e5e7eb; position: relative; box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);">
          <div class="upsellity-progress-bar-fill-enhanced ${isComplete ? 'upsellity-progress-complete' : 'upsellity-progress-incomplete'}" 
               style="width: ${progress}%; height: 100%; display: block; background: ${isComplete ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'}; border-radius: 8px; transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);"></div>
        </div>
      </div>
    `;

    // Enhanced Promotional Banner
    if (this.config.features.promotionalBanner) {
      const banner = this.config.features.promotionalBanner;
      console.log('Upsellity: Rendering promotional banner', banner);
      
      // Check if banner has images
      if (banner.imageUrls && banner.imageUrls.length > 0) {
        if (banner.bannerType === 'image') {
          // Single Image Banner
          html += `
            <div class="upsellity-enhanced-banner" style="cursor: ${banner.ctaEnabled ? 'pointer' : 'default'}" ${banner.ctaEnabled ? `onclick="window.upsellityDrawer.handleBannerClick('${banner.id}')"` : ''}>
              <img src="${banner.imageUrls[0]}" alt="Promotional Banner" class="upsellity-banner-main-image" />
              <div class="upsellity-banner-overlay">
                <div class="upsellity-banner-title">${banner.title}</div>
                ${banner.subtitle ? `<div class="upsellity-banner-subtitle">${banner.subtitle}</div>` : ''}
                ${banner.ctaEnabled ? `
                  <button class="upsellity-cta-button" onclick="window.upsellityDrawer.handleBannerClick('${banner.id}')">
                    ${banner.ctaButtonText}
                  </button>
                ` : ''}
              </div>
            </div>
          `;
        } else if (banner.bannerType === 'carousel' && banner.imageUrls.length > 1) {
          // Image Carousel Banner
          const carouselId = `upsellity-carousel-${Date.now()}`;
          html += `
            <div class="upsellity-enhanced-carousel" id="${carouselId}" style="cursor: ${banner.ctaEnabled ? 'pointer' : 'default'}" ${banner.ctaEnabled ? `onclick="window.upsellityDrawer.handleBannerClick('${banner.id}')"` : ''}>
              <div class="upsellity-carousel-container">
                <div class="upsellity-carousel-track">
                  ${banner.imageUrls.map((url, index) => `
                    <div class="upsellity-carousel-slide ${index === 0 ? 'active' : ''}" data-index="${index}">
                      <img src="${url}" alt="Banner image ${index + 1}" class="upsellity-banner-main-image" />
                    </div>
                  `).join('')}
                </div>
                <div class="upsellity-carousel-dots">
                  ${banner.imageUrls.map((_, index) => `
                    <button class="upsellity-carousel-dot ${index === 0 ? 'active' : ''}" onclick="window.upsellityDrawer.carouselGoTo('${carouselId}', ${index})"></button>
                  `).join('')}
                </div>
              </div>
              <div class="upsellity-banner-overlay">
                <div class="upsellity-banner-title">${banner.title}</div>
                ${banner.subtitle ? `<div class="upsellity-banner-subtitle">${banner.subtitle}</div>` : ''}
                ${banner.ctaEnabled ? `
                  <button class="upsellity-cta-button" onclick="window.upsellityDrawer.handleBannerClick('${banner.id}')">
                    ${banner.ctaButtonText}
                  </button>
                ` : ''}
              </div>
            </div>
          `;
          
          // Initialize carousel auto-rotation
          setTimeout(() => {
            this.initializeEnhancedCarousel(carouselId, banner.imageUrls.length);
          }, 100);
        }
      } else {
        // Text-only banner (fallback when no images)
        html += `
          <div class="upsellity-text-banner" style="
            background-color: ${banner.backgroundColor || '#FF6B35'};
            color: ${banner.textColor || '#FFFFFF'};
            padding: 16px;
            border-radius: 8px;
            text-align: center;
            margin-bottom: 16px;
            cursor: ${banner.ctaEnabled ? 'pointer' : 'default'};
            ${banner.ctaEnabled ? `onclick="window.upsellityDrawer.handleBannerClick('${banner.id}')"` : ''}
          ">
            <div style="font-weight: 700; font-size: 16px; margin-bottom: 4px;">
              ${banner.title}
            </div>
            ${banner.subtitle ? `
              <div style="font-size: 14px; margin-bottom: ${banner.ctaEnabled ? '12px' : '0'};">
                ${banner.subtitle}
              </div>
            ` : ''}
            ${banner.ctaEnabled ? `
              <button style="
                background-color: ${banner.textColor || '#FFFFFF'};
                color: ${banner.backgroundColor || '#FF6B35'};
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                font-weight: 600;
                cursor: pointer;
                font-size: 14px;
                margin-top: 8px;
              " onclick="window.upsellityDrawer.handleBannerClick('${banner.id}')">
                ${banner.ctaButtonText}
              </button>
            ` : ''}
          </div>
        `;
      }
    }

    // Cart Items with Quantity Controls
    this.cart.items.forEach(item => {
      html += `
        <div class="upsellity-cart-item" data-item-key="${item.key}">
          <img src="${item.featured_image?.url || item.image}" alt="${item.title}" class="upsellity-cart-item-image" />
          <div class="upsellity-cart-item-details">
            <div class="upsellity-cart-item-title">${item.title}</div>
            <div class="upsellity-cart-item-variant">${item.variant_title || ''}</div>
            <div class="upsellity-cart-item-price">
              ${item.original_price > item.final_price ? `<span class="upsellity-cart-item-original-price">${this.formatMoney(item.original_price * item.quantity)}</span>` : ''}
              ${this.formatMoney(item.final_price * item.quantity)}
            </div>
            <div class="upsellity-cart-item-controls">
              <div class="upsellity-quantity-controls">
                <button class="upsellity-quantity-btn" onclick="window.upsellityDrawer.updateQuantity('${item.key}', ${item.quantity - 1})" ${item.quantity <= 1 ? 'disabled' : ''}>−</button>
                <span class="upsellity-quantity-display">${item.quantity}</span>
                <button class="upsellity-quantity-btn" onclick="window.upsellityDrawer.updateQuantity('${item.key}', ${item.quantity + 1})">+</button>
              </div>
              <button class="upsellity-remove-btn" onclick="window.upsellityDrawer.removeItem('${item.key}')" title="Remove item">🗑</button>
            </div>
          </div>
        </div>
      `;
    });

    // Product Recommendations
    if (this.config.features.productRecommendations) {
      const recommendations = this.config.features.productRecommendations;
      
      // For now, show sample recommendations. In a real implementation, 
      // you would fetch actual recommended products based on the configuration
      const sampleProducts = [
        {
          id: 'rec1',
          title: 'Sport Elite',
          price: 2699,
          originalPrice: 5999,
          image: 'https://via.placeholder.com/100',
          handle: 'sport-elite'
        },
        {
          id: 'rec2', 
          title: 'Urban Style',
          price: 2699,
          originalPrice: 5999,
          image: 'https://via.placeholder.com/100',
          handle: 'urban-style'
        }
      ];

      html += `
        <div class="upsellity-recommendations">
          <div class="upsellity-recommendations-title">${recommendations.title}</div>
          <div class="upsellity-recommendations-grid">
            ${sampleProducts.slice(0, recommendations.maxProducts || 4).map(product => {
              const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
              return `
                <div class="upsellity-recommendation-card">
                  <div class="upsellity-recommendation-image" style="position: relative;">
                    <img src="${product.image}" alt="${product.title}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px;" />
                    ${recommendations.showDiscountBadge && product.originalPrice > product.price ? `
                      <div style="position: absolute; top: 8px; right: 8px; background-color: #10b981; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px; z-index: 10;">
                        ${discount}% off
                      </div>
                    ` : ''}
                  </div>
                  <div style="font-size: 14px; font-weight: 500; margin-bottom: 4px;">
                    ${product.title}
                  </div>
                  <div style="margin-bottom: 4px;">
                    ${recommendations.showDiscount && product.originalPrice > product.price ? `
                      <span style="text-decoration: line-through; color: #9ca3af; font-size: 12px; margin-right: 4px;">
                        ₹${product.originalPrice}
                      </span>
                    ` : ''}
                    <span style="font-weight: 600;">₹${product.price}</span>
                  </div>
                  ${recommendations.showAddButton ? `
                    <button class="upsellity-add-recommendation-btn" 
                            onclick="window.upsellityDrawer.addProductToCartByHandle('${product.handle}')"
                            style="width: 100%; padding: 6px; border: 1px solid #f97316; background: white; color: #f97316; border-radius: 4px; cursor: pointer; font-size: 13px; font-weight: 500; transition: all 0.2s ease;">
                      + Add
                    </button>
                  ` : ''}
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }

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
            ? msg.beforeThresholdMessage.replace('{threshold}', `${msg.currency === 'INR' ? '₹' : '$'}${Math.round(threshold)}`).replace('{remaining}', `${msg.currency === 'INR' ? '₹' : '$'}${Math.round(remaining)}`)
            : msg.achievedMessage
          }
        </div>
      `;
    }

    // Coupon Code Field
    if (this.config.features.couponCodeField) {
      const couponField = this.config.features.couponCodeField;
      console.log('Upsellity: Rendering coupon code field', couponField);
      
      html += `
        <div class="upsellity-coupon-field" style="margin: 16px 0; padding: 16px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
          <div style="display: flex; gap: 8px; align-items: center;">
            <input 
              type="text" 
              id="upsellity-coupon-input" 
              placeholder="${couponField.placeholder || 'Enter coupon code'}"
              style="
                flex: 1;
                padding: 10px 12px;
                border: 1px solid #d1d5db;
                border-radius: 6px;
                font-size: 14px;
                background: white;
                outline: none;
                transition: border-color 0.2s ease;
              "
              onfocus="this.style.borderColor='#3b82f6'"
              onblur="this.style.borderColor='#d1d5db'"
            />
            <button 
              class="upsellity-coupon-apply-btn"
              onclick="window.upsellityDrawer.applyCoupon()"
              style="
                padding: 10px 16px;
                background: #1f2937;
                color: white;
                border: none;
                border-radius: 6px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: background-color 0.2s ease;
                white-space: nowrap;
              "
              onmouseover="this.style.backgroundColor='#374151'"
              onmouseout="this.style.backgroundColor='#1f2937'"
            >
              ${couponField.buttonText || 'Apply'}
            </button>
          </div>
          <div id="upsellity-coupon-message" style="margin-top: 8px; font-size: 12px; min-height: 16px;"></div>
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
    
    console.log('Upsellity: HTML rendered successfully', {
      hasProgressBar: html.includes('upsellity-progress-bar-enhanced'),
      hasRecommendations: html.includes('upsellity-recommendations'),
      hasAddButtons: html.includes('upsellity-add-recommendation-btn'),
      progressBarWidth: html.match(/width: (\d+\.?\d*)%/)?.[1] + '%',
      htmlLength: html.length
    });
  }

  formatMoney(cents) {
    const amount = cents / 100;
    // Show whole numbers without decimals for cleaner display
    return `₹${Math.round(amount)}`;
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

  // Carousel functionality
  initializeCarousel(carouselId, settings) {
    const carousel = document.getElementById(carouselId);
    if (!carousel) return;

    const track = carousel.querySelector('.upsellity-carousel-track');
    const slides = carousel.querySelectorAll('.upsellity-carousel-slide');
    const dots = carousel.querySelectorAll('.upsellity-carousel-dot');
    
    if (!track || slides.length === 0) return;

    let currentIndex = 0;
    let autoRotateInterval;

    const updateCarousel = () => {
      const translateX = -currentIndex * 100;
      track.style.transform = `translateX(${translateX}%)`;
      
      // Update active states
      slides.forEach((slide, index) => {
        slide.classList.toggle('active', index === currentIndex);
      });
      
      dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === currentIndex);
      });
    };

    const nextSlide = () => {
      currentIndex = (currentIndex + 1) % slides.length;
      updateCarousel();
    };

    const prevSlide = () => {
      currentIndex = (currentIndex - 1 + slides.length) % slides.length;
      updateCarousel();
    };

    const goToSlide = (index) => {
      currentIndex = index;
      updateCarousel();
    };

    // Store methods on the global object for onclick handlers
    window.upsellityDrawer = window.upsellityDrawer || {};
    window.upsellityDrawer.carouselNext = (id) => {
      if (id === carouselId) nextSlide();
    };
    window.upsellityDrawer.carouselPrev = (id) => {
      if (id === carouselId) prevSlide();
    };
    window.upsellityDrawer.carouselGoTo = (id, index) => {
      if (id === carouselId) goToSlide(index);
    };

    // Auto-rotate if enabled
    if (settings.autoRotate) {
      autoRotateInterval = setInterval(nextSlide, settings.rotationSpeed || 5000);
      
      // Pause on hover
      carousel.addEventListener('mouseenter', () => {
        clearInterval(autoRotateInterval);
      });
      
      carousel.addEventListener('mouseleave', () => {
        if (settings.autoRotate) {
          autoRotateInterval = setInterval(nextSlide, settings.rotationSpeed || 5000);
        }
      });
    }

    // Store cleanup function
    carousel._cleanup = () => {
      if (autoRotateInterval) {
        clearInterval(autoRotateInterval);
      }
    };
  }

  // Enhanced carousel initialization
  initializeEnhancedCarousel(carouselId, imageCount) {
    const carousel = document.getElementById(carouselId);
    if (!carousel || imageCount <= 1) return;

    const track = carousel.querySelector('.upsellity-carousel-track');
    const dots = carousel.querySelectorAll('.upsellity-carousel-dot');
    
    if (!track || dots.length === 0) return;

    let currentIndex = 0;
    let autoRotateInterval;

    const updateCarousel = () => {
      const translateX = -currentIndex * 100;
      track.style.transform = `translateX(${translateX}%)`;
      
      dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === currentIndex);
      });
    };

    const nextSlide = () => {
      currentIndex = (currentIndex + 1) % imageCount;
      updateCarousel();
    };

    const goToSlide = (index) => {
      currentIndex = index;
      updateCarousel();
    };

    // Store methods on the global object for onclick handlers
    window.upsellityDrawer = window.upsellityDrawer || {};
    window.upsellityDrawer.carouselGoTo = (id, index) => {
      if (id === carouselId) goToSlide(index);
    };

    // Auto-rotate every 4 seconds
    autoRotateInterval = setInterval(nextSlide, 4000);
    
    // Pause on hover
    carousel.addEventListener('mouseenter', () => {
      clearInterval(autoRotateInterval);
    });
    
    carousel.addEventListener('mouseleave', () => {
      autoRotateInterval = setInterval(nextSlide, 4000);
    });

    // Store cleanup function
    carousel._cleanup = () => {
      if (autoRotateInterval) {
        clearInterval(autoRotateInterval);
      }
    };
  }

  // Handle banner CTA clicks
  handleBannerClick(bannerId) {
    if (!this.config?.features?.promotionalBanner) return;
    
    const banner = this.config.features.promotionalBanner;
    if (!banner.ctaEnabled || banner.id !== bannerId) return;

    if (banner.ctaType === 'redirect' && banner.ctaUrl) {
      // Redirect to URL
      window.location.href = banner.ctaUrl;
    } else if (banner.ctaType === 'add_to_cart' && banner.ctaProductHandle) {
      // Add product to cart using product handle
      this.addProductToCartByHandle(banner.ctaProductHandle, banner.ctaVariantId, banner.ctaQuantity);
    }
  }

  // Apply coupon code
  applyCoupon() {
    const couponInput = document.getElementById('upsellity-coupon-input');
    const messageDiv = document.getElementById('upsellity-coupon-message');
    
    if (!couponInput || !messageDiv) {
      console.error('Upsellity: Coupon elements not found');
      return;
    }

    const couponCode = couponInput.value.trim();
    if (!couponCode) {
      messageDiv.textContent = 'Please enter a coupon code';
      messageDiv.style.color = '#ef4444';
      return;
    }

    // Show loading state
    messageDiv.textContent = 'Applying coupon...';
    messageDiv.style.color = '#6b7280';

    // Apply coupon via Shopify's discount code API
    fetch('/cart/update.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: JSON.stringify({
        discount_code: couponCode
      })
    })
    .then(response => response.json())
    .then(data => {
      if (data.status === 'success' || data.discount_codes) {
        // Success
        const couponField = this.config.features.couponCodeField;
        messageDiv.textContent = couponField.successMessage || 'Coupon applied successfully!';
        messageDiv.style.color = '#10b981';
        
        // Clear input
        couponInput.value = '';
        
        // Reload cart to show updated totals
        this.loadCart().then(() => {
          this.render();
        });
      } else {
        // Error
        const couponField = this.config.features.couponCodeField;
        messageDiv.textContent = couponField.errorMessage || 'Invalid coupon code';
        messageDiv.style.color = '#ef4444';
      }
    })
    .catch(error => {
      console.error('Upsellity: Error applying coupon', error);
      const couponField = this.config.features.couponCodeField;
      messageDiv.textContent = couponField.errorMessage || 'Invalid coupon code';
      messageDiv.style.color = '#ef4444';
    });
  }

  async addProductToCart(productId, variantId, quantity = 1) {
    try {
      const formData = new FormData();
      formData.append('id', variantId || productId);
      formData.append('quantity', quantity.toString());

      const response = await fetch('/cart/add.js', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        // Reload cart and show success message
        await this.loadCart();
        this.showNotification('Product added to cart!', 'success');
      } else {
        const error = await response.json();
        this.showNotification(error.description || 'Failed to add product to cart', 'error');
      }
    } catch (error) {
      console.error('Error adding product to cart:', error);
      this.showNotification('Failed to add product to cart', 'error');
    }
  }

  async addProductToCartByHandle(productHandle, variantId, quantity = 1) {
    try {
      // First, get the product data by handle
      const productResponse = await fetch(`/products/${productHandle}.js`);
      if (!productResponse.ok) {
        throw new Error('Product not found');
      }
      
      const product = await productResponse.json();
      
      // Use the first variant if no specific variant ID provided
      const variant = variantId ? 
        product.variants.find(v => v.id.toString() === variantId.toString()) :
        product.variants[0];
      
      if (!variant) {
        throw new Error('Variant not found');
      }

      const formData = new FormData();
      formData.append('id', variant.id);
      formData.append('quantity', quantity.toString());

      const response = await fetch('/cart/add.js', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        // Reload cart and show success message
        await this.loadCart();
        this.showNotification(`${product.title} added to cart!`, 'success');
      } else {
        const error = await response.json();
        this.showNotification(error.description || 'Failed to add product to cart', 'error');
      }
    } catch (error) {
      console.error('Error adding product to cart:', error);
      this.showNotification('Failed to add product to cart', 'error');
    }
  }

  // Update item quantity
  async updateQuantity(itemKey, newQuantity) {
    if (newQuantity < 0) return;
    
    const cartItem = document.querySelector(`[data-item-key="${itemKey}"]`);
    if (cartItem) {
      cartItem.classList.add('upsellity-loading');
    }

    try {
      const response = await fetch('/cart/change.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: itemKey,
          quantity: newQuantity
        })
      });

      if (response.ok) {
        await this.loadCart();
        this.showNotification('Cart updated!', 'success');
      } else {
        const error = await response.json();
        this.showNotification(error.description || 'Failed to update cart', 'error');
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
      this.showNotification('Failed to update cart', 'error');
    } finally {
      if (cartItem) {
        cartItem.classList.remove('upsellity-loading');
      }
    }
  }

  // Remove item from cart
  async removeItem(itemKey) {
    const cartItem = document.querySelector(`[data-item-key="${itemKey}"]`);
    if (cartItem) {
      cartItem.classList.add('upsellity-loading');
    }

    try {
      const response = await fetch('/cart/change.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: itemKey,
          quantity: 0
        })
      });

      if (response.ok) {
        await this.loadCart();
        this.showNotification('Item removed from cart', 'success');
      } else {
        const error = await response.json();
        this.showNotification(error.description || 'Failed to remove item', 'error');
      }
    } catch (error) {
      console.error('Error removing item:', error);
      this.showNotification('Failed to remove item', 'error');
    } finally {
      if (cartItem) {
        cartItem.classList.remove('upsellity-loading');
      }
    }
  }

  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `upsellity-notification upsellity-notification-${type}`;
    notification.textContent = message;
    
    // Add styles
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#007bff'};
      color: white;
      padding: 12px 20px;
      border-radius: 4px;
      font-weight: 600;
      z-index: 10000;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      animation: slideIn 0.3s ease;
    `;

    // Add animation styles if not already added
    if (!document.querySelector('#upsellity-notification-styles')) {
      const style = document.createElement('style');
      style.id = 'upsellity-notification-styles';
      style.textContent = `
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(notification);

    // Remove notification after 3 seconds
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
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

// Add test function for debugging
window.testUpsellityDrawer = function() {
  console.log('Testing Upsellity Cart Drawer...');
  if (window.upsellityDrawer) {
    console.log('Cart Drawer instance:', window.upsellityDrawer);
    console.log('Cart data:', window.upsellityDrawer.cart);
    console.log('Config:', window.upsellityDrawer.config);
    window.upsellityDrawer.open();
  } else {
    console.error('Upsellity Cart Drawer not initialized');
  }
};

