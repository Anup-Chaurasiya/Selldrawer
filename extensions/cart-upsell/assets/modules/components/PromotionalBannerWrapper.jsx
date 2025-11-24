/**
 * Promotional Banner Block Wrapper Component
 * Standalone promotional banner that can be placed anywhere on the site
 */

import React from 'react';
import { PromotionalBannerCard } from '../../../../../app/components/shared/PromotionalBannerCard.tsx';

export const PromotionalBannerWrapper = ({
  slides,
  carouselSettings,
  isPreview = false
}) => {
  // Handle CTA clicks
  const handleCtaClick = (url) => {
    if (url && !isPreview) {
      window.location.href = url;
    }
  };

  return (
    <div className="upsellity-promotional-banner-block">
      <PromotionalBannerCard
        slides={slides}
        carouselSettings={carouselSettings}
        onCtaClick={handleCtaClick}
        isPreview={isPreview}
      />
    </div>
  );
};

