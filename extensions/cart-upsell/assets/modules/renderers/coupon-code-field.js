/**
 * Coupon Code Field Renderer
 * Uses the shared React component for both preview and production
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { CouponCodeField } from '../../../../../app/components/shared/CouponCodeField.tsx';

const CONTAINER_ID = 'upsellity-coupon-field-root';
const COMPONENT_ID = 'upsellity-coupon-field';

export function renderCouponCodeField(config, appliedDiscount, availableDiscounts, showingAllOffers, reactRoots = {}) {
  if (!config.features.couponCodeField) {
    return '';
  }

  const couponField = config.features.couponCodeField;
  const html = `<div id="${CONTAINER_ID}"></div>`;

  setTimeout(() => {
    const container = document.getElementById(CONTAINER_ID);
    if (!container) return;

    const props = {
      id: COMPONENT_ID,
      placeholder: couponField.placeholder || 'Enter coupon code',
      buttonText: couponField.buttonText || 'Apply',
      showAllOffers: couponField.showAllOffers || false,
      showAllOffersButtonText: couponField.showAllOffersButtonText || 'Show all offers',
      enableAutoApply: couponField.enableAutoApply || false,
      appliedDiscount: appliedDiscount,
      availableDiscounts: availableDiscounts,
      backgroundColor: couponField.backgroundColor || '#d1fae5',
      textColor: couponField.textColor || '#065f46',
      couponCodeColor: couponField.couponCodeColor || '',
      borderColor: couponField.borderColor || '#059669',
      appliedDiscountText: couponField.appliedDiscountText || '',
      onApplyCoupon: (code) => {
        if (window.upsellityDrawer) {
          window.upsellityDrawer.applyCouponWithCode(code);
        }
      },
      onRemoveDiscount: () => {
        if (window.upsellityDrawer) {
          window.upsellityDrawer.removeDiscount();
        }
      },
      onSwitchDiscount: (code) => {
        if (window.upsellityDrawer) {
          window.upsellityDrawer.switchDiscount(code);
        }
      },
      isPreview: false
    };

    // Reuse existing root or create new one
    if (!reactRoots[CONTAINER_ID]) {
      reactRoots[CONTAINER_ID] = createRoot(container);
    }
    
    reactRoots[CONTAINER_ID].render(React.createElement(CouponCodeField, props));
  }, 0);

  return html;
}

