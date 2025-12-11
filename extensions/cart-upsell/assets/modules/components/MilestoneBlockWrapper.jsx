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
  isPreview = false,
  onImpression
}) => {
  // Track impression when component mounts
  React.useEffect(() => {
    if (onImpression && !isPreview) {
      onImpression();
    }
  }, [onImpression, isPreview]);

  return (
    <div className="upsellity-milestone-block">
      <MilestonesWidget
        milestones={milestones}
        cartTotal={cartTotal}
        isPreview={isPreview}
        layout="vertical"
        progressBarColor={progressBarColor}
        allUnlockedMessage={allUnlockedMessage}
      />
    </div>
  );
};
