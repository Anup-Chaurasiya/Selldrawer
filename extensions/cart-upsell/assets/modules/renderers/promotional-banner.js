/**
 * Promotional Banner Renderer
 * Uses the shared React component for both preview and production
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { PromotionalBannerCard } from '../../../../../app/components/shared/PromotionalBannerCard.tsx';

export function renderPromotionalBanner(config) {
  if (!config.features.promotionalBanner) {
    return '';
  }

  const banner = config.features.promotionalBanner;
  const slides = banner.images || [];
  
  if (slides.length === 0) {
    // Return a placeholder div that will be hydrated
    return '<div id="upsellity-promo-banner-root"></div>';
  }

  // Create a unique container for this render
  const containerId = `upsellity-promo-banner-root-${Date.now()}`;
  
  // Return the container that will be hydrated with React
  const html = `<div id="${containerId}"></div>`;
  
  // Hydrate the React component after DOM is ready
  setTimeout(() => {
    const container = document.getElementById(containerId);
    if (container) {
      const root = createRoot(container);
      root.render(
        React.createElement(PromotionalBannerCard, {
          slides: slides,
          carouselSettings: banner.carouselSettings || {},
          onCtaClick: (url) => {
            if (url && window.upsellityDrawer) {
              window.upsellityDrawer.handleSlideCtaClick(url);
            }
          },
          isPreview: false
        })
      );
    }
  }, 0);
  
  return html;
}
