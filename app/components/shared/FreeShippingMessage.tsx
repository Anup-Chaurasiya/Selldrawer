/**
 * Shared Free Shipping Message Component
 * Used in both production cart drawer and Remix preview
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
  const currencySymbol = currency === 'INR' ? '₹' : '$';
  
  const message = remaining > 0
    ? beforeThresholdMessage
        .replace('{threshold}', `${currencySymbol}${Math.round(thresholdAmount)}`)
        .replace('{remaining}', `${currencySymbol}${Math.round(remaining)}`)
    : achievedMessage;

  return (
    <div style={{
      backgroundColor: backgroundColor,
      color: textColor,
      border: `2px solid ${borderColor}`,
      padding: '14px 18px',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      fontSize: '14px',
      fontWeight: '700',
      boxShadow: '0 3px 6px rgba(0, 0, 0, 0.1)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Gradient overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(45deg, rgba(255,255,255,0.2) 0%, transparent 50%)',
        pointerEvents: 'none'
      }} />
      
      {/* Icon */}
      <div style={{
        fontSize: '20px',
        flexShrink: 0,
        position: 'relative',
        zIndex: 1,
        ...(isPreview ? {} : { height: '20px', top: '-8px' })
      }}>
        {icon}
      </div>
      
      {/* Message */}
      <span style={{
        position: 'relative',
        zIndex: 1,
        textShadow: '0 1px 2px rgba(0,0,0,0.1)',
        flex: 1
      }}>
        {message}
      </span>
    </div>
  );
};

