import React from 'react';
import { Card, Text } from '@shopify/polaris';

export interface Milestone {
  id: string;
  title: string;
  targetAmount: number;
  rewardType: string;
  rewardValue: number | null;
  icon?: string;
  status: 'unlocked' | 'in_progress' | 'locked';
  progress: number;
  remaining: number;
  message: string;
  showProgressBar?: boolean;
  iconColor?: string;
  titleColor?: string;
  unlockButtonColor?: string;
}

interface MilestonesWidgetProps {
  milestones: Milestone[];
  cartTotal: number;
  isPreview?: boolean;
  layout?: 'vertical' | 'horizontal';
  progressBarColor?: string;
  allUnlockedMessage?: string;
}

const calculateProgressPercent = (total: number, milestones: Milestone[]) => {
  if (!milestones || milestones.length === 0) return 0;
  
  const sorted = [...milestones].sort((a, b) => a.targetAmount - b.targetAmount);
  const N = sorted.length;
  
  if (total >= sorted[N - 1].targetAmount) return 100;
  
  const points = [{ value: 0, percent: 0 }];
  sorted.forEach((m, index) => {
    points.push({
      value: m.targetAmount,
      percent: ((index + 0.5) / N) * 100
    });
  });
  
  let p1 = points[0];
  let p2 = points[1];
  
  for (let i = 0; i < points.length - 1; i++) {
    if (total >= points[i].value && total <= points[i+1].value) {
      p1 = points[i];
      p2 = points[i+1];
      break;
    }
  }
  
  const fraction = (total - p1.value) / (p2.value - p1.value);
  if (isNaN(fraction) || p2.value === p1.value) return p1.percent;
  return p1.percent + fraction * (p2.percent - p1.percent);
};

export function MilestonesWidget({
  milestones,
  cartTotal,
  isPreview = false,
  layout = 'horizontal',
  progressBarColor = '#10b981',
  allUnlockedMessage = '🎉 Congratulations! All rewards unlocked!'
}: MilestonesWidgetProps) {
  if (!milestones || milestones.length === 0) {
    return null;
  }

  const allUnlocked = milestones.every(m => m.status === 'unlocked');
  const sortedMilestones = [...milestones].sort((a, b) => a.targetAmount - b.targetAmount);
  const progressPercent = calculateProgressPercent(cartTotal, sortedMilestones);

  return (
    <Card>
      <div style={{ padding: '8px 4px' }}>
        {allUnlocked ? (
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <Text as="p" variant="headingMd" fontWeight="bold">
              <span style={{ color: '#00a261', fontSize: '16px' }}>{allUnlockedMessage}</span>
            </Text>
          </div>
        ) : null}
        
        <div style={{ position: 'relative', width: '100%', paddingTop: '12px', paddingBottom: '12px' }}>
          {/* Progress bar background */}
          <div style={{
            position: 'absolute',
            top: '68px',
            left: 0,
            right: 0,
            height: '8px',
            backgroundColor: '#e5e7eb',
            borderRadius: '4px',
            zIndex: 1
          }} />
          
          {/* Progress bar active */}
          <div style={{
            position: 'absolute',
            top: '68px',
            left: 0,
            width: `${progressPercent}%`,
            height: '8px',
            backgroundColor: progressBarColor,
            borderRadius: '4px',
            zIndex: 2,
            transition: 'width 0.5s ease-in-out'
          }} />

          {/* Nodes */}
          <div style={{ display: 'flex', position: 'relative', zIndex: 3 }}>
            {sortedMilestones.map((m) => {
              const isUnlocked = m.status === 'unlocked';
              
              return (
                <div key={m.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  {/* Title */}
                  <div style={{ 
                    height: '36px', 
                    display: 'flex', 
                    alignItems: 'flex-end', 
                    justifyContent: 'center', 
                    marginBottom: '8px',
                    padding: '0 4px',
                    textAlign: 'center'
                  }}>
                    <span style={{ 
                      color: m.titleColor || '#103982', 
                      fontWeight: 700, 
                      fontSize: '15px', 
                      lineHeight: '1.2',
                      letterSpacing: '0.3px'
                    }}>
                      {m.title}
                    </span>
                  </div>
                  
                  {/* Icon */}
                  <div style={{
                    width: '48px',
                    height: '48px',
                    backgroundColor: m.iconColor || '#3b82f6',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                    position: 'relative',
                    border: '2px solid transparent'
                  }}>
                    <span style={{ fontSize: '22px' }}>{m.icon || '🎁'}</span>
                    
                    {isUnlocked && (
                      <div style={{
                        position: 'absolute',
                        bottom: '-4px',
                        right: '-4px',
                        backgroundColor: '#10b981',
                        borderRadius: '50%',
                        width: '20px',
                        height: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px solid #fff',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                      }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Target Amount */}
                  <div style={{ marginTop: '16px' }}>
                    <span style={{ 
                      color: '#3b82f6', 
                      fontWeight: 700, 
                      fontSize: '14px', 
                      letterSpacing: '0.5px' 
                    }}>
                      ₹{m.targetAmount}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
}
