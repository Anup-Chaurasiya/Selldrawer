/**
 * Free Shipping Message Renderer
 * Uses the shared React component for both preview and production
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { FreeShippingMessage } from '../../../../../app/components/shared/FreeShippingMessage.tsx';

const CONTAINER_ID = 'upsellity-free-shipping-msg-root';

export function renderFreeShippingMessage(config, cart, reactRoots = {}) {
  if (!config.features.freeShippingMessage) {
    return '';
  }

  const msg = config.features.freeShippingMessage;
  const html = `<div id="${CONTAINER_ID}"></div>`;

  setTimeout(() => {
    const container = document.getElementById(CONTAINER_ID);
    if (!container) return;

    const props = {
      thresholdAmount: parseFloat(msg.thresholdAmount) || 0,
      cartTotal: cart.total_price,
      beforeThresholdMessage: msg.beforeThresholdMessage || 'Add {remaining} more for FREE shipping',
      achievedMessage: msg.achievedMessage || 'You qualify for FREE shipping!',
      backgroundColor: msg.backgroundColor || '#fef3c7',
      textColor: msg.textColor || '#92400e',
      currency: msg.currency || 'INR',
      isPreview: false
    };

    // Reuse existing root or create new one
    if (!reactRoots[CONTAINER_ID]) {
      reactRoots[CONTAINER_ID] = createRoot(container);
    }
    
    reactRoots[CONTAINER_ID].render(React.createElement(FreeShippingMessage, props));
  }, 0);

  return html;
}

