/**
 * Product Recommendations Renderer
 * Uses the shared React component for both preview and production
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { ProductRecommendations } from '../../../../../app/components/shared/ProductRecommendations.tsx';

export function renderProductRecommendations(config) {
  if (!config.features.productRecommendations) {
    return '';
  }

  const recommendations = config.features.productRecommendations;
  const products = recommendations.products || [];

  if (products.length === 0) {
    return '';
  }

  // Create a unique container for this render
  const containerId = `upsellity-product-recs-root-${Date.now()}`;

  // Return the container that will be hydrated with React
  const html = `<div id="${containerId}"></div>`;

  // Hydrate the React component after DOM is ready
  setTimeout(() => {
    const container = document.getElementById(containerId);
    if (container) {
      const root = createRoot(container);
      root.render(
        React.createElement(ProductRecommendations, {
          title: recommendations.title || "You may also like",
          products: products,
          layout: recommendations.layout || 'carousel',
          maxProducts: recommendations.maxProducts || 4,
          showDiscount: recommendations.showDiscount ?? true,
          showDiscountBadge: recommendations.showDiscountBadge ?? true,
          showAddButton: recommendations.showAddButton ?? true,
          onAddToCart: (variantId) => {
            if (window.upsellityDrawer) {
              window.upsellityDrawer.addProductToCart(variantId);
            }
          },
          isPreview: false
        })
      );
    }
  }, 0);

  return html;
}
