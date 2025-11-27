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
  backgroundColor: string;
  textColor: string;
  progressBarColor: string;
  unlockedColor: string;
  lockedColor: string;
}

interface MilestonesWidgetProps {
  milestones: Milestone[];
  cartTotal?: number;
  isPreview?: boolean;
  layout?: 'vertical' | 'compact';
}

export function MilestonesWidget({
  milestones,
  cartTotal = 0,
  isPreview = false,
  layout = 'vertical',
}: MilestonesWidgetProps) {
  if (!milestones || milestones.length === 0) {
    return null;
  }

  // Sort milestones by target amount
  const sortedMilestones = [...milestones].sort((a, b) => a.targetAmount - b.targetAmount);
  
  // Get the maximum target amount for calculating positions
  const maxTarget = sortedMilestones[sortedMilestones.length - 1]?.targetAmount || 100;
  const minTarget = sortedMilestones[0]?.targetAmount || 0;
  
  // Calculate positions with better spacing logic
  // Use logarithmic scale if the difference is too large, otherwise use linear
  const getPosition = (targetAmount: number) => {
    const range = maxTarget - minTarget;
    
    // If all milestones are very close or there's only one, use equal spacing
    if (range < maxTarget * 0.1 || sortedMilestones.length === 1) {
      const index = sortedMilestones.findIndex(m => m.targetAmount === targetAmount);
      return 10 + (index * (80 / Math.max(sortedMilestones.length - 1, 1)));
    }
    
    // Use linear scale but ensure minimum spacing between markers
    const linearPosition = ((targetAmount - minTarget) / range) * 80 + 10;
    
    // Ensure minimum 15% spacing between consecutive milestones
    const index = sortedMilestones.findIndex(m => m.targetAmount === targetAmount);
    const minSpacing = 15;
    const minPosition = 10 + (index * minSpacing);
    
    return Math.max(linearPosition, minPosition);
  };
  
  // Calculate current progress percentage
  const currentProgressPercent = Math.min(((cartTotal - minTarget) / (maxTarget - minTarget)) * 80 + 10, 90);
  
  // Find the next milestone to show in the message
  const nextMilestone = sortedMilestones.find(m => m.status !== 'unlocked');
  const allUnlocked = sortedMilestones.every(m => m.status === 'unlocked');
  const displayMessage = allUnlocked 
    ? '🎉 Congratulations! All rewards unlocked!' 
    : nextMilestone?.message || '';

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
        paddingTop: '8px',
        paddingBottom: '32px',
      }}>
        {/* Progress Bar Background */}
        <div style={{
          position: 'relative',
          height: '6px',
          backgroundColor: '#e5e7eb',
          borderRadius: '10px',
          overflow: 'visible',
        }}>
          {/* Progress Bar Fill */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              height: '100%',
              width: `${Math.max(0, Math.min(currentProgressPercent, 100))}%`,
              background: 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)',
              borderRadius: '10px',
              transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />

          {/* Milestone Markers */}
          {sortedMilestones.map((milestone, index) => {
            const position = getPosition(milestone.targetAmount);
            const isUnlocked = milestone.status === 'unlocked';
            const isInProgress = milestone.status === 'in_progress';
            
            // Check if labels might overlap with next milestone
            const nextMilestone = sortedMilestones[index + 1];
            const nextPosition = nextMilestone ? getPosition(nextMilestone.targetAmount) : 100;
            const hasSpaceForLabel = (nextPosition - position) > 12;

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
                {/* Milestone Icon/Circle */}
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: isUnlocked ? '#10b981' : isInProgress ? '#3b82f6' : '#ffffff',
                    border: `3px solid ${isUnlocked ? '#059669' : isInProgress ? '#2563eb' : '#d1d5db'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px',
                    transition: 'all 0.3s ease',
                    boxShadow: isUnlocked || isInProgress ? '0 2px 8px rgba(0, 0, 0, 0.15)' : 'none',
                    position: 'relative',
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
                    whiteSpace: hasSpaceForLabel ? 'nowrap' : 'normal',
                    maxWidth: hasSpaceForLabel ? 'none' : '50px',
                  }}
                >
                  <div style={{
                    fontSize: '10px',
                    fontWeight: '600',
                    color: isUnlocked ? '#10b981' : isInProgress ? '#3b82f6' : '#9ca3af',
                  }}>
                    ₹{milestone.targetAmount.toFixed(0)}
                  </div>
                  <div style={{
                    fontSize: '9px',
                    color: isUnlocked ? '#10b981' : isInProgress ? '#1e40af' : '#9ca3af',
                    marginTop: '2px',
                    maxWidth: '60px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    wordBreak: hasSpaceForLabel ? 'normal' : 'break-word',
                  }}>
                    {milestone.title}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default MilestonesWidget;

