/**
 * Free Shipping Progress Bar Renderer
 * Uses the shared React component for both preview and production
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { FreeShippingBar } from '../../../../../app/components/shared/FreeShippingBar.tsx';

const CONTAINER_ID = 'selldrawer-free-shipping-bar-root';

export function renderFreeShippingBar(config, cart, reactRoots = {}, onAddProduct = null) {
  const bar = config?.features?.freeShippingProgressBar;
  
  if (!bar) {
    return '';
  }

  const html = `<div id="${CONTAINER_ID}"></div>`;

  setTimeout(() => {
    const container = document.getElementById(CONTAINER_ID);
    if (!container) return;

    const props = {
      thresholdMode: bar.thresholdMode || 'amount',
      thresholdAmount: parseFloat(bar.thresholdAmount) || 0,
      thresholdCount: parseInt(bar.thresholdCount) || 0,
      beforeThresholdMessage: bar.beforeThresholdMessage || 'Add {remaining} for FREE shipping',
      afterThresholdMessage: bar.afterThresholdMessage || '🎉 You qualify for FREE shipping!',
      backgroundColor: bar.backgroundColor || '#f0f9ff',
      progressBarColor: bar.progressBarColor || '#3b82f6',
      borderColor: bar.borderColor || '#e2e8f0',
      showPercentage: bar.showPercentage ?? true,
      currency: bar.currency || 'INR',
      cart: cart,
      isPreview: false,
      showProductUpsell: bar.showProductUpsell ?? true,
      upsellHeaderText: bar.upsellHeaderText || "Almost there! Add this to unlock free shipping:",
      appUrl: config?.appUrl || window.selldrawer_config?.appUrl,
      shop: config?.shop || window.selldrawer_config?.shop || window.Shopify?.shop,
      onAddProduct: onAddProduct,
    };

    // Reuse existing root or create new one
    if (!reactRoots[CONTAINER_ID]) {
      reactRoots[CONTAINER_ID] = createRoot(container);
    }
    
    reactRoots[CONTAINER_ID].render(React.createElement(FreeShippingBar, props));
  }, 0);

  return html;
}
