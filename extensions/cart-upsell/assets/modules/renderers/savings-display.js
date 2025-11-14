/**
 * Savings Display Renderer
 * Uses the shared React component for both preview and production
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { SavingsDisplay } from '../../../../../app/components/shared/SavingsDisplay.tsx';
import { calculateEstimatedDiscount } from '../discount-manager.js';

export function renderSavingsDisplay(config, cart, appliedDiscount) {
  if (!config.features.savingsDisplay) {
    return '';
  }

  const savingsCfg = config.features.savingsDisplay;
  
  // Calculate savings
  const itemLevelSavings = cart.items.reduce((sum, item) => {
    return sum + Math.max(0, (item.original_price - item.final_price)) * item.quantity;
  }, 0);
  const discountSavings = appliedDiscount ? calculateEstimatedDiscount(appliedDiscount, cart) : 0;
  const totalSavings = Math.max(itemLevelSavings, discountSavings);

  if (totalSavings <= 0) {
    return '';
  }

  const containerId = `upsellity-savings-display-root-${Date.now()}`;
  const html = `<div id="${containerId}"></div>`;

  setTimeout(() => {
    const container = document.getElementById(containerId);
    if (container) {
      const root = createRoot(container);
      root.render(
        React.createElement(SavingsDisplay, {
          message: savingsCfg.message || 'You saved {amount}!',
          amount: totalSavings,
          backgroundColor: savingsCfg.backgroundColor || '#dcfce7',
          textColor: savingsCfg.textColor || '#15803d',
          isPreview: false
        })
      );
    }
  }, 0);

  return html;
}

