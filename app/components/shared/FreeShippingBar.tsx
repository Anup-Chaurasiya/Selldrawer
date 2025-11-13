/**
 * Shared Free Shipping Progress Bar Component
 * Used in both production cart drawer and Remix preview
 */

import React from 'react';

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
  progressBarColor = '#3b82f6',
  showPercentage = true,
  currency = 'INR',
  cart,
  isPreview = false
}) => {
  // Calculate progress and remaining
  const calculateProgress = () => {
    if (thresholdMode === 'amount' && thresholdAmount) {
      const cartTotal = cart.total_price / 100; // Convert cents to currency
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

  // Format message
  const getMessage = () => {
    if (isComplete) {
      return afterThresholdMessage;
    } else {
      let message = beforeThresholdMessage;
      if (thresholdMode === 'amount') {
        const currencySymbol = currency === 'INR' ? '₹' : '$';
        message = message.replace('{remaining}', `${currencySymbol}${Math.round(remaining)}`);
      } else {
        message = message.replace('{remaining}', `${Math.round(remaining)} more items`);
      }
      return message;
    }
  };

  const message = getMessage();

  // Color gradients
  const backgroundGradient = `linear-gradient(135deg, ${backgroundColor} 0%, ${backgroundColor}dd 100%)`;
  const completeGradient = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
  const incompleteGradient = `linear-gradient(135deg, ${progressBarColor} 0%, ${progressBarColor}dd 100%)`;
  const percentageGradient = isComplete ? completeGradient : incompleteGradient;

  return (
    <div style={{
      marginBottom: isPreview ? '16px' : '20px',
      padding: isPreview ? '12px' : '16px',
      background: backgroundGradient,
      borderRadius: isPreview ? '10px' : '12px',
      border: '1px solid #e2e8f0',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
    }}>
      {/* Progress Text and Percentage */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: isPreview ? '10px' : '12px',
        fontSize: isPreview ? '13px' : '14px',
        fontWeight: '600'
      }}>
        <span style={{ color: '#374151', flex: 1 }}>
          {message}
        </span>
        {showPercentage && (
          <span style={{
            background: percentageGradient,
            color: 'white',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '700',
            boxShadow: `0 2px 4px ${progressBarColor}40`,
            marginLeft: '8px'
          }}>
            {progress.toFixed(0)}%
          </span>
        )}
      </div>

      {/* Progress Bar Track */}
      <div style={{
        width: '100%',
        height: isPreview ? '10px' : '12px',
        borderRadius: isPreview ? '6px' : '8px',
        overflow: 'hidden',
        background: backgroundColor,
        position: 'relative',
        boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        {/* Progress Bar Fill */}
        <div style={{
          width: `${progress}%`,
          height: '100%',
          display: 'block',
          background: isComplete ? completeGradient : incompleteGradient,
          borderRadius: isPreview ? '6px' : '8px',
          transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
        }} />
      </div>
    </div>
  );
};

