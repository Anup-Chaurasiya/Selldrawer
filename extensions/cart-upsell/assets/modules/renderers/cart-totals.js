/**
 * Cart Totals Renderer
 * Uses the shared React component for both preview and production
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { CartTotals } from '../../../../../app/components/shared/CartTotals.tsx';

export function renderCartTotals(cart, appliedDiscount) {
  const containerId = `upsellity-cart-totals-root-${Date.now()}`;
  const html = `<div id="${containerId}"></div>`;

  setTimeout(() => {
    const container = document.getElementById(containerId);
    if (container) {
      const root = createRoot(container);
      root.render(
        React.createElement(CartTotals, {
          items: cart.items,
          totalPrice: cart.total_price,
          appliedDiscount: appliedDiscount,
          isPreview: false
        })
      );
    }
  }, 0);

  return html;
}

