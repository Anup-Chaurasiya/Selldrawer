/**
 * Product Recommendations Renderer
 * Uses the shared React component for both preview and production
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { ProductRecommendations } from '../../../../../app/components/shared/ProductRecommendations.tsx';

const CONTAINER_ID = 'selldrawer-product-recs-root';

export function renderProductRecommendations(config, reactRoots = {}) {
  if (!config.features.productRecommendations) {
    return '';
  }

  const recommendations = config.features.productRecommendations;
  const products = recommendations.products || [];

  if (products.length === 0) {
    return '';
  }

  const html = `<div id="${CONTAINER_ID}"></div>`;

  setTimeout(() => {
    const container = document.getElementById(CONTAINER_ID);
    if (!container) return;

    const props = {
      title: recommendations.title || "You may also like",
      products: products,
      layout: recommendations.layout || 'carousel',
      maxProducts: recommendations.maxProducts || 4,
      showDiscount: recommendations.showDiscount ?? true,
      showDiscountBadge: recommendations.showDiscountBadge ?? true,
      showAddButton: recommendations.showAddButton ?? true,
      onAddToCart: (variantId) => {
        if (window.selldrawerDrawer) {
          window.selldrawerDrawer.addProductToCart(variantId);
        }
      },
      isPreview: false
    };

    // Reuse existing root or create new one
    if (!reactRoots[CONTAINER_ID]) {
      reactRoots[CONTAINER_ID] = createRoot(container);
    }
    
    reactRoots[CONTAINER_ID].render(React.createElement(ProductRecommendations, props));
  }, 0);

  return html;
}
