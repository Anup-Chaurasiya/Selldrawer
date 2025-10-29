/**
 * Upsellity Cart Drawer
 * Automatically integrates with any Shopify theme
 */

const FEATURE_ORDER_SENTINEL = '__cart-items__';
const DEFAULT_FEATURE_ORDER = [
  'free-shipping-bar',
  'promotional-banner',
  FEATURE_ORDER_SENTINEL,
  'product-recommendations',
  'savings-display',
  'free-shipping-message',
  'coupon-code',
];

function normalizeFeatureOrder(order) {
  const allowed = new Set(DEFAULT_FEATURE_ORDER);
  const raw = Array.isArray(order) ? order.filter((id) => allowed.has(id)) : [];
  const missing = DEFAULT_FEATURE_ORDER.filter((id) => !raw.includes(id));
  const normalized = raw.concat(missing);

  const sentinelIndex = normalized.indexOf(FEATURE_ORDER_SENTINEL);
  if (sentinelIndex === -1) {
    const fallbackIndex = DEFAULT_FEATURE_ORDER.indexOf(FEATURE_ORDER_SENTINEL);
    if (fallbackIndex === -1) {
      normalized.push(FEATURE_ORDER_SENTINEL);
    } else {
      normalized.splice(fallbackIndex, 0, FEATURE_ORDER_SENTINEL);
    }
  } else {
    for (let i = normalized.length - 1; i > sentinelIndex; i -= 1) {
      if (normalized[i] === FEATURE_ORDER_SENTINEL) {
        normalized.splice(i, 1);
      }
    }
  }

  return normalized;
}

function splitFeatureOrder(order) {
  const normalized = normalizeFeatureOrder(order);
  const sentinelIndex = normalized.indexOf(FEATURE_ORDER_SENTINEL);

  if (sentinelIndex === -1) {
    return { beforeItems: normalized, afterItems: [] };
  }

  return {
    beforeItems: normalized.slice(0, sentinelIndex),
    afterItems: normalized.slice(sentinelIndex + 1),
  };
}

class UpsellityCartDrawer {
  constructor() {
    this.shop = window.Shopify?.shop || null;
    this.config = null;
    this.isOpen = false;
    this.cart = null;
    this.appliedDiscount = null; // Store applied discount info
    this.availableDiscounts = []; // Store all available discounts
    this.showingAllOffers = false; // Track if showing all offers dropdown
    
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
        console.warn('Upsellity: App URL not configured');
        this.config = {
          enabled: false,
          features: {}
        };
        return;
      }

      const response = await fetch(`${appUrl}/api/cart-drawer?shop=${this.shop}`);
      this.config = await response.json();
      
