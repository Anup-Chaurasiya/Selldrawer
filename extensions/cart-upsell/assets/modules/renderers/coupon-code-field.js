/**
 * Coupon Code Field Renderer
 * Uses the shared React component for both preview and production
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { CouponCodeField } from '../../../../../app/components/shared/CouponCodeField.tsx';

export function renderCouponCodeField(config, appliedDiscount, availableDiscounts, showingAllOffers) {
  if (!config.features.couponCodeField) {
    return '';
  }

  const couponField = config.features.couponCodeField;
  const containerId = `upsellity-coupon-field-root-${Date.now()}`;
  const html = `<div id="${containerId}"></div>`;

  setTimeout(() => {
    const container = document.getElementById(containerId);
    if (container) {
      const root = createRoot(container);
      root.render(
        React.createElement(CouponCodeField, {
          placeholder: couponField.placeholder || 'Enter coupon code',
          buttonText: couponField.buttonText || 'Apply',
          showAllOffers: couponField.showAllOffers || false,
          showAllOffersButtonText: couponField.showAllOffersButtonText || 'Show all offers',
          enableAutoApply: couponField.enableAutoApply || false,
          appliedDiscount: appliedDiscount,
          availableDiscounts: availableDiscounts,
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
        })
      );
    }
  }, 0);

  return html;
}

