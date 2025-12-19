/**
 * Milestone Block Wrapper Component
 * Standalone milestone progress block that can be placed anywhere on the site
 */

import React from 'react';
import { MilestonesWidget } from '../../../../../app/components/shared/MilestonesWidget.tsx';

export const MilestoneBlockWrapper = ({
  milestones,
  cartTotal,
  progressBarColor,
  allUnlockedMessage,
  shop,
  isPreview = false,
  onImpression
}) => {
  // Track impression when component mounts
  React.useEffect(() => {
    if (onImpression && !isPreview) {
      onImpression();
    }
  }, [onImpression, isPreview]);

  // Handle add to cart
  const handleAddToCart = async (variantId, quantity) => {
    try {
      const formData = {
        items: [{
          id: variantId,
          quantity: quantity
        }]
      };

      const response = await fetch('/cart/add.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        // Refresh cart or show success message
        window.location.reload();
      } else {
        console.error('Failed to add to cart');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  return (
    <div className="upsellity-milestone-block">
      <MilestonesWidget
        milestones={milestones}
        cartTotal={cartTotal}
        isPreview={isPreview}
        layout="vertical"
        progressBarColor={progressBarColor}
        allUnlockedMessage={allUnlockedMessage}
        shop={shop}
        onAddToCart={handleAddToCart}
        source="milestone-block"
      />
    </div>
  );
};
