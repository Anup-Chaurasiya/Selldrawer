import React from 'react';
import { Card, Text, BlockStack, InlineStack, Badge } from '@shopify/polaris';

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

export function MilestonesWidget({
  milestones,
  cartTotal,
  isPreview = false,
  layout = 'vertical',
  progressBarColor = '#3b82f6',
  allUnlockedMessage = '🎉 Congratulations! All rewards unlocked!'
}: MilestonesWidgetProps) {
  if (!milestones || milestones.length === 0) {
    return null;
  }

  const allUnlocked = milestones.every(m => m.status === 'unlocked');

  return (
    <Card>
      <BlockStack gap="400">
        {allUnlocked ? (
          <div style={{ padding: '12px', backgroundColor: '#ecfdf5', borderRadius: '8px', textAlign: 'center' }}>
            <Text as="p" variant="bodyMd" fontWeight="bold">
              {allUnlockedMessage}
            </Text>
          </div>
        ) : null}
        
        <BlockStack gap="300">
          {milestones.map((milestone) => (
            <div key={milestone.id} style={{ 
              opacity: milestone.status === 'locked' ? 0.7 : 1,
              border: '1px solid #e5e7eb',
              padding: '12px',
              borderRadius: '8px'
            }}>
              <InlineStack align="space-between" blockAlign="center">
                <InlineStack gap="200" blockAlign="center">
                  <span style={{ fontSize: '24px', color: milestone.iconColor }}>{milestone.icon || '🎁'}</span>
                  <div>
                    <Text as="h3" variant="headingSm" fontWeight="bold">
                      <span style={{ color: milestone.titleColor }}>{milestone.title}</span>
                    </Text>
                    <Text as="p" variant="bodySm" tone="subdued">
                      {milestone.message}
                    </Text>
                  </div>
                </InlineStack>
                {milestone.status === 'unlocked' && <Badge tone="success">Unlocked</Badge>}
              </InlineStack>

              {milestone.showProgressBar && milestone.status !== 'unlocked' && (
                <div style={{ marginTop: '12px' }}>
                  <div style={{ width: '100%', height: '8px', backgroundColor: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ 
                      width: `${milestone.progress}%`, 
                      height: '100%', 
                      backgroundColor: progressBarColor, 
                      transition: 'width 0.3s ease' 
                    }} />
                  </div>
                  <div style={{ marginTop: '4px', textAlign: 'right' }}>
                    <Text as="p" variant="bodySm" tone="subdued">
                      ₹{cartTotal.toFixed(2)} / ₹{milestone.targetAmount.toFixed(2)}
                    </Text>
                  </div>
                </div>
              )}
            </div>
          ))}
        </BlockStack>
      </BlockStack>
    </Card>
  );
}
