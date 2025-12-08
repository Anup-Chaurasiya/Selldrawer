/**
 * Savings Display Renderer
 * Uses the shared React component for both preview and production
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { SavingsDisplay } from '../../../../../app/components/shared/SavingsDisplay.tsx';
import { calculateEstimatedDiscount } from '../discount-manager.js';

const CONTAINER_ID = 'upsellity-savings-display-root';

export function renderSavingsDisplay(config, cart, appliedDiscount, reactRoots = {}) {
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

  const html = `<div id="${CONTAINER_ID}"></div>`;

  setTimeout(() => {
    const container = document.getElementById(CONTAINER_ID);
    if (!container) return;

    const props = {
      message: savingsCfg.message || 'You saved {amount}!',
      amount: totalSavings,
      backgroundColor: savingsCfg.backgroundColor || '#dcfce7',
      textColor: savingsCfg.textColor || '#15803d',
      borderColor: savingsCfg.borderColor || '#ffffff',
      isPreview: false
    };

    // Reuse existing root or create new one
    if (!reactRoots[CONTAINER_ID]) {
      reactRoots[CONTAINER_ID] = createRoot(container);
    }
    
    reactRoots[CONTAINER_ID].render(React.createElement(SavingsDisplay, props));
  }, 0);

  return html;
}

