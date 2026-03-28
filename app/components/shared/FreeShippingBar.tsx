/**
 * Shared Free Shipping Progress Bar Component
 * Premium redesign — works in any Shopify theme (light)
 */

import React, { useEffect, useRef, useState } from 'react';

interface Cart {
  item_count: number;
  total_price: number;
}

interface FreeShippingBarProps {
  thresholdMode: 'amount' | 'count';
  thresholdAmount?: number;
  thresholdCount?: number;
  beforeThresholdMessage?: string;
  afterThresholdMessage?: string;
  backgroundColor?: string;
  progressBarColor?: string;
  borderColor?: string;
  showPercentage?: boolean;
  currency?: string;
  cart: Cart;
  isPreview?: boolean;
}

export const FreeShippingBar: React.FC<FreeShippingBarProps> = ({
  thresholdMode,
  thresholdAmount,
  thresholdCount,
  beforeThresholdMessage = 'Add {remaining} for FREE shipping',
  afterThresholdMessage = "🎉 You qualify for FREE shipping!",
  backgroundColor = '#f0f9ff',
  progressBarColor = '#7c3aed',
  borderColor = '#e8e0ff',
  showPercentage = true,
  currency = 'INR',
  cart,
  isPreview = false
}) => {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [celebrated, setCelebrated] = useState(false);
  const prevCompleteRef = useRef(false);

  const calculateProgress = () => {
    if (thresholdMode === 'amount' && thresholdAmount) {
      const cartTotal = cart.total_price / 100;
      return Math.min((cartTotal / thresholdAmount) * 100, 100);
    } else if (thresholdMode === 'count' && thresholdCount) {
      return Math.min((cart.item_count / thresholdCount) * 100, 100);
    }
    return 0;
  };

  const calculateRemaining = () => {
    if (thresholdMode === 'amount' && thresholdAmount) {
      const cartTotal = cart.total_price / 100;
      return Math.max(thresholdAmount - cartTotal, 0);
    } else if (thresholdMode === 'count' && thresholdCount) {
      return Math.max(thresholdCount - cart.item_count, 0);
    }
    return 0;
  };

  const progress = calculateProgress();
  const remaining = calculateRemaining();
  const isComplete = progress >= 100;

  // Animate progress on mount and change
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(progress);
    }, 80);
    return () => clearTimeout(timer);
  }, [progress]);

  // Celebration trigger
  useEffect(() => {
    if (isComplete && !prevCompleteRef.current) {
      setCelebrated(true);
      const t = setTimeout(() => setCelebrated(false), 2000);
      return () => clearTimeout(t);
    }
    prevCompleteRef.current = isComplete;
  }, [isComplete]);

  const currencySymbol = currency === 'INR' ? '₹' : '$';

  const getMessage = () => {
    if (isComplete) return afterThresholdMessage;
    let message = beforeThresholdMessage;
    if (thresholdMode === 'amount') {
      message = message.replace('{remaining}', `${currencySymbol}${Math.round(remaining)}`);
    } else {
      message = message.replace('{remaining}', `${Math.round(remaining)} more items`);
    }
    return message;
  };

  const message = getMessage();

  // Derive fill color from prop
  const fillColor = isComplete ? '#10b981' : progressBarColor;
  const glowColor = isComplete ? 'rgba(16,185,129,0.35)' : `${progressBarColor}55`;

  const keyframes = `
    @keyframes sd-truck-slide {
      0% { transform: translateX(-4px); }
      50% { transform: translateX(2px); }
      100% { transform: translateX(-4px); }
    }
    @keyframes sd-shimmer-bar {
      0% { background-position: -200% center; }
      100% { background-position: 200% center; }
    }
    @keyframes sd-celebrate-pulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.04); opacity: 0.9; }
    }
    @keyframes sd-flash-in {
      0% { opacity: 0; transform: translateY(6px); }
      100% { opacity: 1; transform: translateY(0); }
    }
  `;

  return (
    <>
      <style>{keyframes}</style>
      <div
        style={{
          background: isComplete
            ? 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)'
            : 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
          borderRadius: '14px',
          border: `1.5px solid ${isComplete ? '#6ee7b7' : borderColor}`,
          padding: '12px 16px',
          boxShadow: isComplete
            ? '0 4px 20px rgba(16,185,129,0.12)'
            : '0 4px 20px rgba(124,58,237,0.08)',
          animation: celebrated ? 'sd-celebrate-pulse 0.5s ease-in-out 2' : undefined,
          transition: 'all 0.4s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        {/* Top row: truck icon + message + badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
          {/* Truck icon */}
          <div
            style={{
              fontSize: '20px',
              lineHeight: 1,
              flexShrink: 0,
              animation: isComplete ? undefined : 'sd-truck-slide 1.8s ease-in-out infinite',
              transition: 'all 0.4s ease',
            }}
            aria-hidden="true"
          >
            {isComplete ? '🎉' : '🚚'}
          </div>

          {/* Message */}
          <div
            style={{
              flex: 1,
              fontSize: '13px',
              fontWeight: '600',
              color: isComplete ? '#065f46' : '#4c1d95',
              lineHeight: '1.35',
              letterSpacing: '-0.01em',
              animation: 'sd-flash-in 0.35s ease',
            }}
          >
            {message}
          </div>

          {/* Percentage badge */}
          {showPercentage && (
            <div
              style={{
                flexShrink: 0,
                fontSize: '11px',
                fontWeight: '700',
                color: isComplete ? '#065f46' : '#5b21b6',
                background: isComplete ? 'rgba(16,185,129,0.15)' : 'rgba(124,58,237,0.12)',
                padding: '3px 9px',
                borderRadius: '20px',
                letterSpacing: '0.02em',
                border: `1px solid ${isComplete ? 'rgba(16,185,129,0.3)' : 'rgba(124,58,237,0.2)'}`,
              }}
            >
              {isComplete ? '✓ FREE' : `${Math.round(progress)}%`}
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '8px',
            borderRadius: '100px',
            background: isComplete ? 'rgba(16,185,129,0.15)' : 'rgba(124,58,237,0.12)',
            overflow: 'visible',
            display: 'block',
          }}
        >
          {/* Fill */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              height: '100%',
              width: `${animatedProgress}%`,
              borderRadius: '100px',
              background: isComplete
                ? 'linear-gradient(90deg, #34d399, #10b981)'
                : `linear-gradient(90deg, ${fillColor}cc, ${fillColor})`,
              boxShadow: `0 0 10px ${glowColor}`,
              transition: 'width 0.7s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.4s ease',
              backgroundSize: '200% 100%',
              animation: !isComplete && animatedProgress > 5
                ? 'sd-shimmer-bar 2.5s linear infinite'
                : undefined,
              display: 'block',
            }}
          />

          {/* Thumb dot at progress edge */}
          {!isComplete && animatedProgress > 3 && (
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: `${animatedProgress}%`,
                transform: 'translate(-50%, -50%)',
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                background: fillColor,
                boxShadow: `0 0 0 3px white, 0 0 0 5px ${fillColor}44`,
                transition: 'left 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
                zIndex: 2,
              }}
            />
          )}
        </div>

        {/* Milestone ticks (if amount mode) */}
        {!isComplete && thresholdMode === 'amount' && thresholdAmount && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '5px' }}>
            <span style={{ fontSize: '10px', color: '#7c3aed', fontWeight: '600', opacity: 0.7 }}>
              {currencySymbol}{Math.round(thresholdAmount)} for free shipping
            </span>
          </div>
        )}
      </div>
    </>
  );
};
