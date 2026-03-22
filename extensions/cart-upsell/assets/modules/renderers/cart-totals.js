/**
 * Cart Totals Renderer
 * Uses the shared React component for both preview and production
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { CartTotals } from '../../../../../app/components/shared/CartTotals.tsx';

const CONTAINER_ID = 'selldrawer-cart-totals-root';

export function renderCartTotals(cart, appliedDiscount, reactRoots = {}) {
  const html = `<div id="${CONTAINER_ID}"></div>`;

  setTimeout(() => {
    const container = document.getElementById(CONTAINER_ID);
    if (!container) return;

    const props = {
      items: cart.items,
      totalPrice: cart.total_price,
      appliedDiscount: appliedDiscount,
      isPreview: false
    };

    // Reuse existing root or create new one
    if (!reactRoots[CONTAINER_ID]) {
      reactRoots[CONTAINER_ID] = createRoot(container);
    }
    
    reactRoots[CONTAINER_ID].render(React.createElement(CartTotals, props));
  }, 0);

  return html;
}

