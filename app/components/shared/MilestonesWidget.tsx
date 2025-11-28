import React from 'react';

interface Milestone {
  id: string;
  title: string;
  description?: string;
  targetAmount: number;
  rewardType: string;
  rewardValue?: number | null;
  icon?: string;
  status: 'unlocked' | 'in_progress' | 'locked';
  progress: number;
  remaining: number;
  message: string;
  showProgressBar: boolean;
  iconColor: string;
  titleColor: string;
  amountColor: string;
}

interface MilestonesWidgetProps {
  milestones: Milestone[];
  cartTotal?: number;
  isPreview?: boolean;
  layout?: 'vertical' | 'compact';
  progressBarColor?: string;
  allUnlockedMessage?: string;
}

export function MilestonesWidget({
  milestones,
  cartTotal = 0,
  isPreview = false,
  layout = 'vertical',
  progressBarColor,
  allUnlockedMessage,
}: MilestonesWidgetProps) {
  if (!milestones || milestones.length === 0) {
    return null;
  }

  // Sort milestones by target amount
  const sortedMilestones = [...milestones].sort((a, b) => a.targetAmount - b.targetAmount);
  
  // Get the maximum target amount for calculating positions
  const maxTarget = sortedMilestones[sortedMilestones.length - 1]?.targetAmount || 100;
  const minTarget = sortedMilestones[0]?.targetAmount || 0;
  
  // Calculate positions with consistent spacing
  const getPosition = (targetAmount: number) => {
    const index = sortedMilestones.findIndex(m => m.targetAmount === targetAmount);
    
    // For single milestone, always place at 50%
    if (sortedMilestones.length === 1) {
      return 50;
    }
    
    // For 2 milestones, place at 25% and 75%
    if (sortedMilestones.length === 2) {
      return index === 0 ? 25 : 75;
    }
    
    // For 3 milestones, place at 20%, 50%, and 80%
    if (sortedMilestones.length === 3) {
      return [20, 50, 80][index];
    }
    
    // Fallback for more than 3 (shouldn't happen but just in case)
    const spacing = 80 / (sortedMilestones.length - 1);
    return 10 + (index * spacing);
  };
  
  // Calculate current progress percentage
  // Find which milestone segment we're in
  const getCurrentProgressPercent = () => {
    if (sortedMilestones.length === 0) return 0;
    
    // If cart total is less than first milestone
    if (cartTotal < sortedMilestones[0].targetAmount) {
      const firstPosition = getPosition(sortedMilestones[0].targetAmount);
      const progress = (cartTotal / sortedMilestones[0].targetAmount) * firstPosition;
      return Math.min(progress, firstPosition);
    }
    
    // Find the segment we're in
    for (let i = 0; i < sortedMilestones.length - 1; i++) {
      const currentMilestone = sortedMilestones[i];
      const nextMilestone = sortedMilestones[i + 1];
      
      if (cartTotal >= currentMilestone.targetAmount && cartTotal < nextMilestone.targetAmount) {
        const currentPos = getPosition(currentMilestone.targetAmount);
        const nextPos = getPosition(nextMilestone.targetAmount);
        const segmentProgress = (cartTotal - currentMilestone.targetAmount) / 
                               (nextMilestone.targetAmount - currentMilestone.targetAmount);
        return currentPos + (segmentProgress * (nextPos - currentPos));
      }
    }
    
    // If we've passed all milestones, stop at the last one
    const lastMilestone = sortedMilestones[sortedMilestones.length - 1];
    return getPosition(lastMilestone.targetAmount);
  };
  
  const currentProgressPercent = getCurrentProgressPercent();
  
  // Get the last milestone position to cap the progress bar
  const lastMilestone = sortedMilestones[sortedMilestones.length - 1];
  const lastMilestonePosition = getPosition(lastMilestone.targetAmount);
  
  // Cap progress to never exceed the last milestone position
  const cappedProgressPercent = Math.min(currentProgressPercent, lastMilestonePosition);
  
  // Find the next milestone to show in the message
  const nextMilestone = sortedMilestones.find(m => m.status !== 'unlocked');
  const allUnlocked = sortedMilestones.every(m => m.status === 'unlocked');
  
  // If only one milestone and it's unlocked, show its message instead of "all unlocked"
  const displayMessage = allUnlocked 
    ? (sortedMilestones.length === 1 
        ? sortedMilestones[0].message 
        : (allUnlockedMessage || '🎉 Congratulations! All rewards unlocked!'))
    : nextMilestone?.message || '';

  // Use the provided progress bar color or fallback to default
  const finalProgressBarColor = progressBarColor || '#3b82f6';
  
  // Create a gradient from the color (darker shade for gradient effect)
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  const getGradient = (color: string) => {
    const rgb = hexToRgb(color);
    if (rgb) {
      // Create a slightly darker version for gradient
      const darkerR = Math.max(0, rgb.r - 20);
      const darkerG = Math.max(0, rgb.g - 20);
      const darkerB = Math.max(0, rgb.b - 20);
      return `linear-gradient(90deg, ${color} 0%, rgb(${darkerR}, ${darkerG}, ${darkerB}) 100%)`;
    }
    return `linear-gradient(90deg, ${color} 0%, ${color} 100%)`;
  };

  const progressBarGradient = getGradient(finalProgressBarColor);

  return (
    <div style={{
      padding: '12px 14px',
      backgroundColor: '#ffffff',
      borderRadius: '10px',
      border: '1px solid #e5e7eb',
    }}>
      {/* Header Message */}
      <div style={{
        marginBottom: '16px',
        textAlign: 'center',
      }}>
        <div style={{
          fontSize: '13px',
          fontWeight: '600',
          color: allUnlocked ? '#059669' : '#1f2937',
        }}>
          {displayMessage}
        </div>
      </div>

      {/* Unified Progress Bar with Milestones */}
      <div style={{
        position: 'relative',
        paddingTop: sortedMilestones.length === 1 ? '40px' : sortedMilestones.length === 2 ? '36px' : '32px',
        paddingBottom: '32px',
        width: '100%',
      }}>
        {/* Progress Bar Background */}
        <div style={{
          position: 'absolute',
          left: 0,
          top: '50%',
          transform: 'translateY(-50%)',
          height: '6px',
          backgroundColor: '#e5e7eb',
          borderRadius: '10px',
          width: `${lastMilestonePosition}%`,
          zIndex: 0,
        }}>
          {/* Progress Bar Fill */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              height: '100%',
              width: lastMilestonePosition > 0 ? `${Math.max(0, Math.min((cappedProgressPercent / lastMilestonePosition) * 100, 100))}%` : '0%',
              background: progressBarGradient,
              borderRadius: '10px',
              transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
              minWidth: cappedProgressPercent > 0 ? '4px' : '0',
              zIndex: 1,
              display: 'block',
            }}
            data-progress-bar-color={finalProgressBarColor}
            data-gradient={progressBarGradient}
          />
        </div>

        {/* Milestone Markers */}
        {sortedMilestones.map((milestone, index) => {
          const position = getPosition(milestone.targetAmount);
          const isUnlocked = milestone.status === 'unlocked';
          const isInProgress = milestone.status === 'in_progress';

          return (
            <div
              key={milestone.id}
              style={{
                position: 'absolute',
                left: `${position}%`,
                top: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 10,
              }}
            >
                {/* Milestone Title - Above (Close to Icon, Always Horizontal) */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    marginBottom: '6px',
                    textAlign: 'center',
                    width: 'max-content',
                    maxWidth: sortedMilestones.length === 1 ? '200px' : sortedMilestones.length === 2 ? '140px' : '100px',
                  }}
                >
                  <div style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    color: milestone.titleColor || '#1e40af',
                    whiteSpace: 'normal',
                    lineHeight: '1.3',
                    display: 'block',
                    wordBreak: 'break-word',
                    hyphens: 'auto',
                  }}>
                    {milestone.title}
                  </div>
                </div>

                {/* Milestone Icon/Circle */}
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: milestone.iconColor || '#3b82f6',
                    border: `3px solid ${milestone.iconColor || '#3b82f6'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px',
                    transition: 'all 0.3s ease',
                    boxShadow: isUnlocked || isInProgress ? '0 2px 8px rgba(0, 0, 0, 0.15)' : 'none',
                    position: 'relative',
                    opacity: isUnlocked ? 1 : isInProgress ? 0.9 : 0.5,
                  }}
                  title={`${milestone.title} - ₹${milestone.targetAmount}`}
                >
                  <span>{milestone.icon || '🎁'}</span>
                  {isUnlocked && (
                    <div
                      style={{
                        position: 'absolute',
                        right: '-4px',
                        bottom: '-4px',
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        backgroundColor: '#10b981',
                        border: '2px solid #ffffff',
                        color: '#ffffff',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      ✓
                    </div>
                  )}
                </div>

                {/* Milestone Amount - Below */}
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    marginTop: '8px',
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <div style={{
                    fontSize: '10px',
                    fontWeight: '600',
                    color: milestone.amountColor || '#3b82f6',
                  }}>
                    ₹{milestone.targetAmount.toFixed(0)}
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}

export default MilestonesWidget;

