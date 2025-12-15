/**
 * Unified Cart Drawer React Component
 * Renders all cart drawer sections as a single React application
 */

import React from 'react';
import { FreeShippingBar } from '../../../../../app/components/shared/FreeShippingBar.tsx';
import { PromotionalBannerCard } from '../../../../../app/components/shared/PromotionalBannerCard.tsx';
import { CartItems } from '../../../../../app/components/shared/CartItems.tsx';
import { ProductRecommendations } from '../../../../../app/components/shared/ProductRecommendations.tsx';
import { SavingsDisplay } from '../../../../../app/components/shared/SavingsDisplay.tsx';
import { FreeShippingMessage } from '../../../../../app/components/shared/FreeShippingMessage.tsx';
import { CouponCodeField } from '../../../../../app/components/shared/CouponCodeField.tsx';
import { CartTotals } from '../../../../../app/components/shared/CartTotals.tsx';
import { MilestonesWidget } from '../../../../../app/components/shared/MilestonesWidget.tsx';
import { FreeGiftSelector } from '../../../../../app/components/shared/FreeGiftSelector.tsx';

export const UnifiedCartDrawer = ({
  config,
  cart,
  appliedDiscount,
  availableDiscounts,
  productCompareAtPrices,
  freeGifts,
  selectedGiftId,
  onClose,
  onCheckout,
  onAddProductToCart,
  onUpdateQuantity,
  onRemoveItem,
  onApplyCoupon,
  onRemoveDiscount,
  onSwitchDiscount,
  onSlideCtaClick,
  onSelectGift,
  onImpression,
  onFeatureImpression,
  onFeatureClick
}) => {
  
  React.useEffect(() => {
    if (onImpression) {
      onImpression();
    }
  }, []);

  // Helper to calculate feature order
  const getFeatureOrder = () => {
    const featureOrder = config?.featureOrder || [];
    
    // Handle case where featureOrder might be a string (legacy) or array (new format)
    let orderArray = [];
    if (typeof featureOrder === 'string') {
      // Legacy string format: "free-shipping-bar,promotional-banner,cart-items,..."
      orderArray = featureOrder.split(',').filter(Boolean);
    } else if (Array.isArray(featureOrder)) {
      // New array format
      orderArray = featureOrder;
    }
    
    // Find the cart items separator (could be 'cart-items' or '__cart-items__')
    const cartItemsIndex = orderArray.findIndex(item => 
      item === 'cart-items' || item === '__cart-items__'
    );
    
    if (cartItemsIndex === -1) {
      // No cart items separator found, return all as beforeItems
      return { beforeItems: orderArray, afterItems: [] };
    }
    
    const beforeItems = orderArray.slice(0, cartItemsIndex);
    const afterItems = orderArray.slice(cartItemsIndex + 1);
    
    return { beforeItems, afterItems };
  };

  // Helper to calculate savings (using Shopify cart data)
  const calculateSavings = () => {
    if (!config?.features?.savingsDisplay) return 0;
    
    const itemLevelSavings = cart.items.reduce((sum, item) => {
      return sum + Math.max(0, (item.original_price - item.final_price)) * item.quantity;
    }, 0);
    
    // Use Shopify's total_discount from cart (in cents)
    const discountSavings = cart.total_discount || 0;
    return Math.max(itemLevelSavings, discountSavings);
  };


  // Render a feature section
  const renderFeature = (featureId) => {
    switch (featureId) {
      case 'free-shipping-bar': {
        const bar = config?.features?.freeShippingProgressBar;
        if (!bar) return null;
        
        return (
          <div key={featureId} style={{ marginBottom: '12px' }}>
            <FreeShippingBar
              thresholdMode={bar.thresholdMode || 'amount'}
              thresholdAmount={parseFloat(bar.thresholdAmount) || 0}
              thresholdCount={parseInt(bar.thresholdCount) || 0}
              beforeThresholdMessage={bar.beforeThresholdMessage || 'Add {remaining} for FREE shipping'}
              afterThresholdMessage={bar.afterThresholdMessage || '🎉 You qualify for FREE shipping!'}
              backgroundColor={bar.backgroundColor || '#f0f9ff'}
              progressBarColor={bar.progressBarColor || '#3b82f6'}
              borderColor={bar.borderColor || '#e2e8f0'}
              showPercentage={bar.showPercentage ?? true}
              currency={bar.currency || 'INR'}
              cart={cart}
              isPreview={false}
            />
          </div>
        );
      }

      case 'promotional-banner': {
        const banner = config?.features?.promotionalBanner;
        if (!banner) return null;
        
        const slides = banner.images || [];
        if (slides.length === 0) return null;
        
        return (
          <div key={featureId} style={{ marginBottom: '12px' }}>
            <PromotionalBannerCard
              slides={slides}
              carouselSettings={banner.carouselSettings || {}}
              titleColor={banner.titleColor || '#111827'}
              descriptionColor={banner.descriptionColor || '#6b7280'}
              ctaTextColor={banner.ctaTextColor || '#374151'}
              ctaBackgroundColor={banner.ctaBackgroundColor || '#f3f4f6'}
              borderColor={banner.borderColor || '#e5e7eb'}
              onCtaClick={(url) => {
                if (onFeatureClick) onFeatureClick('promotional_banner', { url });
                if (onSlideCtaClick) onSlideCtaClick(url);
              }}
              onImpression={() => onFeatureImpression && onFeatureImpression('promotional_banner')}
              isPreview={false}
            />
          </div>
        );
      }

      case 'product-recommendations': {
        const recommendations = config?.features?.productRecommendations;
        if (!recommendations) return null;
        
        const products = recommendations.products || [];
        if (products.length === 0) return null;
        
        return (
          <div key={featureId} style={{ marginBottom: '12px' }}>
            <ProductRecommendations
              title={recommendations.title || "You may also like"}
              products={products}
              layout={recommendations.layout || 'carousel'}
              maxProducts={recommendations.maxProducts || 4}
              showDiscount={recommendations.showDiscount ?? true}
              showDiscountBadge={recommendations.showDiscountBadge ?? true}
              showAddButton={recommendations.showAddButton ?? true}
              onAddToCart={onAddProductToCart}
              onImpression={() => onFeatureImpression && onFeatureImpression('product_recommendations')}
              onProductClick={(productId, variantId) => onFeatureClick && onFeatureClick('product_recommendations', { productId, variantId })}
              isPreview={false}
            />
          </div>
        );
      }

      case 'savings-display': {
        const savingsCfg = config?.features?.savingsDisplay;
        if (!savingsCfg) return null;
        
        // Calculate savings using Shopify cart data
        const totalSavings = calculateSavings();
        if (totalSavings <= 0) return null;
        
        return (
          <div key={featureId} style={{ marginBottom: '12px' }}>
            <SavingsDisplay
              message={savingsCfg.message || 'You saved {amount}!'}
              amount={totalSavings}
              backgroundColor={savingsCfg.backgroundColor || '#dcfce7'}
              textColor={savingsCfg.textColor || '#15803d'}
              borderColor={savingsCfg.borderColor || '#ffffff'}
              isPreview={false}
            />
          </div>
        );
      }

      case 'free-shipping-message': {
        const msg = config?.features?.freeShippingMessage;
        if (!msg) return null;
        
        return (
          <div key={featureId} style={{ marginBottom: '12px' }}>
            <FreeShippingMessage
              thresholdAmount={parseFloat(msg.thresholdAmount) || 0}
              cartTotal={cart.total_price}
              beforeThresholdMessage={msg.beforeThresholdMessage || 'Add {remaining} more for FREE shipping'}
              achievedMessage={msg.achievedMessage || 'You qualify for FREE shipping!'}
              backgroundColor={msg.backgroundColor || '#fef3c7'}
              textColor={msg.textColor || '#92400e'}
              borderColor={msg.borderColor || '#92400e'}
              icon={msg.icon || '🚚'}
              currency={msg.currency || 'INR'}
              isPreview={false}
            />
          </div>
        );
      }

      case 'coupon-code': {
        const couponField = config?.features?.couponCodeField;
        if (!couponField) return null;
        
        return (
          <div key={featureId} style={{ marginBottom: '12px' }}>
            <CouponCodeField
              id="upsellity-coupon-field"
              placeholder={couponField.placeholder || 'Enter coupon code'}
              buttonText={couponField.buttonText || 'Apply'}
              showAllOffers={couponField.showAllOffers || false}
              showAllOffersButtonText={couponField.showAllOffersButtonText || 'Show all offers'}
              enableAutoApply={couponField.enableAutoApply || false}
              appliedDiscount={appliedDiscount}
              availableDiscounts={availableDiscounts}
              backgroundColor={couponField.backgroundColor || '#d1fae5'}
              textColor={couponField.textColor || '#065f46'}
              couponCodeColor={couponField.couponCodeColor || ''}
              borderColor={couponField.borderColor || '#059669'}
              appliedDiscountText={couponField.appliedDiscountText || ''}
              onApplyCoupon={onApplyCoupon}
              onRemoveDiscount={onRemoveDiscount}
              onSwitchDiscount={onSwitchDiscount}
              isPreview={false}
            />
          </div>
        );
      }

      case 'milestones': {
        const milestones = config?.features?.milestones;
        if (!milestones || !milestones.length) return null;
        
        // Milestones are already calculated by the API, just use them directly
        const cartTotalInRupees = cart.total_price / 100; // Convert cents to rupees
        
        return (
          <div key={featureId} style={{ marginBottom: '12px' }}>
            <MilestonesWidget
              milestones={milestones}
              cartTotal={cartTotalInRupees}
              isPreview={false}
              progressBarColor={config?.features?.milestonesProgressBarColor}
              allUnlockedMessage={config?.features?.milestonesAllUnlockedMessage}
            />
          </div>
        );
      }

      case 'free-gifts': {
        if (!freeGifts || freeGifts.length === 0) return null;
        
        return (
          <div key={featureId} style={{ marginBottom: '12px' }}>
            <FreeGiftSelector
              freeGifts={freeGifts}
              selectedGiftId={selectedGiftId}
              onSelectGift={onSelectGift}
              isPreview={false}
            />
          </div>
        );
      }

      default:
        return null;
    }
  };

  const { beforeItems, afterItems } = getFeatureOrder();

  return (
    <>
      <button 
        className="upsellity-close-btn" 
        onClick={onClose}
        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
      >
        ×
      </button>
      
      <h2 
        id="upsellity-cart-header" 
        style={{ fontSize: '20px', fontWeight: 600, marginBottom: '20px' }}
      >
        Your Cart ({cart.item_count} items)
      </h2>

      {/* Features before cart items */}
      {beforeItems.map(renderFeature)}

      {/* Cart items */}
      <div style={{ marginBottom: '12px' }}>
        <CartItems
          items={cart.items}
          productCompareAtPrices={productCompareAtPrices}
          onUpdateQuantity={onUpdateQuantity}
          onRemoveItem={onRemoveItem}
          isPreview={false}
        />
      </div>

      {/* Features after cart items */}
      {afterItems.map(renderFeature)}

      {/* Cart totals */}
      <div style={{ marginBottom: '12px' }}>
        <CartTotals
          items={cart.items}
          totalPrice={cart.total_price}
          subtotalPrice={cart.subtotal_price}
          totalDiscount={cart.total_discount || 0}
          freeGiftVariantIds={
            freeGifts && freeGifts.length > 0 
              ? freeGifts[0].giftProducts.map(gp => gp.shopifyVariantId || gp.shopifyProductId)
              : []
          }
          config={config?.features?.cartTotals ? {
            showOriginalPrice: config.features.cartTotals.showOriginalPrice ?? true,
            showItemDiscounts: config.features.cartTotals.showItemDiscounts ?? true,
            showSubtotal: config.features.cartTotals.showSubtotal ?? true,
            showTaxNotice: config.features.cartTotals.showTaxNotice ?? true,
            subtotalLabel: config.features.cartTotals.subtotalLabel || "Subtotal",
            totalLabel: config.features.cartTotals.totalLabel || "Total",
            taxNoticeText: config.features.cartTotals.taxNoticeText || "Taxes and shipping calculated at checkout",
            originalPriceLabel: config.features.cartTotals.originalPriceLabel || "Original Price",
            itemDiscountsLabel: config.features.cartTotals.itemDiscountsLabel || "Item Discounts",
            borderColor: config.features.cartTotals.borderColor || "#e5e7eb",
            backgroundColor: config.features.cartTotals.backgroundColor || "#ffffff",
            textColor: config.features.cartTotals.textColor || "#374151",
            totalTextColor: config.features.cartTotals.totalTextColor || "#111827",
            discountColor: config.features.cartTotals.discountColor || "#f59e0b",
          } : undefined}
          isPreview={false}
        />
      </div>

      {/* Checkout button */}
      <button 
        className="upsellity-checkout-btn" 
        onClick={onCheckout}
      >
        Checkout
      </button>

      {/* Footer */}
      <div style={{ 
        textAlign: 'center', 
        fontSize: '12px', 
        color: '#6b7280', 
        marginTop: '8px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        gap: '12px' 
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
          Secure Checkout
        </span>
        <span>•</span>
        <span>Free Returns</span>
      </div>
    </>
  );
};

