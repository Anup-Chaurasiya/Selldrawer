/**
 * Promotional Banner Renderer
 * Uses the shared React component for both preview and production
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { PromotionalBannerCard } from '../../../../../app/components/shared/PromotionalBannerCard.tsx';

const CONTAINER_ID = 'upsellity-promo-banner-root';

export function renderPromotionalBanner(config, reactRoots = {}) {
  if (!config.features.promotionalBanner) {
    return '';
  }

  const banner = config.features.promotionalBanner;
  const slides = banner.images || [];
  
  if (slides.length === 0) {
    return `<div id="${CONTAINER_ID}"></div>`;
  }

  const html = `<div id="${CONTAINER_ID}"></div>`;
  
  setTimeout(() => {
    const container = document.getElementById(CONTAINER_ID);
    if (!container) return;

    const props = {
      slides: slides,
      carouselSettings: banner.carouselSettings || {},
      titleColor: banner.titleColor || '#111827',
      descriptionColor: banner.descriptionColor || '#6b7280',
      ctaTextColor: banner.ctaTextColor || '#374151',
      ctaBackgroundColor: banner.ctaBackgroundColor || '#f3f4f6',
      borderColor: banner.borderColor || '#e5e7eb',
      onCtaClick: (url) => {
        if (url && window.upsellityDrawer) {
          window.upsellityDrawer.handleSlideCtaClick(url);
        }
      },
      isPreview: false
    };

    // Reuse existing root or create new one
    if (!reactRoots[CONTAINER_ID]) {
      reactRoots[CONTAINER_ID] = createRoot(container);
    }
    
    reactRoots[CONTAINER_ID].render(React.createElement(PromotionalBannerCard, props));
  }, 0);
  
  return html;
}
