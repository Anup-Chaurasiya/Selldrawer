/**
 * Promotional Banner Block Wrapper Component
 * Standalone promotional banner that can be placed anywhere on the site
 */

import React from 'react';
import { PromotionalBannerCard } from '../../../../../app/components/shared/PromotionalBannerCard.tsx';

export const PromotionalBannerWrapper = ({
  slides,
  carouselSettings,
  isPreview = false,
  maxHeight = '180px',
  onImpression,
  onCtaClick
}) => {
  // Handle CTA clicks
  const handleCtaClick = (url) => {
    if (onCtaClick) {
      onCtaClick(url);
    }
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
        onImpression={onImpression}
        isPreview={isPreview}
        context="block"
        maxHeight={maxHeight}
      />
    </div>
  );
};

