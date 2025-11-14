/**
 * Free Shipping Message Renderer
 * Uses the shared React component for both preview and production
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { FreeShippingMessage } from '../../../../../app/components/shared/FreeShippingMessage.tsx';

export function renderFreeShippingMessage(config, cart) {
  if (!config.features.freeShippingMessage) {
    return '';
  }

  const msg = config.features.freeShippingMessage;
  const containerId = `upsellity-free-shipping-msg-root-${Date.now()}`;
  const html = `<div id="${containerId}"></div>`;

  setTimeout(() => {
    const container = document.getElementById(containerId);
    if (container) {
      const root = createRoot(container);
      root.render(
        React.createElement(FreeShippingMessage, {
          thresholdAmount: parseFloat(msg.thresholdAmount) || 0,
          cartTotal: cart.total_price,
          beforeThresholdMessage: msg.beforeThresholdMessage || 'Add {remaining} more for FREE shipping',
          achievedMessage: msg.achievedMessage || 'You qualify for FREE shipping!',
          backgroundColor: msg.backgroundColor || '#fef3c7',
          textColor: msg.textColor || '#92400e',
          currency: msg.currency || 'INR',
          isPreview: false
        })
      );
    }
  }, 0);

  return html;
}

