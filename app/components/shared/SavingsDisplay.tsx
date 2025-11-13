/**
 * Shared Savings Display Component
 * Used in both production cart drawer and Remix preview
 */

import React from 'react';

interface SavingsDisplayProps {
  message: string;
  amount: number;
  backgroundColor?: string;
  textColor?: string;
  isPreview?: boolean;
}

export const SavingsDisplay: React.FC<SavingsDisplayProps> = ({
  message,
  amount,
  backgroundColor = '#dcfce7',
  textColor = '#15803d',
  isPreview = false
}) => {
  if (amount <= 0) {
    return null;
  }

  // Format money (amount is in cents)
  const formatMoney = (cents: number) => {
    const rupees = cents / 100;
    return `₹${rupees.toFixed(2)}`;
  };

  const formattedMessage = message.replace('{amount}', formatMoney(amount));

  return (
    <div style={{
      backgroundColor: backgroundColor,
      color: textColor,
      padding: isPreview ? '10px 14px' : '12px 16px',
      borderRadius: isPreview ? '8px' : '10px',
      fontSize: isPreview ? '13px' : '14px',
      fontWeight: '600',
      marginBottom: isPreview ? '12px' : '16px',
      textAlign: 'center',
      border: `1px solid ${textColor}40`,
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
    }}>
      {formattedMessage}
    </div>
  );
};

