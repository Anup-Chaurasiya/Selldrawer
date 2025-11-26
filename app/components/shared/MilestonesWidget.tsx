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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'unlocked':
        return '✅';
      case 'in_progress':
        return '⏳';
      case 'locked':
        return '🔒';
      default:
        return '🎁';
    }
  };

  const getStatusColor = (milestone: Milestone) => {
    switch (milestone.status) {
      case 'unlocked':
        return milestone.unlockedColor;
      case 'in_progress':
        return milestone.progressBarColor;
      case 'locked':
        return milestone.lockedColor;
      default:
        return milestone.textColor;
    }
  };

  if (layout === 'compact') {
    return (
      <div style={{
        padding: '0',
        backgroundColor: 'transparent',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {milestones.map((milestone) => (
            <div
              key={milestone.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 10px',
                backgroundColor: milestone.backgroundColor,
                borderRadius: '6px',
                borderLeft: `3px solid ${getStatusColor(milestone)}`,
              }}
            >
              <div style={{ fontSize: '16px', lineHeight: '1' }}>
                {milestone.icon || getStatusIcon(milestone.status)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: milestone.textColor,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {milestone.title}
                </div>
                <div style={{
                  fontSize: '11px',
                  color: milestone.textColor,
                  opacity: 0.8,
                }}>
                  {milestone.status === 'unlocked' ? 'Unlocked!' : `₹${milestone.remaining.toFixed(0)} to go`}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      padding: '0',
      backgroundColor: 'transparent',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {milestones.map((milestone, index) => {
          const isNextMilestone = milestone.status === 'in_progress' && 
            (index === 0 || milestones[index - 1].status === 'unlocked');

          return (
            <div
              key={milestone.id}
              style={{
                padding: '10px 12px',
                backgroundColor: milestone.backgroundColor,
                borderRadius: '6px',
                border: 'none',
                transition: 'all 0.3s ease',
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                marginBottom: milestone.showProgressBar && milestone.status !== 'locked' ? '6px' : '0',
              }}>
                <div style={{
                  fontSize: '20px',
                  lineHeight: '1',
                  flexShrink: 0,
                }}>
                  {milestone.icon || getStatusIcon(milestone.status)}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '2px',
                  }}>
                    <div style={{
                      fontSize: '13px',
                      fontWeight: '600',
                      color: milestone.textColor,
                    }}>
                      {milestone.title}
                    </div>
                    <div style={{
                      fontSize: '10px',
                      fontWeight: '600',
                      padding: '2px 6px',
                      borderRadius: '10px',
                      backgroundColor: getStatusColor(milestone),
                      color: '#ffffff',
                    }}>
                      {milestone.status === 'unlocked' ? '✓' : 
                       milestone.status === 'in_progress' ? '⏳' : '🔒'}
                    </div>
                  </div>

                  <div style={{
                    fontSize: '12px',
                    color: milestone.textColor,
                    opacity: 0.85,
                    lineHeight: '1.3',
                  }}>
                    {milestone.message}
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              {milestone.showProgressBar && milestone.status !== 'locked' && (
                <div style={{
                  width: '100%',
                  height: '4px',
                  backgroundColor: 'rgba(0, 0, 0, 0.08)',
                  borderRadius: '2px',
                  overflow: 'hidden',
                  position: 'relative',
                }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${milestone.progress}%`,
                      backgroundColor: milestone.status === 'unlocked' ? milestone.unlockedColor : milestone.progressBarColor,
                      borderRadius: '2px',
                      transition: 'width 0.5s ease',
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default MilestonesWidget;