      console.log('Upsellity: Loaded config:', this.config);
      console.log('Upsellity: Free shipping message config:', this.config.features?.freeShippingMessage);
    } catch (error) {
      console.error('Upsellity: Failed to load config', error);
      this.config = {
        enabled: false,
        features: {}
      };
    }
  }

  async loadCart() {
    try {
      const response = await fetch('/cart.js');
      this.cart = await response.json();
      
      // Load available discounts and auto-apply if enabled
      await this.loadAvailableDiscounts();
      
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
      this.render();
    }
  }

  async loadAvailableDiscounts() {
    // Check if auto-apply or show all offers is enabled
    const couponField = this.config?.features?.couponCodeField;
    
    if (!couponField || (!couponField.enableAutoApply && !couponField.showAllOffers)) {
      return;
    }

    try {
      const appUrl = document.querySelector('[data-upsellity-app-url]')?.dataset.upsellityAppUrl || '';
      
      const response = await fetch(`${appUrl}/api/available-discounts?shop=${this.shop}`);
      const data = await response.json();


      if (data.discounts && data.discounts.length > 0) {
        this.availableDiscounts = data.discounts;

        // Auto-apply best discount if enabled and no discount is already applied
        if (couponField.enableAutoApply && !this.appliedDiscount) {
          this.autoApplyBestDiscount();
        }
      } else {
        console.warn('Upsellity: No discounts available', {
          count: data.count,
          error: data.error,
          debug: data.debug,
        });
      }
    } catch (error) {
      console.error('Upsellity: Failed to load available discounts', error);
    }
  }

  autoApplyBestDiscount() {
    if (!this.availableDiscounts || this.availableDiscounts.length === 0) {
      return;
    }

    const couponField = this.config?.features?.couponCodeField;
    const strategy = couponField?.autoApplyStrategy || 'best_value';

    let bestDiscount = null;

    if (strategy === 'best_value') {
      // Calculate which discount provides the most savings
      let maxSavings = 0;
      for (const discount of this.availableDiscounts) {
        const savings = this.calculateDiscountSavings(discount);
        if (savings > maxSavings) {
          maxSavings = savings;
          bestDiscount = discount;
        }
      }
    } else if (strategy === 'highest_percentage') {
      // Find the highest percentage discount
      for (const discount of this.availableDiscounts) {
        if (discount.type === 'percentage') {
          if (!bestDiscount || discount.value > bestDiscount.value) {
            bestDiscount = discount;
          }
        }
      }
    } else if (strategy === 'first_available') {
      // Use the first available discount
      bestDiscount = this.availableDiscounts[0];
    }

    if (bestDiscount) {
      this.appliedDiscount = bestDiscount;
    }
  }

  calculateDiscountSavings(discount) {
    if (!this.cart) return 0;

    const cartTotal = this.cart.total_price;

    switch (discount.type) {
      case 'percentage':
        return Math.round((cartTotal * discount.value) / 100);
      case 'fixed':
        return Math.min(discount.value * 100, cartTotal);
      case 'free_shipping':
        // Estimate shipping savings (e.g., ₹100)
        return 10000; // ₹100 in cents
      case 'bxgy':
        // Can't calculate, return a nominal value
        return 5000; // ₹50 in cents
      default:
        return 0;
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

    // Load external CSS file
    this.loadStyles();

    // Close on overlay click
    drawer.querySelector('.upsellity-drawer-overlay').addEventListener('click', () => {
      this.close();
    });
  }

  loadStyles() {
    // Check if styles are already loaded
    if (document.querySelector('#upsellity-cart-drawer-styles')) {
      return;
    }

    // Create link element for external CSS
    const link = document.createElement('link');
    link.id = 'upsellity-cart-drawer-styles';
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = '/extensions/cart-upsell/assets/cart-drawer.css';
    
    // Fallback: if external CSS fails to load, inject inline styles
    link.onerror = () => {
      console.warn('Upsellity: Failed to load external CSS, using fallback');
      this.injectFallbackStyles();
    };
    
    document.head.appendChild(link);
  }

  injectFallbackStyles() {
    // Minimal fallback styles if external CSS fails to load
    const style = document.createElement('style');
    style.id = 'upsellity-cart-drawer-fallback-styles';
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
    `;
    
    document.head.appendChild(style);
  }

  render() {
    if (!this.cart) {
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
    
    
    let html = `
      <button class="upsellity-close-btn" onclick="window.upsellityDrawer.close()">×</button>
      <h2 style="font-size: 20px; font-weight: 600; margin-bottom: 20px;">
        Your Cart (${this.cart.item_count} items)
      </h2>
    `;

    const sections = {
      'free-shipping-bar': '',
      'promotional-banner': '',
      [FEATURE_ORDER_SENTINEL]: '',
      'product-recommendations': '',
      'savings-display': '',
      'free-shipping-message': '',
      'coupon-code': '',
    };

    // Enhanced Free Shipping Progress Bar - Only show if configured
    const bar = this.config?.features?.freeShippingProgressBar;
    
    if (bar) {
      let threshold, progress, remaining, isComplete, message;
      
      if (bar.thresholdMode === 'count') {
        // Count-based mode
        threshold = parseInt(bar.thresholdCount);
        progress = Math.min((this.cart.item_count / threshold) * 100, 100);
        remaining = Math.max(threshold - this.cart.item_count, 0);
        isComplete = progress >= 100;
        message = isComplete 
          ? (bar.afterThresholdMessage || '🎉 You qualify for FREE shipping!')
          : bar.beforeThresholdMessage.replace('{remaining}', `${remaining} more items`);
      } else {
        // Amount-based mode (default)
        threshold = parseFloat(bar.thresholdAmount);
        progress = Math.min((this.cart.total_price / 100 / threshold) * 100, 100);
        remaining = Math.max(threshold - (this.cart.total_price / 100), 0);
        isComplete = progress >= 100;
        message = isComplete 
          ? (bar.afterThresholdMessage || '🎉 You qualify for FREE shipping!')
          : bar.beforeThresholdMessage.replace('{remaining}', `${bar.currency === 'INR' ? '₹' : '$'}${Math.round(remaining)}`);
      }
      

      // Get colors from configuration
      const backgroundColor = bar.backgroundColor || '#f8fafc';
      const progressBarColor = bar.progressBarColor || '#10b981';
      const incompleteColor = bar.progressBarColor || '#f59e0b';
      
      // Create gradient backgrounds
      const backgroundGradient = `linear-gradient(135deg, ${backgroundColor} 0%, ${backgroundColor}dd 100%)`;
      const completeGradient = `linear-gradient(135deg, #10b981 0%, #059669 100%)`;
      const incompleteGradient = `linear-gradient(135deg, ${incompleteColor} 0%, ${incompleteColor}dd 100%)`;
      const percentageGradient = isComplete ? completeGradient : `linear-gradient(135deg, ${progressBarColor} 0%, ${progressBarColor}dd 100%)`;
      
      sections['free-shipping-bar'] = `
        <div class="upsellity-progress-bar-enhanced" style="margin-bottom: 20px; padding: 16px; background: ${backgroundGradient}; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);">
          <div class="upsellity-progress-bar-text-enhanced" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; font-size: 14px; font-weight: 600;">
            <span class="upsellity-progress-bar-message" style="color: #374151;">
              ${message}
            </span>
            ${bar.showPercentage ? `<span class="upsellity-progress-bar-percentage" style="background: ${percentageGradient}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; box-shadow: 0 2px 4px ${progressBarColor}40;">${progress.toFixed(0)}%</span>` : ''}
          </div>
          <div class="upsellity-progress-bar-track-enhanced" style="width: 100%; height: 12px; border-radius: 8px; overflow: hidden; background: ${backgroundColor}; position: relative; box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);">
            <div class="upsellity-progress-bar-fill-enhanced ${isComplete ? 'upsellity-progress-complete' : 'upsellity-progress-incomplete'}" 
                 style="width: ${progress}%; height: 100%; display: block; background: ${isComplete ? completeGradient : incompleteGradient}; border-radius: 8px; transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);"></div>
          </div>
        </div>
      `;
    }

    // Promotional Banner Carousel - Matches Configuration Preview
    if (this.config.features.promotionalBanner) {
      const banner = this.config.features.promotionalBanner;
      const slides = banner.images || [];
      const carouselSettings = banner.carouselSettings || {};
      let promoHtml = '';
      
      if (slides.length > 0) {
        const carouselId = `upsellity-promo-carousel-${Date.now()}`;
        
        promoHtml = `
          <div class="upsellity-promo-carousel-wrapper" style="
            margin-bottom: 16px;
            border-radius: 10px;
            overflow: hidden;
            background-color: #fff;
            border: 1px solid #e5e7eb;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          ">
            <!-- Media Section -->
            <div class="upsellity-promo-carousel" id="${carouselId}" style="
              position: relative;
              overflow: hidden;
              height: 160px;
              background-color: #000;
            ">
              <!-- Carousel Track -->
              <div class="upsellity-promo-carousel-track" style="
                display: flex;
                height: 100%;
                transition: transform 0.5s ease;
              ">
                ${slides.map((slide, index) => `
                  <div class="upsellity-promo-slide" data-slide-index="${index}" style="
                    min-width: 100%;
                    height: 100%;
                    position: relative;
                  ">
                    ${slide.videoUrl && slide.videoType === 'mp4' ? `
                      <video 
                        src="${slide.videoUrl}"
                        style="width: 100%; height: 100%; object-fit: cover;"
                        muted
                        loop
                        autoplay
                        playsinline
                      ></video>
                    ` : `
                      <img 
                        src="${slide.imageUrl}" 
                        alt="Promotional slide ${index + 1}"
                        style="width: 100%; height: 100%; object-fit: cover;"
                      />
                    `}
                  </div>
                `).join('')}
              </div>
              
              <!-- Navigation Arrows -->
              ${slides.length > 1 && carouselSettings.showArrows !== false ? `
                <button 
                  onclick="window.upsellityDrawer.promoCarouselPrev('${carouselId}')"
                  style="
                    position: absolute;
                    left: 12px;
                    top: 50%;
                    transform: translateY(-50%);
                    background-color: rgba(255,255,255,0.9);
                    border-radius: 50%;
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    border: none;
                    font-size: 18px;
                    font-weight: bold;
                    color: #333;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                    transition: all 0.2s ease;
                    z-index: 10;
                  "
                >‹</button>
                <button 
                  onclick="window.upsellityDrawer.promoCarouselNext('${carouselId}')"
                  style="
                    position: absolute;
                    right: 12px;
                    top: 50%;
                    transform: translateY(-50%);
                    background-color: rgba(255,255,255,0.9);
                    border-radius: 50%;
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    border: none;
                    font-size: 18px;
                    font-weight: bold;
                    color: #333;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                    transition: all 0.2s ease;
                    z-index: 10;
                  "
                >›</button>
              ` : ''}
              
              <!-- Dot Indicators -->
              ${slides.length > 1 && carouselSettings.showDots !== false ? `
                <div style="
                  position: absolute;
                  bottom: 12px;
                  left: 50%;
                  transform: translateX(-50%);
                  display: flex;
                  gap: 8px;
                  z-index: 10;
                ">
                  ${slides.map((_, index) => `
                    <button 
                      onclick="window.upsellityDrawer.promoCarouselGoTo('${carouselId}', ${index})"
                      data-dot-index="${index}"
                      style="
                        width: 12px;
                        height: 12px;
                        border-radius: 50%;
                        background-color: ${index === 0 ? '#007bff' : 'rgba(255,255,255,0.6)'};
                        border: 2px solid rgba(255,255,255,0.9);
                        transition: all 0.3s ease;
                        cursor: pointer;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                        padding: 0;
                      "
                    ></button>
                  `).join('')}
                </div>
              ` : ''}
              
              <!-- 5% Edge Previews -->
              ${slides.length > 1 ? `
                <div class="upsellity-promo-prev-edge" style="
                  position: absolute;
                  left: 0;
                  top: 0;
                  height: 100%;
                  width: 5%;
                  overflow: hidden;
                  opacity: 0.5;
                  pointer-events: none;
                  display: none;
                "></div>
                <div class="upsellity-promo-next-edge" style="
                  position: absolute;
                  right: 0;
                  top: 0;
                  height: 100%;
                  width: 5%;
                  overflow: hidden;
                  opacity: 0.5;
                  pointer-events: none;
                  display: ${slides.length > 1 ? 'block' : 'none'};
                ">
                  <img src="${slides[1].imageUrl}" alt="Next" style="width: 100%; height: 100%; object-fit: cover;" />
                </div>
              ` : ''}
            </div>
            
            <!-- Text Content Section (Below Image) -->
            <div class="upsellity-promo-text-section" style="
              background-color: #fff;
              padding: 10px 12px;
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 12px;
              min-height: 60px;
            ">
              <!-- CTA Button - Left Side -->
              <div class="upsellity-promo-cta-container" style="flex-shrink: 0;">
                ${slides.map((slide, index) => `
                  <button 
                    class="upsellity-promo-cta-btn"
                    data-slide-cta="${index}"
                    onclick="window.upsellityDrawer.handleSlideCtaClick('${slide.ctaUrl || ''}')"
                    style="
                      display: ${index === 0 ? 'block' : 'none'};
                      background-color: #ff6b35;
                      color: #ffffff;
                      border: none;
                      padding: 8px 16px;
                      border-radius: 6px;
                      font-weight: 600;
                      cursor: pointer;
                      font-size: 14px;
                      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
                      transition: all 0.2s ease;
                      min-width: 110px;
                      ${!slide.ctaText ? 'visibility: hidden;' : ''}
                    "
                  >${slide.ctaText || 'Shop Now'}</button>
                `).join('')}
              </div>
              
              <!-- Title & Description - Right Side -->
              <div class="upsellity-promo-text-container" style="
                flex: 1;
                text-align: right;
                min-width: 0;
              ">
                ${slides.map((slide, index) => `
                  <div 
                    class="upsellity-promo-text-content"
                    data-slide-text="${index}"
                    style="display: ${index === 0 ? 'block' : 'none'};"
                  >
                    ${slide.title ? `
                      <div style="
                        font-weight: 700;
                        font-size: 18px;
                        color: #1f2937;
                        margin-bottom: ${slide.description ? '2px' : '0'};
                        line-height: 1.2;
                      ">${slide.title}</div>
                    ` : ''}
                    ${slide.description ? `
                      <div style="
                        font-size: 14px;
                        color: #6b7280;
                        line-height: 1.4;
                      ">${slide.description}</div>
                    ` : ''}
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        `;
        
        // Initialize carousel with auto-rotation
        setTimeout(() => {
          this.initializePromoCarousel(carouselId, slides, carouselSettings);
        }, 100);
      } else {
        promoHtml = `
          <div class="upsellity-promo-carousel-wrapper" style="
            margin-bottom: 16px;
            border-radius: 10px;
            overflow: hidden;
            background-color: #fff;
            border: 1px solid #e5e7eb;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          ">
            <div style="
              position: relative;
              overflow: hidden;
              height: 160px;
              background-color: #000;
            ">
              <img 
                src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=160&fit=crop&crop=center" 
                alt="Sample promotional banner"
                style="width: 100%; height: 100%; object-fit: cover;"
              />
              <div style="
                position: absolute;
                bottom: 6px;
                left: 50%;
                transform: translateX(-50%);
                display: flex;
                gap: 4px;
                z-index: 10;
              ">
                <div style="
                  width: 6px;
                  height: 6px;
                  border-radius: 50%;
                  background-color: #007bff;
                  border: 1px solid rgba(255,255,255,0.9);
                  box-shadow: 0 1px 2px rgba(0,0,0,0.2);
                "></div>
                <div style="
                  width: 6px;
                  height: 6px;
                  border-radius: 50%;
                  background-color: rgba(255,255,255,0.6);
                  border: 1px solid rgba(255,255,255,0.9);
                  box-shadow: 0 1px 2px rgba(0,0,0,0.2);
                "></div>
              </div>
            </div>
            <div style="
              background-color: #fff;
              padding: 10px 12px;
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 12px;
              min-height: 60px;
              flex-wrap: wrap;
            ">
              <div style="flex-shrink: 0;">
                <button style="
                  background-color: #ff6b35;
                  color: #ffffff;
                  border: none;
                  padding: 6px 14px;
                  border-radius: 6px;
                  font-weight: 600;
                  cursor: pointer;
                  font-size: 14px;
                  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
                  transition: all 0.2s ease;
                  min-width: 110px;
                ">shop</button>
              </div>
              <div style="flex: 1; text-align: right; min-width: 0;">
                <div style="
                  font-weight: 700;
                  font-size: 18px;
                  color: #1f2937;
                  margin-bottom: 2px;
                  line-height: 1.2;
                ">Summer Sale</div>
                <div style="
                  font-size: 14px;
                  color: #6b7280;
                  line-height: 1.4;
                ">Get 20% Off on Summer Items</div>
              </div>
            </div>
          </div>
        `;
      }

      sections['promotional-banner'] = promoHtml;
    }

    // Cart Items with Quantity Controls
    let cartItemsHtml = '';

    this.cart.items.forEach(item => {
      cartItemsHtml += `
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
              <button class="upsellity-remove-btn" onclick="window.upsellityDrawer.removeItem('${item.key}')" title="Remove item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3,6 5,6 21,6"></polyline>
                  <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
                  <line x1="10" y1="11" x2="10" y2="17"></line>
                  <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
              </button>
            </div>
          </div>
        </div>
      `;
    });

    sections[FEATURE_ORDER_SENTINEL] = cartItemsHtml;

    // Product Recommendations
    if (this.config.features.productRecommendations) {
      const recommendations = this.config.features.productRecommendations;
      
      // For now, show sample recommendations. In a real implementation, 
      // you would fetch actual recommended products based on the configuration
      // Use actual recommended products from configuration
      const recommendedProducts = recommendations.products || [];

      let recommendationsHtml = `
        <div class="upsellity-recommendations">
          <div class="upsellity-recommendations-title">${recommendations.title}</div>
          <div class="upsellity-recommendations-container" style="position: relative;">
            <!-- Left Arrow -->
            <button class="upsellity-nav-arrow upsellity-nav-left" 
                    onclick="window.upsellityDrawer.scrollRecommendations('left')"
                    style="display: none;">
              <span>‹</span>
            </button>
            
            <!-- Right Arrow -->
            <button class="upsellity-nav-arrow upsellity-nav-right" 
                    onclick="window.upsellityDrawer.scrollRecommendations('right')"
                    style="display: none;">
              <span>›</span>
            </button>
            
            <div class="upsellity-recommendations-grid">
              ${recommendedProducts.slice(0, recommendations.maxProducts || 4).map(product => {
                const originalPrice = product.compareAtPrice || product.price;
                const discount = product.compareAtPrice && product.compareAtPrice > product.price 
                  ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100) 
                  : 0;
                return `
                  <div class="upsellity-recommendation-card">
                    <div class="upsellity-recommendation-image" style="position: relative;">
                      ${product.imageUrl ? `
                        <img src="${product.imageUrl}" alt="${product.title}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px;" />
                      ` : `
                        <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 24px;">📦</div>
                      `}
                      ${recommendations.showDiscountBadge && discount > 0 ? `
                        <div style="position: absolute; top: 8px; right: 8px; background-color: #10b981; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px; z-index: 10;">
                          ${discount}% off
                        </div>
                      ` : ''}
                    </div>
                    <div style="font-size: 13px; font-weight: 500; margin-bottom: 4px; line-height: 1.3;">
                      ${product.title.length > 20 ? product.title.substring(0, 20) + '...' : product.title}
                    </div>
                    <div style="margin-bottom: 4px;">
                      ${recommendations.showDiscount && product.compareAtPrice && product.compareAtPrice > product.price ? `
                        <span style="text-decoration: line-through; color: #9ca3af; font-size: 12px; margin-right: 4px;">
                          ₹${Math.round(product.compareAtPrice)}
                        </span>
                      ` : ''}
                      <span style="font-weight: 600; font-size: 12px;">₹${Math.round(product.price)}</span>
                    </div>
                    ${recommendations.showAddButton ? `
                      <button class="upsellity-add-recommendation-btn" 
                              onclick="window.upsellityDrawer.addProductToCart('${product.shopifyVariantId || product.shopifyProductId}')"
                              style="width: 100%; padding: 4px 8px; border: 1px solid #f97316; background: white; color: #f97316; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 500; transition: all 0.2s ease;">
                        + Add
                      </button>
                    ` : ''}
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>
      `;

      sections['product-recommendations'] = recommendationsHtml;
    }

    // Savings Display
    if (this.config.features.savingsDisplay) {
      const savings = this.config.features.savingsDisplay;
      const totalSavings = this.cart.items.reduce((sum, item) => {
        return sum + (item.original_price - item.final_price) * item.quantity;
      }, 0);

      if (totalSavings > 0) {
        sections['savings-display'] = `
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

      console.log('Upsellity: Free shipping message debug:', {
        msg,
        threshold,
        remaining,
        cartTotal: this.cart.total_price,
        cartTotalInRupees: this.cart.total_price / 100
      });

      sections['free-shipping-message'] = `
        <div class="upsellity-shipping-message" style="background-color: ${msg.backgroundColor}; color: ${msg.textColor}; border: 2px solid ${msg.textColor}; padding: 14px 18px; border-radius: 12px; display: flex; align-items: center; gap: 12px; font-size: 14px; font-weight: 700; margin-bottom: 8px; box-shadow: 0 3px 6px rgba(0, 0, 0, 0.1); position: relative; overflow: hidden;">
          <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(45deg, rgba(255,255,255,0.2) 0%, transparent 50%); pointer-events: none;"></div>
          <div style="font-size: 20px; flex-shrink: 0; position: relative; z-index: 1;">🚚</div>
          <span style="position: relative; z-index: 1; text-shadow: 0 1px 2px rgba(0,0,0,0.1); flex: 1;">
            ${remaining > 0 
              ? msg.beforeThresholdMessage.replace('{threshold}', `${msg.currency === 'INR' ? '₹' : '$'}${Math.round(threshold)}`).replace('{remaining}', `${msg.currency === 'INR' ? '₹' : '$'}${Math.round(remaining)}`)
              : msg.achievedMessage
            }
          </span>
        </div>
      `;
    }

    // Coupon Code Field
    if (this.config.features.couponCodeField) {
      const couponField = this.config.features.couponCodeField;
      
      sections['coupon-code'] = `
        <div class="upsellity-coupon-field">
          <!-- Manual Coupon Input (Always at top) -->
          <div class="upsellity-coupon-input-container">
            <div class="upsellity-coupon-input-wrapper">
              <input 
                type="text" 
                id="upsellity-coupon-input" 
                class="upsellity-coupon-input"
                placeholder="${couponField.placeholder || 'Enter coupon code'}"
                onkeypress="if(event.key === 'Enter') window.upsellityDrawer.applyCoupon()"
              />
            </div>
            <button 
              class="upsellity-coupon-apply-btn"
              onclick="window.upsellityDrawer.applyCoupon()"
            >
              ${couponField.buttonText || 'Apply'}
            </button>
          </div>
          <div id="upsellity-coupon-message" class="upsellity-coupon-message"></div>

          <!-- Auto-Applied Discount Section -->
          ${this.appliedDiscount ? `
            <div class="upsellity-applied-discount">
              <div class="upsellity-applied-discount-content">
                <div class="upsellity-discount-checkmark">✓</div>
                <div class="upsellity-discount-info">
                  <div class="upsellity-discount-title">
                    ${this.appliedDiscount.code} - ${this.appliedDiscount.description}
                  </div>
                  <div class="upsellity-discount-subtitle">
                    ${couponField.enableAutoApply ? 'Best offer automatically applied' : 'Applied'}
                  </div>
                </div>
                <button 
                  class="upsellity-discount-remove"
                  onclick="window.upsellityDrawer.removeDiscount()"
                >
                  Remove
                </button>
              </div>
            </div>
          ` : ''}

          <!-- Show All Offers Button & Dropdown -->
          ${couponField.showAllOffers && this.availableDiscounts.length > 0 ? `
            <button 
              class="upsellity-show-offers-btn"
              onclick="window.upsellityDrawer.toggleAllOffers()"
            >
              <span style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 16px;">🎁</span>
                <span>${couponField.showAllOffersButtonText || 'Show all offers'} (${this.availableDiscounts.length} available)</span>
              </span>
              <span style="font-size: 12px; color: #6b7280; transition: transform 0.3s ease;" id="upsellity-offers-arrow">${this.showingAllOffers ? '▲' : '▼'}</span>
            </button>

              <!-- Offers Dropdown -->
              <div id="upsellity-all-offers-dropdown" class="upsellity-offers-list" style="display: ${this.showingAllOffers ? 'block' : 'none'};">
                ${this.availableDiscounts.map(discount => `
                  <div 
                    class="upsellity-offer-item ${this.appliedDiscount?.code === discount.code ? 'selected' : ''}"
                    onclick="window.upsellityDrawer.switchDiscount('${discount.code}')"
                  >
                    <div class="upsellity-offer-content">
                      <div class="upsellity-offer-checkbox">
                        ${this.appliedDiscount?.code === discount.code ? '✓' : ''}
                      </div>
                      <div class="upsellity-offer-details">
                        <div class="upsellity-offer-code">
                          ${discount.code} - ${discount.description}
                        </div>
                        <div class="upsellity-offer-description">
                          ${discount.title}
                        </div>
                      </div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      `;
    }

    const { beforeItems, afterItems } = splitFeatureOrder(this.config?.featureOrder);

    beforeItems.forEach((id) => {
      if (sections[id]) {
        html += sections[id];
      }
    });

    if (sections[FEATURE_ORDER_SENTINEL]) {
      html += sections[FEATURE_ORDER_SENTINEL];
    }

    afterItems.forEach((id) => {
      if (sections[id]) {
        html += sections[id];
      }
    });

    // Cart Totals and Checkout
    const subtotal = this.cart.total_price;
    const estimatedDiscount = this.calculateEstimatedDiscount();
    const estimatedTotal = Math.max(0, subtotal - estimatedDiscount);
    
    html += `
      <div style="border-top: 2px solid #e5e7eb; padding-top: 16px; margin-top: 20px;">
        <div style="font-size: 16px; margin-bottom: 12px; display: flex; justify-content: space-between;">
          <span style="color: #6b7280;">Subtotal</span>
          <span>${this.formatMoney(subtotal)}</span>
        </div>
        ${this.appliedDiscount && estimatedDiscount > 0 ? `
          <div style="font-size: 16px; margin-bottom: 12px; display: flex; justify-content: space-between; color: #059669;">
            <span>Discount (${this.appliedDiscount.code})</span>
            <span>-${this.formatMoney(estimatedDiscount)}</span>
          </div>
          <div style="font-size: 18px; font-weight: 600; padding-top: 12px; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between;">
            <span>Estimated Total</span>
            <span>${this.formatMoney(estimatedTotal)}</span>
          </div>
        ` : `
          <div style="font-size: 18px; font-weight: 600; padding-top: 12px; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between;">
            <span>Total</span>
            <span>${this.formatMoney(subtotal)}</span>
          </div>
        `}
      </div>
      <button class="upsellity-checkout-btn" onclick="window.location.href='${this.getCheckoutUrl()}'">
        Checkout →
      </button>
      ${this.appliedDiscount ? `
        <div style="text-align: center; font-size: 11px; color: #6b7280; margin-top: 8px; font-style: italic;">
          Final discount will be applied at checkout
        </div>
      ` : ''}
      <div style="text-align: center; font-size: 12px; color: #6b7280; margin-top: 8px;">
        Secure Checkout • Free Returns
      </div>
    `;

    inner.innerHTML = html;
    
    // Initialize product recommendations navigation after rendering
    setTimeout(() => {
      this.initializeRecommendationsNavigation();
    }, 100);
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

  // Initialize promotional banner carousel
  initializePromoCarousel(carouselId, slides, settings) {
    const carousel = document.getElementById(carouselId);
    if (!carousel || slides.length <= 1) return;

    const track = carousel.querySelector('.upsellity-promo-carousel-track');
    const dots = carousel.querySelectorAll('[data-dot-index]');
    const prevEdge = carousel.querySelector('.upsellity-promo-prev-edge');
    const nextEdge = carousel.querySelector('.upsellity-promo-next-edge');
    
    // Get text content and CTA elements
    const textContents = document.querySelectorAll('[data-slide-text]');
    const ctaButtons = document.querySelectorAll('[data-slide-cta]');
    
    if (!track) return;

    let currentIndex = 0;
    let autoRotateInterval;

    const updateCarousel = () => {
      const translateX = -currentIndex * 100;
      track.style.transform = `translateX(${translateX}%)`;
      
      // Update dot indicators
      dots.forEach((dot, index) => {
        if (index === currentIndex) {
          dot.style.backgroundColor = '#007bff';
        } else {
          dot.style.backgroundColor = 'rgba(255,255,255,0.6)';
        }
      });

      // Update text content visibility
      textContents.forEach((content, index) => {
        content.style.display = index === currentIndex ? 'block' : 'none';
      });

      // Update CTA button visibility
      ctaButtons.forEach((button, index) => {
        button.style.display = index === currentIndex ? 'block' : 'none';
      });

      // Update edge previews
      if (prevEdge && nextEdge) {
        const prevIndex = (currentIndex - 1 + slides.length) % slides.length;
        const nextIndex = (currentIndex + 1) % slides.length;
        
        if (currentIndex > 0) {
          prevEdge.style.display = 'block';
          prevEdge.innerHTML = `<img src="${slides[prevIndex].imageUrl}" alt="Previous" style="width: 100%; height: 100%; object-fit: cover;" />`;
        } else {
          prevEdge.style.display = 'none';
        }
        
        if (currentIndex < slides.length - 1) {
          nextEdge.style.display = 'block';
          nextEdge.innerHTML = `<img src="${slides[nextIndex].imageUrl}" alt="Next" style="width: 100%; height: 100%; object-fit: cover;" />`;
        } else {
          nextEdge.style.display = 'none';
        }
      }
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

    // Store methods globally for onclick handlers
    window.upsellityDrawer.promoCarouselNext = (id) => {
      if (id === carouselId) nextSlide();
    };
    
    window.upsellityDrawer.promoCarouselPrev = (id) => {
      if (id === carouselId) prevSlide();
    };
    
    window.upsellityDrawer.promoCarouselGoTo = (id, index) => {
      if (id === carouselId) goToSlide(index);
    };

    // Auto-rotate if enabled
    if (settings.autoRotate !== false) {
      const rotationSpeed = settings.rotationSpeed || 5000;
      autoRotateInterval = setInterval(nextSlide, rotationSpeed);
      
      // Pause on hover
      carousel.addEventListener('mouseenter', () => {
        if (autoRotateInterval) {
          clearInterval(autoRotateInterval);
        }
      });
      
      carousel.addEventListener('mouseleave', () => {
        if (settings.autoRotate !== false) {
          autoRotateInterval = setInterval(nextSlide, rotationSpeed);
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

  // Handle slide CTA button clicks
  handleSlideCtaClick(url) {
    if (url) {
      window.location.href = url;
    }
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
  async applyCoupon() {
    const couponInput = document.getElementById('upsellity-coupon-input');
    const messageDiv = document.getElementById('upsellity-coupon-message');
    const applyBtn = document.querySelector('.upsellity-coupon-apply-btn');
    
    if (!couponInput || !messageDiv) {
      console.error('Upsellity: Coupon elements not found');
      return;
    }

    const couponCode = couponInput.value.trim().toUpperCase();
    if (!couponCode) {
      messageDiv.textContent = 'Please enter a coupon code';
      messageDiv.style.color = '#ef4444';
      return;
    }

    // Show loading state
    messageDiv.textContent = 'Validating coupon...';
    messageDiv.style.color = '#6b7280';
    if (applyBtn) applyBtn.disabled = true;

    try {
      // Get app URL for API calls
      const appUrl = document.querySelector('[data-upsellity-app-url]')?.dataset.upsellityAppUrl || '';
      
      // Validate discount code via API
      const response = await fetch(`${appUrl}/api/validate-discount?shop=${this.shop}&code=${encodeURIComponent(couponCode)}`);
      const data = await response.json();

      if (data.valid) {
        // Store the discount info
        this.appliedDiscount = {
          code: data.code,
          title: data.title,
          type: data.type,
          value: data.value
        };

        // Show success message
        const couponField = this.config.features.couponCodeField;
        messageDiv.textContent = couponField.successMessage || 'Coupon applied successfully!';
        messageDiv.style.color = '#10b981';
        
        // Clear input
        couponInput.value = '';
        
        // Re-render to show discount and updated checkout button
        this.render();
      } else {
        // Show error message
        const couponField = this.config.features.couponCodeField;
        messageDiv.textContent = data.error || couponField.errorMessage || 'Invalid coupon code';
        messageDiv.style.color = '#ef4444';
      }
    } catch (error) {
      console.error('Upsellity: Error validating coupon', error);
      const couponField = this.config.features.couponCodeField;
      messageDiv.textContent = couponField.errorMessage || 'Invalid coupon code';
      messageDiv.style.color = '#ef4444';
    } finally {
      if (applyBtn) applyBtn.disabled = false;
    }
  }

  // Remove applied discount
  removeDiscount() {
    this.appliedDiscount = null;
    this.render();
    this.showNotification('Discount removed', 'info');
  }

  // Get human-readable discount description
  getDiscountDescription() {
    if (!this.appliedDiscount) return '';
    
    const { type, value } = this.appliedDiscount;
    
    switch (type) {
      case 'percentage':
        return `${value}% off your order`;
      case 'fixed':
        return `₹${value} off your order`;
      case 'free_shipping':
        return 'Free shipping on your order';
      case 'bxgy':
        return 'Buy X Get Y discount';
      default:
        return 'Discount will be applied at checkout';
    }
  }

  // Calculate estimated discount amount
  calculateEstimatedDiscount() {
    if (!this.appliedDiscount || !this.cart) return 0;
    
    const { type, value } = this.appliedDiscount;
    
    switch (type) {
      case 'percentage':
        // Percentage discount on cart total
        return Math.round((this.cart.total_price * value) / 100);
      case 'fixed':
        // Fixed amount discount (value is in rupees, convert to cents)
        return Math.min(value * 100, this.cart.total_price);
      case 'free_shipping':
        // We can't calculate shipping here, so return 0
        return 0;
      case 'bxgy':
        // Complex discount, can't estimate
        return 0;
      default:
        return 0;
    }
  }

  // Get checkout URL with discount code
  getCheckoutUrl() {
    if (this.appliedDiscount) {
      return `/checkout?discount=${encodeURIComponent(this.appliedDiscount.code)}`;
    }
    return '/checkout';
  }

  async addProductToCart(variantId, quantity = 1) {
    try {
      
      if (!variantId) {
        throw new Error('No variant ID provided');
      }

      // Check if variantId is a numeric ID or a product handle
      if (/^\d+$/.test(variantId)) {
        // It's a numeric variant ID - use it directly
        const formData = new FormData();
        formData.append('id', variantId);
        formData.append('quantity', quantity.toString());

        const response = await fetch('/cart/add.js', {
          method: 'POST',
          body: formData
        });

        if (response.ok) {
          await this.loadCart();
          this.showNotification('Product added to cart!', 'success');
        } else {
          const error = await response.json();
          console.error('Cart add error:', error);
          this.showNotification(error.description || 'Failed to add product to cart', 'error');
        }
      } else {
        // It's a product handle - fetch product and use first variant
        await this.addProductToCartByHandle(variantId, null, quantity);
      }
    } catch (error) {
      console.error('Error adding product to cart:', error);
      this.showNotification('Failed to add product to cart', 'error');
    }
  }

  async addProductToCartByHandle(productHandle, variantId, quantity = 1) {
    try {
      
      // Check if productHandle is a numeric ID (legacy data) or a handle
      let productResponse;
      if (/^\d+$/.test(productHandle)) {
        // It's a numeric ID, try to use it directly as variant ID
        const formData = new FormData();
        formData.append('id', productHandle);
        formData.append('quantity', quantity.toString());

        const response = await fetch('/cart/add.js', {
          method: 'POST',
          body: formData
        });

        if (response.ok) {
          await this.loadCart();
          this.showNotification('Product added to cart!', 'success');
          return;
        } else {
          console.error('Failed to add product with numeric ID:', productHandle);
          throw new Error('Product not found');
        }
      } else {
        // It's a product handle, fetch the product data
        productResponse = await fetch(`/products/${productHandle}.js`);
        if (!productResponse.ok) {
          console.error('Product not found for handle:', productHandle);
          throw new Error('Product not found');
        }
      }
      
      const product = await productResponse.json();
      
      // Use the first variant if no specific variant ID provided
      const variant = variantId ? 
        product.variants.find(v => v.id.toString() === variantId.toString()) :
        product.variants[0];
      
      if (!variant) {
        console.error('No variant found for product:', product.title);
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
        console.error('Cart add failed:', error);
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

  toggleAllOffers() {
    this.showingAllOffers = !this.showingAllOffers;
    
    const dropdown = document.getElementById('upsellity-all-offers-dropdown');
    const arrow = document.getElementById('upsellity-offers-arrow');
    
    if (dropdown) {
      dropdown.style.display = this.showingAllOffers ? 'block' : 'none';
    }
    
    if (arrow) {
      arrow.textContent = this.showingAllOffers ? '▲' : '▼';
    }
  }

  async switchDiscount(discountCode) {
    // Find the discount in available discounts
    const discount = this.availableDiscounts.find(d => d.code === discountCode);
    
    if (!discount) {
      console.error('Upsellity: Discount not found', discountCode);
      return;
    }

    // Apply the selected discount
    this.appliedDiscount = discount;
    
    // Re-render to update UI
    this.render();
    
    // Show success message
    this.showNotification(`${discount.code} applied!`, 'success');
  }

  // Initialize product recommendations navigation
  initializeRecommendationsNavigation() {
    const grid = document.querySelector('.upsellity-recommendations-grid');
    const leftArrow = document.querySelector('.upsellity-nav-left');
    const rightArrow = document.querySelector('.upsellity-nav-right');
    
    if (!grid || !leftArrow || !rightArrow) return;
    
    // Check if scrolling is needed
    const needsScrolling = grid.scrollWidth > grid.clientWidth;
    
    const updateArrows = () => {
      const maxScrollLeft = grid.scrollWidth - grid.clientWidth;
      const currentScroll = grid.scrollLeft;
      
      // Show/hide arrows based on scroll position
      const showLeft = currentScroll > 0;
      const showRight = currentScroll < maxScrollLeft;
      
      leftArrow.style.display = showLeft ? 'flex' : 'none';
      rightArrow.style.display = showRight ? 'flex' : 'none';
      
      // Update padding to prevent content overlap
      grid.style.paddingLeft = showLeft ? '40px' : '0';
      grid.style.paddingRight = showRight ? '40px' : '0';
    };
    
    if (needsScrolling) {
      // Show right arrow initially
      updateArrows();
      
      // Add scroll event listener
      grid.addEventListener('scroll', updateArrows);
    } else {
      // Hide both arrows if no scrolling needed
      leftArrow.style.display = 'none';
      rightArrow.style.display = 'none';
      grid.style.paddingLeft = '0';
      grid.style.paddingRight = '0';
    }
  }

  // Scroll product recommendations
  scrollRecommendations(direction) {
    const grid = document.querySelector('.upsellity-recommendations-grid');
    if (!grid) return;
    
    const scrollAmount = 140; // Width of one product card + gap
    
    if (direction === 'left') {
      grid.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    } else if (direction === 'right') {
      grid.scrollBy({ left: scrollAmount, behavior: 'smooth' });
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

    // Animation styles are now in the external CSS file

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


