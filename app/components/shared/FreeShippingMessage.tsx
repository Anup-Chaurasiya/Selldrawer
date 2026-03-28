/**
 * Shared Free Shipping Message Component
 * Premium redesign — works in any Shopify theme (light)
 */

import React from 'react';

interface FreeShippingMessageProps {
  thresholdAmount: number;
  cartTotal: number; // in cents
  beforeThresholdMessage: string;
  achievedMessage: string;
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  icon?: string;
  currency?: string;
  isPreview?: boolean;
}

export const FreeShippingMessage: React.FC<FreeShippingMessageProps> = ({
  thresholdAmount,
  cartTotal,
  beforeThresholdMessage,
  achievedMessage,
  backgroundColor = '#fef3c7',
  textColor = '#92400e',
  borderColor = '#92400e',
  icon = '🚚',
  currency = 'INR',
  isPreview = false
}) => {
  const cartTotalInCurrency = cartTotal / 100;
  const remaining = Math.max(thresholdAmount - cartTotalInCurrency, 0);
  const isAchieved = remaining <= 0;
  const currencySymbol = currency === 'INR' ? '₹' : '$';

  const message = isAchieved
    ? achievedMessage
    : beforeThresholdMessage
        .replace('{threshold}', `${currencySymbol}${Math.round(thresholdAmount)}`)
        .replace('{remaining}', `${currencySymbol}${Math.round(remaining)}`);

  const keyframes = `
    @keyframes sd-msg-slide-in {
      0% { opacity: 0; transform: translateX(-12px); }
      100% { opacity: 1; transform: translateX(0); }
    }
    @keyframes sd-pill-pulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.4); }
      50% { box-shadow: 0 0 0 6px rgba(16,185,129,0); }
    }
    @keyframes sd-icon-bob {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-3px); }
    }
  `;

  return (
    <>
      <style>{keyframes}</style>
      <div
        style={{
          position: 'relative',
          borderRadius: '12px',
          overflow: 'hidden',
          background: isAchieved
            ? 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)'
            : 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
          border: `1.5px solid ${isAchieved ? '#6ee7b7' : '#fcd34d'}`,
          boxShadow: isAchieved
            ? '0 4px 16px rgba(16,185,129,0.12)'
            : '0 4px 16px rgba(245,158,11,0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 14px',
          animation: 'sd-msg-slide-in 0.35s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        {/* Left accent bar */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: '4px',
            background: isAchieved
              ? 'linear-gradient(180deg, #34d399, #10b981)'
              : 'linear-gradient(180deg, #fbbf24, #f59e0b)',
            borderRadius: '12px 0 0 12px',
          }}
        />

        {/* Icon */}
        <div
          style={{
            fontSize: '22px',
            lineHeight: 1,
            flexShrink: 0,
            paddingLeft: '4px',
            animation: 'sd-icon-bob 2s ease-in-out infinite',
          }}
          aria-hidden="true"
        >
          {isAchieved ? '🎉' : icon}
        </div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: '13px',
              fontWeight: '600',
              color: isAchieved ? '#065f46' : '#78350f',
              lineHeight: '1.4',
              letterSpacing: '-0.01em',
            }}
          >
            {message}
          </div>
        </div>

        {/* Status pill */}
        {isAchieved && (
          <div
            style={{
              flexShrink: 0,
              fontSize: '10px',
              fontWeight: '700',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: '#065f46',
              background: '#d1fae5',
              border: '1px solid #6ee7b7',
              padding: '3px 10px',
              borderRadius: '100px',
              animation: 'sd-pill-pulse 1.5s ease-in-out infinite',
              whiteSpace: 'nowrap',
            }}
          >
            ✓ Unlocked
          </div>
        )}

        {/* Remaining amount chip */}
        {!isAchieved && remaining > 0 && (
          <div
            style={{
              flexShrink: 0,
              fontSize: '11px',
              fontWeight: '700',
              color: '#92400e',
              background: 'rgba(245,158,11,0.15)',
              border: '1px solid rgba(245,158,11,0.3)',
              padding: '3px 10px',
              borderRadius: '100px',
              whiteSpace: 'nowrap',
            }}
          >
            {currencySymbol}{Math.round(remaining)} left
          </div>
        )}
      </div>
    </>
  );
};
