/**
 * Free Shipping Progress Bar Renderer
 * Uses the shared React component for both preview and production
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { FreeShippingBar } from '../../../../../app/components/shared/FreeShippingBar.tsx';

export function renderFreeShippingBar(config, cart) {
  const bar = config?.features?.freeShippingProgressBar;
  
  if (!bar) {
    return '';
  }

  // Create a unique container for this render
  const containerId = `upsellity-free-shipping-bar-root-${Date.now()}`;

  // Return the container that will be hydrated with React
  const html = `<div id="${containerId}"></div>`;

  // Hydrate the React component after DOM is ready
  setTimeout(() => {
    const container = document.getElementById(containerId);
    if (container) {
      const root = createRoot(container);
      root.render(
        React.createElement(FreeShippingBar, {
          thresholdMode: bar.thresholdMode || 'amount',
          thresholdAmount: parseFloat(bar.thresholdAmount) || 0,
          thresholdCount: parseInt(bar.thresholdCount) || 0,
          beforeThresholdMessage: bar.beforeThresholdMessage || 'Add {remaining} for FREE shipping',
          afterThresholdMessage: bar.afterThresholdMessage || '🎉 You qualify for FREE shipping!',
          backgroundColor: bar.backgroundColor || '#f0f9ff',
          progressBarColor: bar.progressBarColor || '#3b82f6',
          showPercentage: bar.showPercentage ?? true,
          currency: bar.currency || 'INR',
          cart: cart,
          isPreview: false
        })
      );
    }
  }, 0);

  return html;
}
