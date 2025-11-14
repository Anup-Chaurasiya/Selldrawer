/**
 * Cart Items Renderer
 * Uses the shared React component for both preview and production
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { CartItems } from '../../../../../app/components/shared/CartItems.tsx';

export function renderCartItems(cart, productCompareAtPrices, appliedDiscount) {
  const containerId = `upsellity-cart-items-root-${Date.now()}`;
  const html = `<div id="${containerId}"></div>`;

  setTimeout(() => {
    const container = document.getElementById(containerId);
    if (container) {
      const root = createRoot(container);
      root.render(
        React.createElement(CartItems, {
          items: cart.items,
          productCompareAtPrices: productCompareAtPrices,
          appliedDiscount: appliedDiscount,
          onUpdateQuantity: (key, quantity) => {
            if (window.upsellityDrawer) {
              window.upsellityDrawer.updateQuantity(key, quantity);
            }
          },
          onRemoveItem: (key) => {
            if (window.upsellityDrawer) {
              window.upsellityDrawer.removeItem(key);
            }
          },
          isPreview: false
        })
      );
    }
  }, 0);

  return html;
}
