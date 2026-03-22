/**
 * Cart Items Renderer
 * Uses the shared React component for both preview and production
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { CartItems } from '../../../../../app/components/shared/CartItems.tsx';

const CONTAINER_ID = 'selldrawer-cart-items-root';

export function renderCartItems(cart, productCompareAtPrices, appliedDiscount, reactRoots = {}) {
  const html = `<div id="${CONTAINER_ID}"></div>`;

  setTimeout(() => {
    const container = document.getElementById(CONTAINER_ID);
    if (!container) return;

    const props = {
      items: cart.items,
      productCompareAtPrices: productCompareAtPrices,
      appliedDiscount: appliedDiscount,
      onUpdateQuantity: (key, quantity) => {
        if (window.selldrawerDrawer) {
          window.selldrawerDrawer.updateQuantity(key, quantity);
        }
      },
      onRemoveItem: (key) => {
        if (window.selldrawerDrawer) {
          window.selldrawerDrawer.removeItem(key);
        }
      },
      isPreview: false
    };

    // Reuse existing root or create new one
    if (!reactRoots[CONTAINER_ID]) {
      reactRoots[CONTAINER_ID] = createRoot(container);
    }
    
    reactRoots[CONTAINER_ID].render(React.createElement(CartItems, props));
  }, 0);

  return html;
}
